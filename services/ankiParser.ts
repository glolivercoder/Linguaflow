import JSZip from 'jszip';
import initSqlJs from 'sql.js';
import { AnkiCard } from '../types';

// Vite will copy the wasm file to the public folder
// In production and dev, it will be available at /sql-wasm.wasm
const getSqlWasmUrl = () => {
    return '/sql-wasm.wasm';
};

// Helper function to strip HTML tags, preserving basic whitespace
const stripHtml = (html: string) => {
    // Replace block tags with newlines to preserve structure
    const withNewlines = html
        .replace(/<(br|div|p|h\d|li)[^>]*>/gi, '\n')
        .replace(/&nbsp;/g, ' ');
    const doc = new DOMParser().parseFromString(withNewlines, 'text/html');
    return (doc.body.textContent || "").replace(/\n+/g, '\n').trim();
};

// Helper function to remove instructional boilerplate
const removeInstructionalText = (text: string) => {
    if (!text) return text;

    const patterns: RegExp[] = [
        /Change google translate to your language do as the following:[\s\S]*$/i,
        /Select Tools\s*>\s*Manage Tools Type\s*>[\s\S]*$/i,
        /https:\/\/translate\.google\.com\/[\s\S]*$/i,
    ];

    let cleaned = text;
    for (const pattern of patterns) {
        cleaned = cleaned.replace(pattern, '');
    }

    const triggers = [
        'change google translate to your language',
        'select tools > manage tools type',
        'https://translate.google.com/'
    ];

    const lower = cleaned.toLowerCase();
    let cutIndex = lower.length;
    triggers.forEach(trigger => {
        const index = lower.indexOf(trigger);
        if (index !== -1 && index < cutIndex) {
            cutIndex = index;
        }
    });

    if (cutIndex !== lower.length) {
        cleaned = cleaned.slice(0, cutIndex);
    }

    return cleaned.trim();
};

// Helper function to extract all image sources from HTML
const extractAllImageSrcs = (html: string): string[] => {
    const matches: string[] = [];
    // Improved regex: handles single/double/no quotes, case insensitive
    const regex = /<img[^>]+src=["']?([^"'\s>]+)["']?[^>]*>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
        // Decode URI component to handle %20 etc.
        try {
            matches.push(decodeURIComponent(match[1]));
        } catch (e) {
            matches.push(match[1]);
        }
    }
    return matches;
};

// Helper function to extract all audio sources from HTML
const extractAllAudioSrcs = (html: string): string[] => {
    const matches: string[] = [];
    // Match <audio> tags
    const audioTagRegex = /<audio[^>]+src=["']?([^"'\s>]+)["']?[^>]*>/gi;
    // Match [sound:...] Anki format
    const soundRegex = /\[sound:([^\]]+)\]/gi;

    let match;
    while ((match = audioTagRegex.exec(html)) !== null) {
        try {
            matches.push(decodeURIComponent(match[1]));
        } catch (e) {
            matches.push(match[1]);
        }
    }
    while ((match = soundRegex.exec(html)) !== null) {
        try {
            matches.push(decodeURIComponent(match[1]));
        } catch (e) {
            matches.push(match[1]);
        }
    }
    return matches;
};

const stripAndClean = (html: string): string => removeInstructionalText(stripHtml(html || '')).trim();

const isLikelyMetadata = (html: string): boolean => {
    const cleaned = stripHtml(html).trim();
    if (!cleaned) return true;
    if (/^\d+$/.test(cleaned)) return true;
    if (/^[A-Za-z0-9\-_]+$/.test(cleaned) && cleaned.length <= 4) return true;
    return false;
};

const WORD_REGEX = /\b[A-Za-zÀ-ÖØ-öø-ÿ]+\b/g;
const PORTUGUESE_ACCENTED_CHAR_REGEX = /[ãõáéíóúâêîôûç]/i;
const PORTUGUESE_COMMON_WORDS_REGEX = /\b(de|que|é|para|com|não|nao|uma|um|os|as|eu|você|voce|ele|ela|isso|isto|está|esta|ser|ter|foi|são|sao)\b/i;
const PORTUGUESE_SUFFIX_REGEX = /(ção|ções|são|sao|mente|dade|nhão|nhao|lhão|lhao)/i;

const scorePortugueseLikelihood = (text: string): number => {
    if (!text) return 0;

    let score = 0;

    if (PORTUGUESE_ACCENTED_CHAR_REGEX.test(text)) {
        score += 5;
    }
    if (PORTUGUESE_COMMON_WORDS_REGEX.test(text)) {
        score += 4;
    }
    if (PORTUGUESE_SUFFIX_REGEX.test(text)) {
        score += 3;
    }

    const wordCount = (text.match(WORD_REGEX) || []).length;
    score += Math.min(wordCount, 20) / 2;

    return score;
};

interface CandidateField {
    idx: number;
    html: string;
    cleanedText: string;
}

