import { AnkiCard, Flashcard, ConversionConfig, LanguageCode } from '../types';
import { detectLanguages } from './languageDetector';
import { getPhonetics } from './geminiService';
import { enrichCardImage } from './imageEnricher';

/**
 * Progress callback for conversion
 */
export type ConversionProgressCallback = (current: number, total: number, status: string) => void;

/**
 * Result of batch conversion
 */
export interface ConversionResult {
    flashcards: Flashcard[];
    successful: number;
    failed: number;
    errors: string[];
}

/**
 * Convert Anki cards to LinguaFlow flashcards in batches
 */
export const convertAnkiToLinguaFlow = async (
    ankiCards: AnkiCard[],
    config: ConversionConfig,
    onProgress: ConversionProgressCallback
): Promise<ConversionResult> => {
    const flashcards: Flashcard[] = [];
    const errors: string[] = [];
    let successful = 0;
    let failed = 0;

    const totalCards = ankiCards.length;
    const batchSize = 10; // Process 10 cards at a time to avoid API throttling

    console.log('[AnkiConverter] Starting conversion...', {
        totalCards,
        batchSize,
        config
    });

    // Process in batches
    for (let i = 0; i < totalCards; i += batchSize) {
        const batch = ankiCards.slice(i, Math.min(i + batchSize, totalCards));

        onProgress(i, totalCards, `Processing cards ${i + 1}-${Math.min(i + batchSize, totalCards)}...`);

        // Process each card in the batch
        const batchPromises = batch.map(async (ankiCard) => {
            try {
                const flashcard = await convertSingleCard(ankiCard, config);
                flashcards.push(flashcard);
                successful++;
                return true;
            } catch (error) {
                const errorMsg = `Card ${ankiCard.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                errors.push(errorMsg);
                console.error('[AnkiConverter]', errorMsg);
                failed++;
                return false;
            }
        });

        await Promise.all(batchPromises);

        // Add delay between batches to respect API rate limits
        if (i + batchSize < totalCards) {
            await delay(1000); // 1 second delay between batches
        }
    }

    onProgress(totalCards, totalCards, 'Conversion complete!');

    console.log('[AnkiConverter] Conversion finished:', {
        successful,
        failed,
        totalErrors: errors.length
    });

    return {
        flashcards,
        successful,
        failed,
        errors
    };
};

/**
 * Convert a single Anki card to LinguaFlow flashcard
 */
const convertSingleCard = async (
    ankiCard: AnkiCard,
    config: ConversionConfig
): Promise<Flashcard> => {
    // Step 1: Detect languages
    const langDetection = await detectLanguages(
        ankiCard.front,
        ankiCard.back,
        config.nativeLanguage,
        config.learningLanguage
    );

    console.log('[AnkiConverter] Language detection:', {
        cardId: ankiCard.id,
        frontLang: langDetection.frontLang,
        backLang: langDetection.backLang,
        confidence: langDetection.confidence
    });

    // Step 2: Map front/back to original/translated based on detected languages
    let originalText: string;
    let translatedText: string;
    let originalLang: LanguageCode;
    let translatedLang: LanguageCode;

    // If front is native language and back is learning language
    if (langDetection.frontLang === config.nativeLanguage && langDetection.backLang === config.learningLanguage) {
        originalText = ankiCard.front;
        translatedText = ankiCard.back;
        originalLang = langDetection.frontLang;
        translatedLang = langDetection.backLang;
    }
    // If back is native language and front is learning language (inverted)
    else if (langDetection.backLang === config.nativeLanguage && langDetection.frontLang === config.learningLanguage) {
        originalText = ankiCard.back;
        translatedText = ankiCard.front;
        originalLang = langDetection.backLang;
        translatedLang = langDetection.frontLang;
    }
    // Default: use config preferences
    else {
        originalText = ankiCard.back;
        translatedText = ankiCard.front;
        originalLang = config.nativeLanguage;
        translatedLang = config.learningLanguage;
    }

    // Step 3: Generate phonetics if enabled
    let phoneticText = '';
    if (config.generatePhonetics) {
        try {
            phoneticText = await getPhonetics(
                translatedText,
                getLanguageName(translatedLang),
                getLanguageName(originalLang)
            );
        } catch (error) {
            console.warn('[AnkiConverter] Phonetics generation failed:', error);
            // Don't fail the entire conversion if phonetics fail
            phoneticText = '';
        }
    }

    // Step 4: Handle image enrichment
    let imageUrl = ankiCard.image; // Start with Anki image if available

    if (config.usePixabayForImages && !imageUrl) {
        try {
            imageUrl = await enrichCardImage(ankiCard, true);
        } catch (error) {
            console.warn('[AnkiConverter] Image enrichment failed:', error);
            // Continue without image
        }
    }

    // Step 5: Create flashcard
    const now = Date.now();
    const flashcard: Flashcard = {
        id: `anki-${ankiCard.id}-${now}`,
        originalText,
        translatedText,
        phoneticText,
        originalLang,
        translatedLang,
        imageUrl,
        sourceType: 'anki',
        ankiDeckId: ankiCard.deckId,
        ankiDeckName: ankiCard.deckName,
        ankiNoteId: ankiCard.id
    };

    return flashcard;
};

/**
 * Get human-readable language name from code
 */
const getLanguageName = (code: LanguageCode): string => {
    const names: Record<LanguageCode, string> = {
        'en-US': 'English (US)',
        'pt-BR': 'Portuguese (Brazil)',
        'es-ES': 'Spanish (Spain)',
        'fr-FR': 'French (France)',
        'it-IT': 'Italian (Italy)',
        'ja-JP': 'Japanese (Japan)',
        'zh-CN': 'Chinese (Simplified)',
        'ru-RU': 'Russian (Russia)',
        'eo': 'Esperanto'
    };
    return names[code] || 'English (US)';
};

/**
 * Delay helper
 */
const delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};
