/**
 * Comprehensive Backup Service
 * 
 * Provides automatic and manual backup/restore functionality for all app data:
 * - Flashcards (predefined and user-created)
 * - Translations and phonetic transcriptions (cache)
 * - Images (cached blobs)
 * - Settings
 * - Anki decks
 * - Custom categories
 */

import * as db from './db';
import { Flashcard } from '../types';

export interface BackupData {
    version: number;
    timestamp: string;
    metadata: {
        appVersion: string;
        recordCounts: {
            flashcards: number;
            translations: number;
            phonetics: number;
            images: number;
            settings: number;
            ankiDecks: number;
            customCategories: number;
        };
        totalSize: number;
    };
    data: {
        settings: any;
        flashcards: Flashcard[];
        phonetics: any[];
        imageOverrides: any[];
        ankiDecks: any[];
        categoryTranslations: any[];
        categoryPhonetics: any[];
        conversaCache: any[];
        imageCache: Array<{
            cardId: string;
            originalUrl: string;
            imageBlobBase64: string;
            cachedAt: number;
        }>;
        customCategories: any[];
    };
}

/**
 * Export all data from IndexedDB to a structured backup object
 */
export const exportAllData = async (): Promise<BackupData> => {
    console.log('[BackupService] Starting full data export...');

    try {
        // Fetch all data from IndexedDB
        const [
            settings,
            flashcards,
            phonetics,
            imageOverrides,
            ankiDecks,
            categoryTranslations,
            categoryPhonetics,
            conversaCache,
            imageCache,
            customCategories,
        ] = await Promise.all([
            db.getSettings(),
            db.getFlashcards(),
            db.getAllPhonetics(),
            db.getAllImageOverrides(),
            db.getAnkiDeckSummaries(),
            db.getAllCategoryTranslations(),
            db.getAllCategoryPhonetics(),
            db.getAllConversaCache(),
            db.getAllCachedImages(),
            db.getAllCustomCategories(),
        ]);

        // Convert image blobs to Base64 for JSON serialization
        const imageCacheWithBase64 = await Promise.all(
            imageCache.map(async (record) => ({
                cardId: record.cardId,
                originalUrl: record.originalUrl,
                imageBlobBase64: await blobToBase64(record.imageBlob),
                cachedAt: record.cachedAt,
            }))
        );

        // Calculate total size
        const totalSize =
            imageCacheWithBase64.reduce((sum, img) => sum + img.imageBlobBase64.length, 0) +
            JSON.stringify(conversaCache).length +
            JSON.stringify(flashcards).length;

        const backup: BackupData = {
            version: 1,
            timestamp: new Date().toISOString(),
            metadata: {
                appVersion: '1.0.0',
                recordCounts: {
                    flashcards: flashcards.length,
                    translations: conversaCache.filter((c) => !c.cacheKey.startsWith('phonetic:')).length,
                    phonetics: conversaCache.filter((c) => c.cacheKey.startsWith('phonetic:')).length + categoryPhonetics.length,
                    images: imageCache.length,
                    settings: 1,
                    ankiDecks: ankiDecks.length,
                    customCategories: customCategories.length,
                },
                totalSize,
            },
            data: {
                settings,
                flashcards,
                phonetics,
                imageOverrides,
                ankiDecks,
                categoryTranslations,
                categoryPhonetics,
                conversaCache,
                imageCache: imageCacheWithBase64,
                customCategories,
            },
        };

        console.log('[BackupService] Export complete:', backup.metadata.recordCounts);
        return backup;
    } catch (error) {
        console.error('[BackupService] Export failed:', error);
        throw new Error('Falha ao exportar dados: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
};

/**
 * Import data from a backup object and merge with existing data
 */
export const importAllData = async (
    backup: BackupData,
    mergeStrategy: 'replace' | 'merge' = 'replace'
): Promise<void> => {
    console.log('[BackupService] Starting data import...', {
        strategy: mergeStrategy,
        recordCounts: backup.metadata.recordCounts,
    });

    try {
        // Validate backup structure
        if (!backup.data || backup.version !== 1) {
            throw new Error('Formato de backup inválido ou versão não suportada');
        }

        if (mergeStrategy === 'replace') {
            // Clear all existing data first
            console.log('[BackupService] Clearing existing data...');
            await Promise.all([
                db.clearPhonetics(),
                db.clearImageOverrides(),
                db.clearImageCache(),
                db.clearConversaCache(),
            ]);
        }

        // Import settings
        if (backup.data.settings) {
            await db.saveSettings(backup.data.settings);
        }

        // Import flashcards
        if (backup.data.flashcards && backup.data.flashcards.length > 0) {
            for (const flashcard of backup.data.flashcards) {
                await db.saveFlashcard(flashcard);
            }
        }

        // Import phonetics
        if (backup.data.phonetics && backup.data.phonetics.length > 0) {
            for (const phonetic of backup.data.phonetics) {
                await db.savePhonetic(phonetic.cardId, phonetic.phonetic);
            }
        }

        // Import image overrides
        if (backup.data.imageOverrides && backup.data.imageOverrides.length > 0) {
            for (const override of backup.data.imageOverrides) {
                await db.saveImageOverride(override.cardId, override.imageUrl);
            }
        }

        // Import Anki decks (summaries get rebuilt from flashcards)
        // No separate import needed - will be rebuilt

        // Import category translations
        if (backup.data.categoryTranslations && backup.data.categoryTranslations.length > 0) {
            for (const translation of backup.data.categoryTranslations) {
                await db.saveCategoryTranslations(translation.language, translation.categories);
            }
        }

        // Import category phonetics
        if (backup.data.categoryPhonetics && backup.data.categoryPhonetics.length > 0) {
            for (const phonetic of backup.data.categoryPhonetics) {
                await db.saveCategoryPhonetic(
                    phonetic.sourceLang,
                    phonetic.targetLang,
                    phonetic.text,
                    phonetic.phonetic
                );
            }
        }

        // Import conversa cache
        if (backup.data.conversaCache && backup.data.conversaCache.length > 0) {
            for (const cache of backup.data.conversaCache) {
                await db.saveToConversaCache(cache.cacheKey, cache.cachedValue);
            }
        }

        // Import image cache (convert Base64 back to Blob)
        if (backup.data.imageCache && backup.data.imageCache.length > 0) {
            for (const imageRecord of backup.data.imageCache) {
                const blob = base64ToBlob(imageRecord.imageBlobBase64);
                await db.saveImageToCache(imageRecord.cardId, blob, imageRecord.originalUrl);
            }
        }

        // Import custom categories
        if (backup.data.customCategories && backup.data.customCategories.length > 0) {
            for (const category of backup.data.customCategories) {
                await db.saveCustomCategory(category);
            }
        }

        console.log('[BackupService] Import complete');
    } catch (error) {
        console.error('[BackupService] Import failed:', error);
        throw new Error('Falha ao importar dados: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
};

/**
 * Download backup as JSON file with timestamp
 */
export const downloadBackupFile = async (): Promise<void> => {
    try {
        const backup = await exportAllData();

        // Generate filename with timestamp
        const timestamp = new Date()
            .toISOString()
            .replace(/:/g, '-')
            .replace(/\..+/, ''); // Format: 2025-11-21T02-34-30
        const filename = `linguaflow_backup_${timestamp}.json`;

        // Create blob and download
        const json = JSON.stringify(backup, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();

        URL.revokeObjectURL(url);

        console.log('[BackupService] Backup downloaded:', filename);
    } catch (error) {
        console.error('[BackupService] Download failed:', error);
        throw error;
    }
};

/**
 * Import backup from uploaded JSON file
 */
export const importBackupFile = async (file: File, mergeStrategy: 'replace' | 'merge' = 'replace'): Promise<void> => {
    try {
        const text = await file.text();
        const backup: BackupData = JSON.parse(text);
        await importAllData(backup, mergeStrategy);
        console.log('[BackupService] File imported successfully');
    } catch (error) {
        console.error('[BackupService] File import failed:', error);
        throw new Error('Falha ao importar arquivo: ' + (error instanceof Error ? error.message : 'Invalid file'));
    }
};

/**
 * Helper: Convert Blob to Base64 string
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            // Remove the data:image/xyz;base64, prefix
            const base64 = result.split(',')[1] || result;
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

/**
 * Helper: Convert Base64 string to Blob
 */
const base64ToBlob = (base64: string): Blob => {
    // Add data URL prefix if missing
    const dataUrl = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`;

    const byteString = atob(dataUrl.split(',')[1]);
    const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];

    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type: mimeString });
};

/**
 * Get backup statistics
 */
export const getBackupStats = async (): Promise<{
    flashcards: number;
    translations: number;
    phonetics: number;
    images: number;
    imageSizeMB: number;
    cacheSizeMB: number;
}> => {
    try {
        const [conversaCacheStats, imageCacheStats, flashcards] = await Promise.all([
            db.getConversaCacheStats(),
            db.getAllCachedImages(),
            db.getFlashcards(),
        ]);

        const imageSizeBytes = imageCacheStats.reduce((sum, record) => sum + record.imageBlob.size, 0);

        return {
            flashcards: flashcards.length,
            translations: conversaCacheStats.count,
            phonetics: conversaCacheStats.count, // Approximate
            images: imageCacheStats.length,
            imageSizeMB: imageSizeBytes / (1024 * 1024),
            cacheSizeMB: (conversaCacheStats.size + imageSizeBytes) / (1024 * 1024),
        };
    } catch (error) {
        console.error('[BackupService] Failed to get stats:', error);
        return {
            flashcards: 0,
            translations: 0,
            phonetics: 0,
            images: 0,
            imageSizeMB: 0,
            cacheSizeMB: 0,
        };
    }
};
