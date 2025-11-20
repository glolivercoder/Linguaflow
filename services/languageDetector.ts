import { LanguageCode } from '../types';
import { proxyPost } from './proxyClient';

/**
 * Result of language detection for a card pair
 */
export interface LanguageDetectionResult {
    frontLang: LanguageCode;
    backLang: LanguageCode;
    confidence: number;
}

/**
 * Detect languages using LLM with fallback to heuristics
 */
export const detectLanguages = async (
    front: string,
    back: string,
    nativeLanguage: LanguageCode,
    learningLanguage: LanguageCode
): Promise<LanguageDetectionResult> => {
    try {
        // Try LLM detection first
        const result = await detectLanguagesLLM(front, back);
        if (result.confidence > 0.7) {
            return result;
        }
    } catch (error) {
        console.warn('[LanguageDetector] LLM detection failed, using fallback:', error);
    }

    // Fallback to heuristics
    return detectLanguagesHeuristic(front, back, nativeLanguage, learningLanguage);
};

/**
 * Use Gemini to detect languages
 */
const detectLanguagesLLM = async (front: string, back: string): Promise<LanguageDetectionResult> => {
    const prompt = `Analyze these two texts and determine the language of each. Respond ONLY with a JSON object in this exact format:
{"frontLang": "en-US", "backLang": "pt-BR", "confidence": 0.95}

Use these language codes: en-US, pt-BR, es-ES, fr-FR, it-IT, ja-JP, zh-CN, ru-RU, eo

Front: "${front.substring(0, 200)}"
Back: "${back.substring(0, 200)}"`;

    try {
        const response = await proxyPost<{ translation: string }>('/gemini/translate', {
            text: prompt,
            fromLangName: 'English',
            toLangName: 'English'
        });

        // Parse JSON from response
        const jsonMatch = response.translation.match(/\{[^}]+\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                frontLang: parsed.frontLang || 'en-US',
                backLang: parsed.backLang || 'pt-BR',
                confidence: parsed.confidence || 0.8
            };
        }
    } catch (error) {
        console.error('[LanguageDetector] Failed to parse LLM response:', error);
    }

    throw new Error('LLM detection failed');
};

/**
 * Heuristic language detection based on character patterns
 */
const detectLanguagesHeuristic = (
    front: string,
    back: string,
    nativeLanguage: LanguageCode,
    learningLanguage: LanguageCode
): LanguageDetectionResult => {
    const frontScore = scoreLanguage(front);
    const backScore = scoreLanguage(back);

    // Determine which is which based on character patterns
    let frontLang: LanguageCode = learningLanguage;
    let backLang: LanguageCode = nativeLanguage;

    // If front has Portuguese markers and back doesn't, swap
    if (frontScore.portuguese > backScore.portuguese && backScore.english > frontScore.english) {
        frontLang = nativeLanguage;
        backLang = learningLanguage;
    }

    return {
        frontLang,
        backLang,
        confidence: 0.6 // Lower confidence for heuristic
    };
};

/**
 * Score text for language indicators
 */
const scoreLanguage = (text: string): { portuguese: number; english: number; japanese: number; chinese: number } => {
    const scores = {
        portuguese: 0,
        english: 0,
        japanese: 0,
        chinese: 0
    };

    // Portuguese indicators
    if (/[ãõáéíóúâêîôûç]/i.test(text)) scores.portuguese += 3;
    if (/\b(de|que|é|para|com|não|nao|uma|um|os|as|eu|você|voce)\b/i.test(text)) scores.portuguese += 2;
    if (/(ção|ções|mente|dade)/i.test(text)) scores.portuguese += 2;

    // English indicators
    if (/\b(the|is|are|was|were|have|has|will|would|can|could)\b/i.test(text)) scores.english += 2;
    if (/^[a-zA-Z\s.,!?'-]+$/.test(text)) scores.english += 1;

    // Japanese indicators
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) scores.japanese += 5;

    // Chinese indicators
    if (/[\u4E00-\u9FFF]/.test(text)) scores.chinese += 5;

    return scores;
};
