/**
 * Conversa Cache Service
 * 
 * Manages persistent caching of Gemini API results for the Conversa sidebar.
 * Stores translations and phonetic transcriptions in IndexedDB to reduce API calls.
 */

import { saveToConversaCache, getFromConversaCache, clearConversaCache, getConversaCacheStats } from './db';

/**
 * Get cached translation from IndexedDB
 * @param cacheKey - Format: "targetLang::text"
 * @returns Cached translation or null if not found
 */
export const getCachedTranslation = async (cacheKey: string): Promise<string | null> => {
    try {
        return await getFromConversaCache(cacheKey);
    } catch (error) {
        console.error('[conversaCacheService] Error getting cached translation:', error);
        return null;
    }
};

/**
 * Save translation to IndexedDB cache
 * @param cacheKey - Format: "targetLang::text"
 * @param translation - Translated text
 */
export const saveCachedTranslation = async (cacheKey: string, translation: string): Promise<void> => {
    try {
        await saveToConversaCache(cacheKey, translation);
    } catch (error) {
        console.error('[conversaCacheService] Error saving cached translation:', error);
    }
};

/**
 * Get cached phonetic transcription from IndexedDB
 * @param text - Original text
 * @returns Cached phonetic or null if not found
 */
export const getCachedPhonetic = async (text: string): Promise<string | null> => {
    try {
        const cacheKey = `phonetic::${text}`;
        return await getFromConversaCache(cacheKey);
    } catch (error) {
        console.error('[conversaCacheService] Error getting cached phonetic:', error);
        return null;
    }
};

/**
 * Save phonetic transcription to IndexedDB cache
 * @param text - Original text
 * @param phonetic - Phonetic transcription
 */
export const saveCachedPhonetic = async (text: string, phonetic: string): Promise<void> => {
    try {
        const cacheKey = `phonetic::${text}`;
        await saveToConversaCache(cacheKey, phonetic);
    } catch (error) {
        console.error('[conversaCacheService] Error saving cached phonetic:', error);
    }
};

/**
 * Clear all cached translations and phonetics
 */
export const clearAllConversaCache = async (): Promise<void> => {
    try {
        await clearConversaCache();
        console.log('[conversaCacheService] Cache cleared successfully');
    } catch (error) {
        console.error('[conversaCacheService] Error clearing cache:', error);
    }
};

/**
 * Get cache statistics
 * @returns Object with count and approximate size in bytes
 */
export const getCacheStats = async (): Promise<{ count: number; size: number }> => {
    try {
        return await getConversaCacheStats();
    } catch (error) {
        console.error('[conversaCacheService] Error getting cache stats:', error);
        return { count: 0, size: 0 };
    }
};
