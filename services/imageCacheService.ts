import * as db from './db';
import { PROXY_BASE_URL } from './proxyClient';

const isPixabayUrl = (url: string): boolean => {
    try {
        const parsed = new URL(url);
        return parsed.hostname.endsWith('pixabay.com');
    } catch {
        return false;
    }
};

const buildPixabayProxyUrl = (url: string): string => {
    return `${PROXY_BASE_URL}/pixabay/image?url=${encodeURIComponent(url)}`;
};

/**
 * Downloads an image from a URL and caches it locally in IndexedDB
 */
export const downloadAndCacheImage = async (
    url: string,
    cardId: string
): Promise<string> => {
    try {
        // Check if already cached
        const cachedUrl = await db.getImageFromCache(cardId);
        if (cachedUrl) {
            console.log('[ImageCache] Using cached image for:', cardId);
            return cachedUrl;
        }

        console.log('[ImageCache] Downloading image from:', url);

        const downloadUrl = isPixabayUrl(url) ? buildPixabayProxyUrl(url) : url;

        // Download image
        const response = await fetch(downloadUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        const blob = await response.blob();

        // Save to cache
        await db.saveImageToCache(cardId, blob, url);
        console.log('[ImageCache] Image cached successfully for:', cardId);

        // Return object URL for immediate use
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error('[ImageCache] Error downloading/caching image:', error);
        // Return original URL as fallback
        return url;
    }
};

/**
 * Gets a cached image URL or returns null if not cached
 */
export const getCachedImageUrl = async (cardId: string): Promise<string | null> => {
    return db.getImageFromCache(cardId);
};

/**
 * Checks if an image is cached
 */
export const isImageCached = async (cardId: string): Promise<boolean> => {
    return db.isImageCached(cardId);
};

/**
 * Clears all cached images
 */
export const clearAllCachedImages = async (): Promise<void> => {
    await db.clearImageCache();
    console.log('[ImageCache] All cached images cleared');
};

export const invalidateImageCache = async (cardId: string): Promise<void> => {
    await db.deleteImageFromCache(cardId);
};

/**
 * Gets statistics about cached images
 */
export const getCacheStats = async (): Promise<{
    totalImages: number;
    totalSize: number;
}> => {
    const allCached = await db.getAllCachedImages();
    const totalSize = allCached.reduce((sum, record) => sum + record.imageBlob.size, 0);

    return {
        totalImages: allCached.length,
        totalSize,
    };
};
