import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'public', 'og-image-source.png');
const pngOut = path.join(root, 'public', 'og-image.png');
const jpgOut = path.join(root, 'public', 'og-image.jpg');
const previewOut = path.join(root, 'public', 'og-preview.jpg');

if (!fs.existsSync(source)) {
  console.error('Missing public/og-image-source.png — add the master artwork first.');
  process.exit(1);
}

const resize = { width: 1200, height: 630, fit: 'cover', position: 'centre' };

await sharp(source).resize(resize).png({ compressionLevel: 9, quality: 92 }).toFile(pngOut);

await sharp(source).resize(resize).jpeg({ quality: 90, mozjpeg: true }).toFile(jpgOut);

await sharp(source).resize(resize).jpeg({ quality: 90, mozjpeg: true }).toFile(previewOut);

const pngMeta = await sharp(pngOut).metadata();
const jpgStat = fs.statSync(jpgOut);

console.log(`og-image.png: ${pngMeta.width}x${pngMeta.height}, ${fs.statSync(pngOut).size} bytes`);
console.log(`og-image.jpg: ${jpgStat.size} bytes`);
console.log(`og-preview.jpg: ${fs.statSync(previewOut).size} bytes (used in og:image meta)`);
