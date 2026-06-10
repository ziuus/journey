#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const projectRoot = path.join(__dirname, '..');
const port = 3000;
const url = `http://localhost:${port}`;

console.log(`\x1b[36mJourney CLI\x1b[0m`);
console.log(`Launching Journey on ${url}...`);

// Start next start
const nextStart = spawn('npx', ['next', 'start', '-p', port], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }
});

// Open browser after a short delay
setTimeout(() => {
  const openCmd = os.platform() === 'win32' ? 'start' : os.platform() === 'darwin' ? 'open' : 'xdg-open';
  spawn(openCmd, [url]);
}, 2000);

nextStart.on('error', (err) => {
  console.error('Failed to start Journey:', err);
  process.exit(1);
});
