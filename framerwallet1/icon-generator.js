const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SVG_PATH = path.join(__dirname, 'logo.svg');
const ICONS_DIR = path.join(__dirname, 'icons');

// Ensure icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR);
}

async function generateIcons() {
    try {
        console.log('Generating icons...');

        // Helper to generate padded icon
        const createIcon = async (size, filename) => {
            const logoSize = Math.round(size * 0.6); // Logo is 60% of total size
            const padding = Math.round((size - logoSize) / 2);

            await sharp(SVG_PATH)
                .resize(logoSize, logoSize)
                .extend({
                    top: padding,
                    bottom: padding,
                    left: padding,
                    right: padding,
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                // Resize again to ensure exact dimensions in case of rounding errors
                .resize(size, size)
                .png()
                .toFile(path.join(ICONS_DIR, filename));

            console.log(`✅ Generated icons/${filename}`);
        };

        // Generate 192x192
        await createIcon(192, 'icon-192.png');

        // Generate 512x512
        await createIcon(512, 'icon-512.png');

        console.log('Icon generation complete!');
    } catch (error) {
        console.error('Error generating icons:', error);
    }
}

generateIcons();
