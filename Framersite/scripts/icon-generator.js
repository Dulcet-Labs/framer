#!/usr/bin/env node

/**
 * Icon Generator for FramerIDE
 * Generates favicons and app icons in various sizes from SVG source
 * 
 * Usage: node scripts/icon-generator.js
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const config = {
    // Source SVG file
    sourceSvg: join(__dirname, '../public/mini-app-model/myApp.svg'),

    // Output directory
    outputDir: join(__dirname, '../public'),

    // Icon sizes to generate
    sizes: {
        favicon: [16, 32, 48],
        apple: [180],
        android: [192, 512],
        general: [96, 144, 256]
    }
};

// Ensure output directory exists
if (!existsSync(config.outputDir)) {
    mkdirSync(config.outputDir, { recursive: true });
}

/**
 * Generate PNG from SVG at specified size
 */
async function generatePng(svgBuffer, size, outputPath) {
    try {
        await sharp(svgBuffer)
            .resize(size, size, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png()
            .toFile(outputPath);

        console.log(`✅ Generated: ${outputPath} (${size}x${size})`);
    } catch (error) {
        console.error(`❌ Failed to generate ${outputPath}:`, error.message);
    }
}

/**
 * Generate ICO file (multi-size favicon)
 */
async function generateIco(svgBuffer, sizes, outputPath) {
    try {
        // Generate PNGs for each size
        const pngBuffers = await Promise.all(
            sizes.map(size =>
                sharp(svgBuffer)
                    .resize(size, size, {
                        fit: 'contain',
                        background: { r: 0, g: 0, b: 0, alpha: 0 }
                    })
                    .png()
                    .toBuffer()
            )
        );

        // For now, just save the largest as favicon.ico
        // (True ICO generation requires additional library)
        await sharp(svgBuffer)
            .resize(32, 32, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png()
            .toFile(outputPath);

        console.log(`✅ Generated: ${outputPath}`);
    } catch (error) {
        console.error(`❌ Failed to generate ${outputPath}:`, error.message);
    }
}

/**
 * Generate web app manifest
 */
function generateManifest() {
    const manifest = {
        name: 'FramerIDE',
        short_name: 'FramerIDE',
        description: 'The next gen environment for building DApps & Mini Apps on Base',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0052FF',
        icons: [
            {
                src: '/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any maskable'
            },
            {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable'
            }
        ]
    };

    const manifestPath = join(config.outputDir, 'manifest.json');
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`✅ Generated: ${manifestPath}`);
}

/**
 * Main execution
 */
async function main() {
    console.log('🎨 FramerIDE Icon Generator\n');

    // Check if source SVG exists
    if (!existsSync(config.sourceSvg)) {
        console.error(`❌ Source SVG not found: ${config.sourceSvg}`);
        process.exit(1);
    }

    // Read source SVG
    const svgBuffer = readFileSync(config.sourceSvg);
    console.log(`📄 Source: ${config.sourceSvg}\n`);

    // Generate favicon.ico
    console.log('Generating favicons...');
    await generateIco(
        svgBuffer,
        config.sizes.favicon,
        join(config.outputDir, 'favicon.ico')
    );

    // Generate individual favicon sizes
    for (const size of config.sizes.favicon) {
        await generatePng(
            svgBuffer,
            size,
            join(config.outputDir, `favicon-${size}x${size}.png`)
        );
    }

    // Generate Apple Touch Icon
    console.log('\nGenerating Apple Touch Icons...');
    for (const size of config.sizes.apple) {
        await generatePng(
            svgBuffer,
            size,
            join(config.outputDir, `apple-touch-icon.png`)
        );
    }

    // Generate Android/PWA icons
    console.log('\nGenerating Android/PWA icons...');
    for (const size of config.sizes.android) {
        await generatePng(
            svgBuffer,
            size,
            join(config.outputDir, `icon-${size}.png`)
        );
    }

    // Generate general purpose icons
    console.log('\nGenerating general icons...');
    for (const size of config.sizes.general) {
        await generatePng(
            svgBuffer,
            size,
            join(config.outputDir, `icon-${size}.png`)
        );
    }

    // Generate manifest
    console.log('\nGenerating manifest...');
    generateManifest();

    console.log('\n✨ Icon generation complete!\n');
    console.log('Generated files:');
    console.log('  - favicon.ico');
    console.log('  - favicon-*.png (16, 32, 48)');
    console.log('  - apple-touch-icon.png (180x180)');
    console.log('  - icon-*.png (96, 144, 192, 256, 512)');
    console.log('  - manifest.json');
}

// Run the generator
main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
});
