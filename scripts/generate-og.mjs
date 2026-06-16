import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const svg = path.join(root, 'public', 'og-image.svg');
const pngOut = path.join(root, 'public', 'og-image.png');
const jpgOut = path.join(root, 'public', 'og-image.jpg');

await sharp(svg)
  .resize(1200, 630, { fit: 'fill' })
  .png({ compressionLevel: 9, quality: 90 })
  .toFile(pngOut);

await sharp(svg)
  .resize(1200, 630, { fit: 'fill' })
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile(jpgOut);

const pngMeta = await sharp(pngOut).metadata();
const jpgStat = await import('fs').then((fs) => fs.statSync(jpgOut));

console.log(`og-image.png: ${pngMeta.width}x${pngMeta.height}`);
console.log(`og-image.jpg: ${jpgStat.size} bytes`);
