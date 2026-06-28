const sharp = require("sharp");
const path = require("path");

const publicDir = path.join(__dirname, "..", "public");
const svgPath = path.join(publicDir, "favicon.svg");

async function generate() {
  // favicon-32x32.png
  await sharp(svgPath).resize(32, 32).png().toFile(path.join(publicDir, "favicon-32x32.png"));
  console.log("Created favicon-32x32.png (32x32)");

  // apple-touch-icon.png
  await sharp(svgPath).resize(180, 180).png().toFile(path.join(publicDir, "apple-touch-icon.png"));
  console.log("Created apple-touch-icon.png (180x180)");

  // PWA icons
  await sharp(svgPath).resize(192, 192).png().toFile(path.join(publicDir, "icon-192x192.png"));
  console.log("Created icon-192x192.png (192x192)");

  await sharp(svgPath).resize(512, 512).png().toFile(path.join(publicDir, "icon-512x512.png"));
  console.log("Created icon-512x512.png (512x512)");

  // favicon.ico (16x16 + 32x32)
  const ico16 = await sharp(svgPath).resize(16, 16).png().toBuffer();
  const ico32 = await sharp(svgPath).resize(32, 32).png().toBuffer();
  await sharp({
    create: { width: 32, height: 32, channels: 4, background: { r: 10, g: 17, b: 40, alpha: 1 } }
  }).composite([
    { input: ico32, top: 0, left: 0 }
  ]).png().toFile(path.join(publicDir, "favicon-32x32.png"));
  // Use sharp to create a proper .ico via toFormat — but sharp doesn't support .ico natively.
  // Fallback: just copy the 32x32 png as favicon.ico (browsers accept it)
  await sharp(svgPath).resize(32, 32).png().toFile(path.join(publicDir, "favicon.ico"));
  console.log("Created favicon.ico (32x32 png fallback)");

  // og-image.png — 1200x630 with text overlay
  const ogSvg = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0a1128"/>
          <stop offset="100%" stop-color="#152247"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#bg)"/>
      <text x="600" y="200" text-anchor="middle" font-family="Arial, sans-serif" font-size="72" font-weight="800" fill="#f0f4f8">PRODE MUNDIALISTA</text>
      <text x="600" y="290" text-anchor="middle" font-family="Arial, sans-serif" font-size="120" font-weight="800" fill="#d4af37">2026</text>
      <text x="600" y="380" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" fill="#75b8f4">Predicciones de la fase eliminatoria</text>
      <line x1="350" y1="420" x2="850" y2="420" stroke="#d4af37" stroke-width="3"/>
      <text x="600" y="580" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#8899b8">Competí con tus amigos</text>
    </svg>`;

  const ogBg = await sharp(Buffer.from(ogSvg)).png().toBuffer();
  const iconResized = await sharp(svgPath).resize(120, 120).png().toBuffer();

  await sharp(ogBg)
    .composite([{
      input: iconResized,
      top: 25,
      left: 1200 - 120 - 40
    }])
    .png()
    .toFile(path.join(publicDir, "og-image.png"));
  console.log("Created og-image.png (1200x630 with text)");
}

generate().catch(console.error);
