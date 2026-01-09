const fs = require('fs');
const path = require('path');

const target = process.argv[2] || 'build';
const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function isPng(buffer) {
  return buffer.length >= 8 && buffer.subarray(0, 8).equals(signature);
}

function stripIccp(buffer) {
  if (!isPng(buffer)) return { changed: false, buffer };

  let offset = 8;
  const chunks = [signature];
  let changed = false;

  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const chunkEnd = offset + 12 + length;
    if (chunkEnd > buffer.length) break;

    if (type === 'iCCP') {
      changed = true;
    } else {
      chunks.push(buffer.subarray(offset, chunkEnd));
    }
    offset = chunkEnd;
  }

  if (!changed) return { changed: false, buffer };
  return { changed: true, buffer: Buffer.concat(chunks) };
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!fullPath.toLowerCase().endsWith('.png')) continue;

    const buffer = fs.readFileSync(fullPath);
    const result = stripIccp(buffer);
    if (result.changed) {
      fs.writeFileSync(fullPath, result.buffer);
      console.log(`Stripped iCCP: ${fullPath}`);
    }
  }
}

if (!fs.existsSync(target)) {
  console.log(`strip-icc: "${target}" does not exist, skipping.`);
  process.exit(0);
}

walk(target);
