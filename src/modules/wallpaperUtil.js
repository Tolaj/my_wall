import { getWallpaper, setWallpaper } from 'wallpaper';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Store original wallpaper
let originalWallpaper = null;
const tempDir = path.join(os.tmpdir(), 'desktop-widgets-wallpapers');

// Ensure temp directory exists
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

/**
 * Initialize wallpaper manager - stores original wallpaper
 */
export async function initializeWallpaper() {
    try {
        originalWallpaper = await getWallpaper();
        // console.log('Original wallpaper stored:', originalWallpaper);
        cleanupTempWallpapers();
        return originalWallpaper;
    } catch (error) {
        console.error('Error storing original wallpaper:', error);
        return null;
    }
}

/**
 * Get the stored original wallpaper path
 */
export function getOriginalWallpaper() {
    return originalWallpaper;
}

/**
 * Get current system wallpaper
 */
export async function getCurrentWallpaper() {
    try {
        const currentWallpaper = await getWallpaper();
        console.log('Current system wallpaper:', currentWallpaper);
        return currentWallpaper;
    } catch (error) {
        console.error('Error getting current wallpaper:', error);
        return null;
    }
}

/**
 * Process wallpaper image with opacity and blur effects
 * @param {string} imagePath - Path to the original image
 * @param {number} opacity - Opacity (0-100)
 * @param {number} blur - Blur amount in pixels
 * @returns {Promise<string>} - Path to processed image
 */
async function processWallpaper(imagePath, opacity = 100, blur = 0) {
    try {
        const timestamp = Date.now();
        const outputPath = path.join(tempDir, `wallpaper-${timestamp}.png`);

        let image = sharp(imagePath);

        // Get image metadata
        const metadata = await image.metadata();

        // Apply blur if needed
        if (blur > 0) {
            image = image.blur(blur);
        }

        // Apply opacity if needed
        if (opacity < 100) {
            const alphaValue = Math.round((opacity / 100) * 255);

            // Ensure image has alpha channel and adjust opacity
            image = image.ensureAlpha().composite([{
                input: Buffer.from([255, 255, 255, 255 - alphaValue]),
                raw: {
                    width: 1,
                    height: 1,
                    channels: 4
                },
                tile: true,
                blend: 'dest-in'
            }]);
        }

        // Save processed image
        await image.png().toFile(outputPath);

        // console.log('✓ Wallpaper processed:', outputPath);
        // console.log('  Original:', imagePath);
        // console.log('  Blur:', blur, 'px');
        // console.log('  Opacity:', opacity, '%');

        return outputPath;

    } catch (error) {
        console.error('Error processing wallpaper:', error);
        throw error;
    }
}

/**
 * Apply wallpaper with settings
 * @param {string} imagePath - Path to wallpaper image
 * @param {Object} theme - Theme settings containing fitMode, opacity, blur
 * @returns {Promise<boolean>} - Success status
 */
export async function applyWallpaper(imagePath, theme = {}) {
    try {
        // Check if file exists
        if (!fs.existsSync(imagePath)) {
            console.error('Wallpaper file does not exist:', imagePath);
            throw new Error('File not found');
        }

        const opacity = theme.opacity ?? 100;
        const blur = theme.blur ?? 0;

        // Process image if opacity or blur effects are needed
        let processedImagePath = imagePath;
        if (opacity < 100 || blur > 0) {
            processedImagePath = await processWallpaper(imagePath, opacity, blur);
        }

        // Map fitMode to wallpaper package scale options
        const fitModeMap = {
            'cover': 'fill',
            'contain': 'fit',
            'fill': 'stretch',
            'center': 'center'
        };

        const scale = fitModeMap[theme.fitMode] || 'fill';

        // Set the wallpaper with scale option
        await setWallpaper(processedImagePath, { scale });

        // console.log('✓ Wallpaper set successfully');
        // console.log('  Original:', imagePath);
        // console.log('  Processed:', processedImagePath);
        // console.log('  Scale mode:', scale);
        // console.log('  Opacity:', opacity, '%');
        // console.log('  Blur:', blur, 'px');

        return true;

    } catch (error) {
        console.error('✗ Error setting wallpaper:', error);
        throw error;
    }
}

/**
 * Restore original wallpaper
 * @returns {Promise<boolean>} - Success status
 */
export async function restoreOriginalWallpaper() {
    try {
        if (originalWallpaper) {
            await setWallpaper(originalWallpaper);
            // console.log('✓ Original wallpaper restored:', originalWallpaper);
            return true;
        } else {
            console.log('No original wallpaper stored');
            return false;
        }
    } catch (error) {
        console.error('Error restoring wallpaper:', error);
        throw error;
    }
}

/**
 * Clean up old temporary wallpaper files
 */
function cleanupTempWallpapers() {
    try {
        if (fs.existsSync(tempDir)) {
            const files = fs.readdirSync(tempDir);
            const now = Date.now();
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours

            files.forEach(file => {
                const filePath = path.join(tempDir, file);
                const stats = fs.statSync(filePath);

                if (now - stats.mtimeMs > maxAge) {
                    fs.unlinkSync(filePath);
                    console.log('Cleaned up old wallpaper:', file);
                }
            });
        }
    } catch (error) {
        console.error('Error cleaning up temp wallpapers:', error);
    }
}

/**
 * Clean up all temporary wallpaper files
 */
export function cleanupAllTempWallpapers() {
    try {
        if (fs.existsSync(tempDir)) {
            const files = fs.readdirSync(tempDir);
            files.forEach(file => {
                const filePath = path.join(tempDir, file);
                fs.unlinkSync(filePath);
            });
            console.log('Cleaned up all temporary wallpapers');
        }
    } catch (error) {
        console.error('Error cleaning up all temp wallpapers:', error);
    }
}