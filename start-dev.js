/**
 * Unified dev runner: launches both server and client
 */
const { spawn } = require('child_process');
const path = require('path');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

console.log('====================================================');
console.log('🍃 Starting BookLeaf Author Support Portal');
console.log('====================================================');

// Spawn Server
const server = spawn(npmCmd, ['run', 'start'], {
  cwd: path.resolve(__dirname, 'server'),
  stdio: 'inherit',
  shell: true
});

// Spawn Client
const client = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.resolve(__dirname, 'client'),
  stdio: 'inherit',
  shell: true
});

function cleanup() {
  console.log('\nShutting down BookLeaf processes...');
  server.kill();
  client.kill();
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
