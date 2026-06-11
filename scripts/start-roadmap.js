#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectRoot = path.join(__dirname, '..');
const port = process.env.PORT || 6060;

console.log(`\x1b[36mJourney Roadmap Portal\x1b[0m`);
console.log(`Starting portal on http://localhost:${port}...`);

if (!fs.existsSync(path.join(projectRoot, '.next'))) {
  console.log('No build found. Run `npm run build` first.');
  process.exit(1);
}

const nextStart = spawn('npx', ['next', 'start', '-p', port], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }
});

nextStart.on('error', (err) => {
  console.error('Failed to start Next.js:', err);
  process.exit(1);
});

nextStart.on('close', (code) => {
  if (code !== 0) {
    console.log(`Next.js process exited with code ${code}. Did you run 'npm run build' first?`);
  }
  process.exit(code);
});
