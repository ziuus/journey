#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectRoot = path.join(__dirname, '..');

console.log('\x1b[36mJourney installed!\x1b[0m');

if (process.env.CI || process.env.npm_config_global) {
  console.log('Run \x1b[33mnpm run build\x1b[0m to build the Next.js app.');
  console.log('Then run \x1b[33mjourney\x1b[0m to start.');
  process.exit(0);
}

try {
  execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' });
} catch (err) {
  console.log('\x1b[33mCould not auto-build. Run `npm run build` manually.\x1b[0m');
}