const pickBestField = (
    fields: string[],
    excludedIdxs: Set<number>,
    preferPortuguese = false
): CandidateField | null => {
    const candidates: (CandidateField & { score: number })[] = [];

    fields.forEach((html, idx) => {
        if (excludedIdxs.has(idx)) return;
        if (!html) return;
        if (isLikelyMetadata(html)) return;

        const cleanedText = stripAndClean(html);
        if (!cleanedText) return;

        let score = cleanedText.length;
        const portugueseScore = scorePortugueseLikelihood(cleanedText);
        score += preferPortuguese ? portugueseScore * 20 : portugueseScore * 5;

        candidates.push({ idx, html, cleanedText, score });
    });

    if (!candidates.length) {
        return null;
    }

    candidates.sort((a, b) => b.score - a.score);
    return candidates[0];
};

/**
 * Parse Anki .apkg file manually using JSZip and sql.js
 * Supports audio, images, and large files (>10MB)
 */
export const parseAnkiDeck = async (file: File): Promise<AnkiCard[]> => {
    console.log('[ankiParser] Starting to parse deck manually:', file.name);

    try {
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(file);

        // 1. Load Media Map
        let mediaMap: Record<string, string> = {};
        const mediaFile = zipContent.file('media');
        if (mediaFile) {
            const mediaJson = await mediaFile.async('string');
            mediaMap = JSON.parse(mediaJson); // Maps "numeric_id" -> "filename"
        }
        console.log('[ankiParser] Media map loaded, entries:', Object.keys(mediaMap).length);

        // 2. Extract Media Files to Object URLs
        const mediaUrls: Record<string, string> = {};
        for (const [id, filename] of Object.entries(mediaMap)) {
            const fileData = zipContent.file(id);
            if (fileData) {
                const blob = await fileData.async('blob');
                // Determine mime type based on extension
                let mimeType = 'application/octet-stream';
                if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) mimeType = 'image/jpeg';
                else if (filename.endsWith('.png')) mimeType = 'image/png';
                else if (filename.endsWith('.svg')) mimeType = 'image/svg+xml';
                else if (filename.endsWith('.mp3')) mimeType = 'audio/mpeg';
                else if (filename.endsWith('.ogg')) mimeType = 'audio/ogg';
                else if (filename.endsWith('.wav')) mimeType = 'audio/wav';

                const typedBlob = new Blob([blob], { type: mimeType });
                mediaUrls[filename] = URL.createObjectURL(typedBlob);
            }
        }
        console.log('[ankiParser] Media files extracted:', Object.keys(mediaUrls).length);

        // 3. Load SQLite Database
        const colFile = zipContent.file('collection.anki2');
        if (!colFile) {
            throw new Error('collection.anki2 not found in .apkg file');
        }
        const dbData = await colFile.async('uint8array');

        const SQL = await initSqlJs({
            locateFile: () => getSqlWasmUrl()
        });
        const db = new SQL.Database(dbData);

        // 4. Query Decks and Cards
        const notesResult = db.exec("SELECT id, flds, tags FROM notes");
        if (!notesResult.length) {
            throw new Error('No notes found in database');
        }

        const notes = notesResult[0].values;
        console.log('[ankiParser] Notes found:', notes.length);

        const cards: AnkiCard[] = [];

        for (const note of notes) {
            const [id, flds, tags] = note as [number, string, string];
            // Fields are separated by 0x1f (unit separator)
            const fields = flds.split('\x1f');

            if (fields.length < 2) {
                continue;
            }

            // Determine front/back
            const usedIndices = new Set<number>();
            const frontField = pickBestField(fields, usedIndices, true);
            if (frontField) usedIndices.add(frontField.idx);
            const backField = pickBestField(fields, usedIndices, false);

            if (!frontField || !backField) continue;

            const front = stripAndClean(frontField.html);
            const back = stripAndClean(backField.html);

            // Extract media
            const allFieldsHtml = fields.join(' ');
            const imageSrcs = extractAllImageSrcs(allFieldsHtml);
            const audioSrcs = extractAllAudioSrcs(allFieldsHtml);

            // Debug logging for first card
            if (cards.length === 0) {
                console.log('[ankiParser] First card debug:');
                console.log('  Fields:', fields);
                console.log('  Extracted Image Srcs:', imageSrcs);
                console.log('  Extracted Audio Srcs:', audioSrcs);
                console.log('  Media Map Keys Sample:', Object.keys(mediaUrls).slice(0, 5));
            }

            const imageUrls = imageSrcs.map(src => mediaUrls[src]).filter(Boolean);
            const audioUrls = audioSrcs.map(src => mediaUrls[src]).filter(Boolean);

            if (imageSrcs.length > 0 && imageUrls.length === 0) {
                console.warn('[ankiParser] Warning: Images found in HTML but not in media map:', imageSrcs);
            }

            cards.push({
                id: id,
                front,
                back,
                image: imageUrls[0],
                audio: audioUrls.length > 0 ? audioUrls[0] : undefined,
                tags: tags ? tags.split(' ').filter(t => t) : []
            });
        }

        db.close();
        console.log('[ankiParser] Successfully parsed', cards.length, 'cards');
        return cards;

    } catch (error) {
        console.error('[ankiParser] Error parsing Anki deck:', error);
        throw new Error(`Failed to parse Anki deck: ${error instanceof Error ? error.message : String(error)}`);
    }
};
