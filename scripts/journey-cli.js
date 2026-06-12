#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const net = require('net');

const projectRoot = path.join(__dirname, '..');
const JOURNEY_HOME = path.join(os.homedir(), '.journey');
const PID_FILE = path.join(JOURNEY_HOME, 'journey.pid');
const LOG_FILE = path.join(JOURNEY_HOME, 'out.log');

const help = `Usage: journey [command]

Commands:
  start     Start the portal in background (default)
  stop      Stop the background portal
  status    Check if the portal is running
  restart   Restart the background portal
  logs      Show recent logs
  build     Build the Next.js app
  dev       Start the development server (foreground)
  help      Show this message

Environment:
  PORT      Port to run on (default: 6161)
`;

async function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port, '0.0.0.0');
  });
}

function getPid() {
  if (fs.existsSync(PID_FILE)) {
    try {
      return parseInt(fs.readFileSync(PID_FILE, 'utf-8'), 10);
    } catch (err) {
      return null;
    }
  }
  return null;
}

function isProcessRunning(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return false;
  }
}

function stopJourney() {
  const pid = getPid();
  if (isProcessRunning(pid)) {
    console.log(`Stopping Journey (PID: ${pid})...`);
    try {
      // Try to kill the whole process group
      process.kill(-pid, 'SIGTERM');
    } catch (e) {
      try { process.kill(pid, 'SIGTERM'); } catch (err) {}
    }
    
    // Give it a moment to stop
    let attempts = 0;
    while (isProcessRunning(pid) && attempts < 10) {
        attempts++;
        // Sync wait
        execSync('sleep 0.2');
    }
    
    if (isProcessRunning(pid)) {
        try { process.kill(pid, 'SIGKILL'); } catch (err) {}
    }

    if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
    console.log(`\x1b[32mJourney stopped.\x1b[0m`);
    return true;
  } else {
    console.log(`Journey is not running.`);
    return false;
  }
}

async function run() {
  const cmd = process.argv[2] || 'start';

  if (!fs.existsSync(JOURNEY_HOME)) {
    fs.mkdirSync(JOURNEY_HOME, { recursive: true });
  }

  if (cmd === 'help') {
    console.log(help);
    process.exit(0);
  }

  if (cmd === 'status') {
    const pid = getPid();
    if (isProcessRunning(pid)) {
      console.log(`\x1b[32mJourney is running (PID: ${pid})\x1b[0m`);
      // Try to get port from pid or log if needed, but for now just status
    } else {
      console.log(`\x1b[31mJourney is not running.\x1b[0m`);
    }
    process.exit(0);
  }

  if (cmd === 'stop') {
    stopJourney();
    process.exit(0);
  }

  if (cmd === 'restart') {
    stopJourney();
    // Continue to start...
  } else if (cmd === 'logs') {
    if (fs.existsSync(LOG_FILE)) {
        console.log(`Showing last 50 lines of ${LOG_FILE}:`);
        console.log(execSync(`tail -n 50 ${LOG_FILE}`).toString());
    } else {
        console.log("No log file found.");
    }
    process.exit(0);
  } else if (cmd === 'build') {
    console.log(`Building Journey...`);
    execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' });
    process.exit(0);
  } else if (cmd === 'dev') {
    console.log(`\x1b[36mJourney Dev Mode\x1b[0m`);
    const dev = spawn('npx', ['next', 'dev', '-p', '3000'], {
      cwd: projectRoot, 
      stdio: 'inherit',
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }
    });
    dev.on('error', (err) => { console.error(err); process.exit(1); });
    return;
  }

  // Handle 'start' or 'restart'
  const existingPid = getPid();
  if (cmd !== 'restart' && isProcessRunning(existingPid)) {
    console.log(`\x1b[33mJourney is already running (PID: ${existingPid})\x1b[0m`);
    console.log(`Use 'journey stop' to stop it or 'journey restart' to restart.`);
    process.exit(0);
  }

  let port = parseInt(process.env.PORT || '6161', 10);
  if (!(await isPortAvailable(port))) {
    if (process.env.PORT) {
        console.error(`\x1b[31mError: Port ${port} is already in use.\x1b[0m`);
        process.exit(1);
    }
    // Auto-find next port
    port = port + 1;
    while (!(await isPortAvailable(port))) { port++; }
  }

  console.log(`\x1b[36mJourney Portal\x1b[0m`);
  
  if (!fs.existsSync(path.join(projectRoot, '.next'))) {
    console.log(`Initial build required...`);
    try {
      execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' });
    } catch (err) {
      process.exit(1);
    }
  }

  console.log(`Starting Journey on http://localhost:${port} in background...`);

  const out = fs.openSync(LOG_FILE, 'a');
  const err = fs.openSync(LOG_FILE, 'a');

  const child = spawn('npx', ['next', 'start', '-p', port.toString()], {
    cwd: projectRoot,
    detached: true,
    stdio: ['ignore', out, err],
    env: { 
      ...process.env, 
      NEXT_TELEMETRY_DISABLED: '1',
      JOURNEY_DATA_PATH: path.join(JOURNEY_HOME, 'data')
    }
  });

  child.unref();
  fs.writeFileSync(PID_FILE, child.pid.toString());

  console.log(`\x1b[32mJourney launched. (PID: ${child.pid})\x1b[0m`);
  console.log(`Logs: ${LOG_FILE}`);

  // Small delay to ensure it starts before opening browser
  setTimeout(() => {
    const url = `http://localhost:${port}`;
    console.log(`Opening ${url}...`);
    const openCmd = os.platform() === 'win32' ? 'start' : os.platform() === 'darwin' ? 'open' : 'xdg-open';
    spawn(openCmd, [url], { shell: os.platform() === 'win32' });
    process.exit(0);
  }, 2000);
}

run();
