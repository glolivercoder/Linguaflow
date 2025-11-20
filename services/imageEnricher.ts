import { AnkiCard } from '../types';
import { searchImages } from './pixabayService';

/**
 * Enrich card with images from Pixabay or keep Anki image
 */
export const enrichCardImage = async (
    card: AnkiCard,
    usePixabay: boolean
): Promise<string | undefined> => {
    // If card already has an image and we're not using Pixabay, keep it
    if (card.image && !usePixabay) {
        return card.image;
    }

    // If using Pixabay, try to find a better image
    if (usePixabay) {
        try {
            // Extract keyword from front or back
            const keyword = extractKeyword(card.front || card.back);

            if (keyword) {
                console.log('[ImageEnricher] Searching Pixabay for:', keyword);
                const imageUrls = await searchImages(keyword);

                if (imageUrls && imageUrls.length > 0) {
                    // searchImages returns string[] of URLs
                    return imageUrls[0];
                }
            }
        } catch (error) {
            console.warn('[ImageEnricher] Pixabay search failed:', error);
        }
    }

    // Fallback to Anki image if available
    return card.image;
};

/**
 * Extract main keyword from text for image search
 */
const extractKeyword = (text: string): string => {
    if (!text) return '';

    // Remove HTML tags
    const cleaned = text.replace(/<[^>]*>/g, '');

    // Take first meaningful word (usually a noun in flashcards)
    const words = cleaned.trim().split(/\s+/);

    // Filter out common articles and prepositions
    const stopWords = ['the', 'a', 'an', 'to', 'of', 'in', 'on', 'at', 'for', 'is', 'are', 'was', 'were'];
    const meaningful = words.find(word => !stopWords.includes(word.toLowerCase()));

    return meaningful || words[0] || '';
};
