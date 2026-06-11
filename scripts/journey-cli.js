#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const projectRoot = path.join(__dirname, '..');
const port = process.env.PORT || 3000;
const url = `http://localhost:${port}`;

const help = `Usage: journey [command]

Commands:
  start     Start the production server (default)
  build     Build the Next.js app
  dev       Start the development server
  help      Show this message

Environment:
  PORT      Port to run on (default: 3000)
`;

const cmd = process.argv[2] || 'start';

if (cmd === 'help') {
  console.log(help);
  process.exit(0);
}

if (cmd === 'build') {
  console.log(`Building Journey...`);
  execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' });
  process.exit(0);
}

if (cmd === 'dev') {
  console.log(`\x1b[36mJourney Dev\x1b[0m`);
  const dev = spawn('npx', ['next', 'dev', '-p', port], {
    cwd: projectRoot, stdio: 'inherit', shell: true,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }
  });
  dev.on('error', (err) => { console.error(err); process.exit(1); });
  process.exit(0);
}

console.log(`\x1b[36mJourney\x1b[0m`);

if (!fs.existsSync(path.join(projectRoot, '.next'))) {
  console.log(`No build found. Building first...`);
  try {
    execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' });
  } catch (err) {
    console.error('Build failed. Run `journey build` to retry.');
    process.exit(1);
  }
}

console.log(`Launching Journey on ${url}...`);

const nextStart = spawn('npx', ['next', 'start', '-p', port], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }
});

setTimeout(() => {
  const openCmd = os.platform() === 'win32' ? 'start' : os.platform() === 'darwin' ? 'open' : 'xdg-open';
  spawn(openCmd, [url]);
}, 2000);

nextStart.on('error', (err) => {
  console.error('Failed to start Journey:', err);
  process.exit(1);
});
