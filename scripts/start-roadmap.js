#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Use ~/.journey as the data home for NPM-installed versions
const JOURNEY_HOME = path.join(os.homedir(), '.journey');
const DATA_DIR = path.join(JOURNEY_HOME, 'data');
const LOCAL_DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure the global data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Copy default roadmap if it doesn't exist in the global home
const roadmapFile = 'roadmap.json';
const globalRoadmapPath = path.join(DATA_DIR, roadmapFile);
const localRoadmapPath = path.join(LOCAL_DATA_DIR, roadmapFile);

if (!fs.existsSync(globalRoadmapPath) && fs.existsSync(localRoadmapPath)) {
  fs.copyFileSync(localRoadmapPath, globalRoadmapPath);
}

const projectRoot = path.join(__dirname, '..');
const port = process.env.PORT || 6161;

console.log(`\x1b[36mJourney Roadmap Portal\x1b[0m`);
console.log(`Using data from: ${JOURNEY_HOME}`);
console.log(`Starting portal on http://localhost:${port}...`);

if (!fs.existsSync(path.join(projectRoot, '.next'))) {
  console.log('No build found. Run `npm run build` first.');
  process.exit(1);
}

const nextStart = spawn('npx', ['next', 'start', '-p', port], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true,
  env: { 
    ...process.env, 
    NEXT_TELEMETRY_DISABLED: '1',
    // Inject the global data path into the environment so the app can find it
    JOURNEY_DATA_PATH: DATA_DIR 
  }
});

nextStart.on('error', (err) => {
  console.error('Failed to start Next.js:', err);
  process.exit(1);
});

nextStart.on('close', (code) => {
  if (code !== 0) {
    console.log(`Next.js process exited with code ${code}.`);
  }
  process.exit(code);
});
