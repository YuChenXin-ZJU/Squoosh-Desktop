const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

if (process.platform !== 'win32') {
  console.log('Portable build is only generated on Windows.');
  process.exit(0);
}

const root = path.join(__dirname, '..');
const tauriConfig = require(path.join(root, 'src-tauri', 'tauri.conf.json'));
const productName = tauriConfig.package?.productName || 'Squoosh-Desktop';
const version = tauriConfig.package?.version || '0.0.0';
const exeName = `${productName}.exe`;

const exePath = path.join(root, 'src-tauri', 'target', 'release', exeName);
const buildDir = path.join(root, 'build');
const releaseDir = path.join(root, 'release-Squoosh-Desktop');
const portableDir = path.join(releaseDir, 'portable');
const portableExe = path.join(portableDir, exeName);
const portableBuild = path.join(portableDir, 'build');
const zipPath = path.join(
  releaseDir,
  `${productName}_${version}_x64_portable.zip`,
);

if (!fs.existsSync(exePath)) {
  console.error(`Missing ${exePath}. Run "npm run tauri:build" first.`);
  process.exit(1);
}

if (!fs.existsSync(buildDir)) {
  console.error(`Missing ${buildDir}. Run "npm run build" first.`);
  process.exit(1);
}

fs.rmSync(portableDir, { recursive: true, force: true });
fs.mkdirSync(portableDir, { recursive: true });
fs.copyFileSync(exePath, portableExe);
fs.cpSync(buildDir, portableBuild, { recursive: true });

if (fs.existsSync(zipPath)) {
  fs.rmSync(zipPath);
}

const zipResult = spawnSync(
  'powershell',
  [
    '-NoProfile',
    '-NonInteractive',
    '-Command',
    `Compress-Archive -Path "${portableDir}\\*" -DestinationPath "${zipPath}" -Force`,
  ],
  { stdio: 'inherit' },
);

if (zipResult.status !== 0) {
  console.error('Failed to create portable zip archive.');
  process.exit(zipResult.status ?? 1);
}

console.log(`Portable output: ${portableDir}`);
console.log(`Portable zip: ${zipPath}`);
