import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'public', 'og-image-source.png');
const socialCard = path.join(root, 'public', 'social-card.jpg');
const pngOut = path.join(root, 'public', 'og-image.png');
const jpgOut = path.join(root, 'public', 'og-image.jpg');

const BG = { r: 10, g: 12, b: 16, alpha: 1 };
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const TARGET_RATIO = OG_WIDTH / OG_HEIGHT;

if (!fs.existsSync(source)) {
  console.error('Missing public/og-image-source.png');
  process.exit(1);
}

const meta = await sharp(source).metadata();
const paddedWidth = Math.round(meta.height * TARGET_RATIO);
const padTotal = Math.max(0, paddedWidth - meta.width);
const padLeft = Math.floor(padTotal / 2);
const padRight = padTotal - padLeft;

const padded = await sharp(source)
  .extend({ left: padLeft, right: padRight, background: BG })
  .png()
  .toBuffer();

await sharp(padded).resize(OG_WIDTH, OG_HEIGHT).jpeg({ quality: 92, mozjpeg: true }).toFile(socialCard);
await sharp(padded).resize(OG_WIDTH, OG_HEIGHT).jpeg({ quality: 90, mozjpeg: true }).toFile(jpgOut);
await sharp(padded).resize(OG_WIDTH, OG_HEIGHT).png({ compressionLevel: 9 }).toFile(pngOut);

for (const [label, file] of [
  ['social-card.jpg', socialCard],
  ['og-image.jpg', jpgOut],
  ['og-image.png', pngOut],
]) {
  const out = await sharp(file).metadata();
  const size = fs.statSync(file).size;
  console.log(`${label}: ${out.width}x${out.height}, ${size} bytes`);
}
