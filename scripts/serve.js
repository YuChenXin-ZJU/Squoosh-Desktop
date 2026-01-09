const { spawn } = require('child_process');
const path = require('path');

const port = process.env.DEV_PORT || '5000';
const serveBin = path.join(
  __dirname,
  '..',
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'serve.cmd' : 'serve',
);
const configPath = path.join(__dirname, '..', 'serve.json');
const staticPath = path.join(__dirname, '..', '.tmp', 'build', 'static');

const args = ['--listen', port, '--config', configPath, staticPath];
const proc = spawn(serveBin, args, { stdio: 'inherit' });

proc.on('exit', (code) => {
  process.exit(code ?? 1);
});
