// Icon generation script
// Run: node scripts/generate-icons.js

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icon that can be used as PNG fallback
const generateSVG = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6"/>
      <stop offset="100%" style="stop-color:#1d4ed8"/>
    </linearGradient>
    <linearGradient id="plane" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff"/>
      <stop offset="100%" style="stop-color:#e0e7ff"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#bg)"/>
  <g transform="translate(${size * 0.15}, ${size * 0.15}) scale(${size / 512 * 0.7})">
    <path fill="url(#plane)" d="M432.8 64.8L347.2 150.4L112 64L64 112L251.2 208L166.4 292.8L96 272L64 304L160 352L208 448L240 416L220.8 345.6L304 260.8L400 448L448 400L361.6 164.8L447.2 79.2C459.2 67.2 459.2 48 447.2 36L475.2 8C463.2-4 444.8-4 432.8 8V64.8Z"/>
  </g>
</svg>`;

// Generate maskable icon (with padding for safe zone)
const generateMaskableSVG = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6"/>
      <stop offset="100%" style="stop-color:#1d4ed8"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)"/>
  <g transform="translate(${size * 0.25}, ${size * 0.25}) scale(${size / 512 * 0.5})">
    <path fill="white" d="M432.8 64.8L347.2 150.4L112 64L64 112L251.2 208L166.4 292.8L96 272L64 304L160 352L208 448L240 416L220.8 345.6L304 260.8L400 448L448 400L361.6 164.8L447.2 79.2C459.2 67.2 459.2 48 447.2 36L475.2 8C463.2-4 444.8-4 432.8 8V64.8Z"/>
  </g>
</svg>`;

// Generate Apple Touch Icon
const generateAppleTouchIcon = () => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6"/>
      <stop offset="100%" style="stop-color:#1d4ed8"/>
    </linearGradient>
  </defs>
  <rect width="180" height="180" fill="url(#bg)"/>
  <g transform="translate(36, 36) scale(0.21)">
    <path fill="white" d="M432.8 64.8L347.2 150.4L112 64L64 112L251.2 208L166.4 292.8L96 272L64 304L160 352L208 448L240 416L220.8 345.6L304 260.8L400 448L448 400L361.6 164.8L447.2 79.2C459.2 67.2 459.2 48 447.2 36L475.2 8C463.2-4 444.8-4 432.8 8V64.8Z"/>
  </g>
</svg>`;

// Generate favicons
const generateFavicon32 = () => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="4" fill="#3b82f6"/>
  <g transform="translate(4, 4) scale(0.047)">
    <path fill="white" d="M432.8 64.8L347.2 150.4L112 64L64 112L251.2 208L166.4 292.8L96 272L64 304L160 352L208 448L240 416L220.8 345.6L304 260.8L400 448L448 400L361.6 164.8L447.2 79.2C459.2 67.2 459.2 48 447.2 36L475.2 8C463.2-4 444.8-4 432.8 8V64.8Z"/>
  </g>
</svg>`;

const generateFavicon16 = () => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
  <rect width="16" height="16" rx="2" fill="#3b82f6"/>
  <g transform="translate(2, 2) scale(0.023)">
    <path fill="white" d="M432.8 64.8L347.2 150.4L112 64L64 112L251.2 208L166.4 292.8L96 272L64 304L160 352L208 448L240 416L220.8 345.6L304 260.8L400 448L448 400L361.6 164.8L447.2 79.2C459.2 67.2 459.2 48 447.2 36L475.2 8C463.2-4 444.8-4 432.8 8V64.8Z"/>
  </g>
</svg>`;

// Write icons
console.log('Generating icons...');

sizes.forEach(size => {
  const filename = `icon-${size}.svg`;
  fs.writeFileSync(path.join(iconsDir, filename), generateSVG(size));
  console.log(`Created ${filename}`);
});

fs.writeFileSync(path.join(iconsDir, 'maskable-512.svg'), generateMaskableSVG(512));
console.log('Created maskable-512.svg');

fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.svg'), generateAppleTouchIcon());
console.log('Created apple-touch-icon.svg');

fs.writeFileSync(path.join(iconsDir, 'favicon-32x32.svg'), generateFavicon32());
console.log('Created favicon-32x32.svg');

fs.writeFileSync(path.join(iconsDir, 'favicon-16x16.svg'), generateFavicon16());
console.log('Created favicon-16x16.svg');

console.log('\nDone generating SVGs!');
console.log('\nConverting to PNG...');

// Convert SVGs to PNGs
async function convertToPNG() {
  try {
    for (const size of sizes) {
      const svgPath = path.join(iconsDir, `icon-${size}.svg`);
      const pngPath = path.join(iconsDir, `icon-${size}.png`);
      
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(pngPath);
      
      console.log(`Converted icon-${size}.png`);
    }

    // Maskable icon
    await sharp(path.join(iconsDir, 'maskable-512.svg'))
      .resize(512, 512)
      .png()
      .toFile(path.join(iconsDir, 'maskable-512.png'));
    console.log('Converted maskable-512.png');

    // Apple touch icon
    await sharp(path.join(iconsDir, 'apple-touch-icon.svg'))
      .resize(180, 180)
      .png()
      .toFile(path.join(iconsDir, 'apple-touch-icon.png'));
    console.log('Converted apple-touch-icon.png');

    // Favicons
    await sharp(path.join(iconsDir, 'favicon-32x32.svg'))
      .resize(32, 32)
      .png()
      .toFile(path.join(iconsDir, 'favicon-32x32.png'));
    console.log('Converted favicon-32x32.png');

    await sharp(path.join(iconsDir, 'favicon-16x16.svg'))
      .resize(16, 16)
      .png()
      .toFile(path.join(iconsDir, 'favicon-16x16.png'));
    console.log('Converted favicon-16x16.png');

    // Also create a badge icon for notifications
    await sharp(path.join(iconsDir, 'icon-72.svg'))
      .resize(72, 72)
      .png()
      .toFile(path.join(iconsDir, 'badge-72.png'));
    console.log('Created badge-72.png');

    console.log('\nAll icons generated successfully!');
  } catch (error) {
    console.error('Error converting icons:', error);
  }
}

convertToPNG();
