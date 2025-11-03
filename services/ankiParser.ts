import JSZip from 'jszip';
import initSqlJs from 'sql.js/dist/sql-wasm.js';
import { AnkiCard } from '../types';

// Helper function to strip HTML tags
const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
};

// Helper function to remove instructional boilerplate often bundled with shared decks
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

// Helper function to extract all image sources from an HTML string
const extractAllImageSrcs = (html: string): string[] => {
    const matches: string[] = [];
    const regex = /<img[^>]+src="([^">]+)"/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
        matches.push(match[1]);
    }
    return matches;
};

// Helper function to extract all audio sources from an HTML string
const extractAllAudioSrcs = (html: string): string[] => {
    const matches: string[] = [];
    // Match both <audio> tags and [sound:...] Anki format
    const audioTagRegex = /<audio[^>]+src="([^">]+)"/g;
    const soundRegex = /\[sound:([^\]]+)\]/g;
    
    let match;
    while ((match = audioTagRegex.exec(html)) !== null) {
        matches.push(match[1]);
    }
    while ((match = soundRegex.exec(html)) !== null) {
        matches.push(match[1]);
    }
    return matches;
};

const WORD_REGEX = /\b[A-Za-zÀ-ÖØ-öø-ÿ]+\b/g;
const PORTUGUESE_ACCENTED_CHAR_REGEX = /[ãõáéíóúâêîôûç]/i;
const PORTUGUESE_COMMON_WORDS_REGEX = /\b(de|que|é|para|com|não|nao|uma|um|os|as|eu|você|voce|ele|ela|isso|isto|está|esta|ser|ter|foi|são|sao)\b/i;
const PORTUGUESE_SUFFIX_REGEX = /(ção|ções|são|sao|mente|dade|nhão|nhao|lhão|lhao)/i;

const stripAndClean = (html: string): string => removeInstructionalText(stripHtml(html || '')).trim();

const isLikelyMetadata = (html: string): boolean => {
    const cleaned = stripHtml(html).trim();
    if (!cleaned) {
        return true;
    }
    if (/^\d+$/.test(cleaned)) {
        return true;
    }
    if (/^[A-Za-z0-9\-_]+$/.test(cleaned) && cleaned.length <= 4) {
        return true;
    }
    return false;
};

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
    const { score: _score, ...best } = candidates[0];
    return best;
};

// Helper function to determine MIME type from filename
const getMimeType = (filename: string): string => {
    const ext = filename.toLowerCase().split('.').pop();
    const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'ogg': 'audio/ogg',
        'm4a': 'audio/mp4',
        'flac': 'audio/flac'
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
};

// Main parsing function
export const parseAnkiPackage = async (
    file: File,
    onProgress: (progress: number, status: string) => void
): Promise<AnkiCard[]> => {
    onProgress(0, "Iniciando...");
    
    console.log('='.repeat(80));
    console.log('🎴 [ANKI IMPORT] Starting Anki deck import');
    console.log('='.repeat(80));

    // Initialize SQL.js
    const SQL = await initSqlJs({
        locateFile: () => '/sql-wasm.wasm'
    });

    onProgress(5, "Carregando arquivo .apkg");
    const zip = await JSZip.loadAsync(file);

    // Find and load the SQLite database from the zip
    const dbFile = zip.file('collection.anki2') || zip.file('collection.anki21');
    if (!dbFile) {
        throw new Error("Arquivo de coleção 'collection.anki2' ou 'collection.anki21' não encontrado no .apkg.");
    }

    onProgress(15, "Lendo banco de dados");
    const dbData = await dbFile.async('uint8array');
    const db = new SQL.Database(dbData);

    // Parse media manifest file
    onProgress(25, "Analisando mídias");
    const mediaFile = zip.file('media');
    const mediaMap: Record<string, string> = {};
    if (mediaFile) {
        const mediaJson = JSON.parse(await mediaFile.async('string'));
        for (const key in mediaJson) {
            mediaMap[mediaJson[key]] = key; // map filename to its key
        }
    }

    // Query for notes (the raw content)
    onProgress(40, "Extraindo notas");
    const notesStmt = db.prepare("SELECT id, mid, flds, tags FROM notes");
    const notes: { id: number; mid: number; flds: string; tags: string[] }[] = [];
    while (notesStmt.step()) {
        const row = notesStmt.getAsObject();
        notes.push({
            id: row.id as number,
            mid: row.mid as number,
            flds: row.flds as string,
            tags: (row.tags as string || '').trim().split(' ').filter(Boolean),
        });
    }
    notesStmt.free();

    // Query for models (to understand the note structure)
    onProgress(60, "Processando modelos de cards");
    const colStmt = db.prepare("SELECT models, decks FROM col");
    colStmt.step();
    const colRow = colStmt.getAsObject();
    const models = JSON.parse(colRow.models as string);
    const decks = JSON.parse(colRow.decks as string);
    colStmt.free();

    const deckNameMap: Record<string, string> = {};
    Object.keys(decks || {}).forEach(deckId => {
        const deck = decks[deckId];
        if (deck) {
            deckNameMap[deckId] = deck.name || `Baralho ${deckId}`;
        }
    });

    const cardsStmt = db.prepare("SELECT nid, did FROM cards");
    const noteToDeckId = new Map<number, string>();
    while (cardsStmt.step()) {
        const row = cardsStmt.getAsObject();
        const nid = row.nid as number;
        const didValue = row.did as number;
        if (nid && didValue && !noteToDeckId.has(nid)) {
            noteToDeckId.set(nid, didValue.toString());
        }
    }
    cardsStmt.free();

    const ankiCards: AnkiCard[] = [];
    const totalNotes = notes.length;

    onProgress(75, "Montando flashcards");
    for (let i = 0; i < totalNotes; i++) {
        const note = notes[i];
        const model = models[note.mid.toString()];
        if (!model) continue;

        // Find the index for front/back fields, accounting for decks that rename them
        const fieldNames: string[] = model.flds.map((f: any) => f.name?.trim() ?? '');

        const candidateFrontFields = ['Front', 'Text', 'Word', 'Question', 'Expression', 'Inglês', 'English'];
        const candidateBackFields = ['Back', 'Answer', 'Meaning', 'Translation', 'Português', 'Portuguese'];

        let frontIdx = candidateFrontFields
            .map(name => fieldNames.findIndex(fieldName => fieldName.toLowerCase() === name.toLowerCase()))
            .find(index => index !== -1) ?? -1;

        let backIdx = candidateBackFields
            .map(name => fieldNames.findIndex(fieldName => fieldName.toLowerCase() === name.toLowerCase()))
            .find(index => index !== -1) ?? -1;

        // Fallback: assume first field is the front and second is the back when not explicitly labeled
        if (frontIdx === -1 && fieldNames.length > 0) {
            frontIdx = 0;
        }

        if ((backIdx === -1 || backIdx === frontIdx) && fieldNames.length > 1) {
            backIdx = frontIdx === 0 ? 1 : 0;
        }

        if (frontIdx === -1 || backIdx === -1 || frontIdx === backIdx) {
            console.warn('Anki import: skipping note due to unrecognized field layout:', { fieldNames, noteId: note.id });
            continue;
        }

        const fields = note.flds.split('\x1f');
        
        // Log all fields for first card to debug
        if (i === 0) {
            console.log('[AnkiParser] First note all fields:', {
                fieldNames: model.flds.map((f: any) => f.name),
                allFields: fields.map((f, idx) => ({ index: idx, value: f.substring(0, 100) })),
                selectedFrontIdx: frontIdx,
                selectedBackIdx: backIdx
            });
        }
        
        // Get raw field values
        let frontHtml = fields[frontIdx] || '';
        let backHtml = fields[backIdx] || '';
        
        // If front field looks like metadata, try to find a better field
        if (isLikelyMetadata(frontHtml)) {
            console.warn('[AnkiParser] Front field looks like metadata, searching for better field:', stripHtml(frontHtml).substring(0, 50));
            for (let j = 0; j < fields.length; j++) {
                if (j !== frontIdx && j !== backIdx && !isLikelyMetadata(fields[j]) && fields[j].trim()) {
                    console.log('[AnkiParser] Using field', j, 'as front instead:', stripHtml(fields[j]).substring(0, 50));
                    frontHtml = fields[j];
                    break;
                }
            }
        }
        
        // Same for back field
        if (isLikelyMetadata(backHtml)) {
            console.warn('[AnkiParser] Back field looks like metadata, searching for better field:', stripHtml(backHtml).substring(0, 50));
            for (let j = 0; j < fields.length; j++) {
                if (j !== frontIdx && j !== backIdx && !isLikelyMetadata(fields[j]) && fields[j].trim()) {
                    console.log('[AnkiParser] Using field', j, 'as back instead:', stripHtml(fields[j]).substring(0, 50));
                    backHtml = fields[j];
                    break;
                }
            }
        }

        let frontText = stripAndClean(frontHtml);
        if (!frontText) {
            const alternativeFront = pickBestField(fields, new Set([backIdx].filter(idx => idx >= 0)));
            if (alternativeFront) {
                frontIdx = alternativeFront.idx;
                frontHtml = alternativeFront.html;
                frontText = alternativeFront.cleanedText;
                console.log('[AnkiParser] Using alternative field as front:', {
                    noteId: note.id,
                    alternativeIndex: alternativeFront.idx,
                    preview: frontText.substring(0, 80)
                });
            }
        }

        let backText = stripAndClean(backHtml);
        if (!backText) {
            const alternativeBack = pickBestField(
                fields,
                new Set([frontIdx].filter(idx => idx >= 0)),
                true
            );
            if (alternativeBack) {
                backIdx = alternativeBack.idx;
                backHtml = alternativeBack.html;
                backText = alternativeBack.cleanedText;
                console.log('[AnkiParser] Using alternative field as back:', {
                    noteId: note.id,
                    alternativeIndex: alternativeBack.idx,
                    preview: backText.substring(0, 80)
                });
            }
        }

        // Extract all images and audio from both front and back
        let imageB64: string | undefined = undefined;
        let audioB64: string | undefined = undefined;
        
        const allImages = Array.from(new Set(fields.flatMap(extractAllImageSrcs)));
        const allAudios = Array.from(new Set(fields.flatMap(extractAllAudioSrcs)));

        // Extract first image if available
        if (allImages.length > 0) {
            const imgName = allImages[0];
            const fileKey = mediaMap[imgName] || imgName;
            const imgFile = zip.file(fileKey);
            if (imgFile) {
                try {
                    const imgData = await imgFile.async('base64');
                    const mimeType = getMimeType(imgName);
                    imageB64 = `data:${mimeType};base64,${imgData}`;
                    console.log('[AnkiParser] Extracted image:', { imgName, mimeType, size: imgData.length });
                } catch (error) {
                    console.error('[AnkiParser] Failed to extract image:', { imgName, error });
                }
            }
        }
        
        // Extract first audio if available
        if (allAudios.length > 0) {
            const audioName = allAudios[0];
            const fileKey = mediaMap[audioName] || audioName;
            const audioFile = zip.file(fileKey);
            if (audioFile) {
                try {
                    const audioData = await audioFile.async('base64');
                    const mimeType = getMimeType(audioName);
                    audioB64 = `data:${mimeType};base64,${audioData}`;
                    console.log('[AnkiParser] Extracted audio:', { audioName, mimeType, size: audioData.length });
                } catch (error) {
                    console.error('[AnkiParser] Failed to extract audio:', { audioName, error });
                }
            }
        }
        
        if (!frontText && !backText) {
            // Skip empty cards after cleaning
            console.log('[AnkiParser] Skipping empty card after cleaning:', { noteId: note.id });
            continue;
        }

        // Log first few cards for debugging
        if (ankiCards.length < 3) {
            console.log('[AnkiParser] Card extracted:', {
                noteId: note.id,
                frontText: frontText.substring(0, 50),
                backText: backText.substring(0, 50),
                hasImage: !!imageB64,
                hasAudio: !!audioB64,
                imageCount: allImages.length,
                audioCount: allAudios.length,
                fieldNames: model.flds.map((f: any) => f.name),
                frontIdx,
                backIdx
            });
        }

        const noteDeckId = noteToDeckId.get(note.id);
        const noteDeckName = noteDeckId ? deckNameMap[noteDeckId] || `Deck ${noteDeckId}` : undefined;

        ankiCards.push({
            id: note.id,
            front: frontText,
            back: backText,
            image: imageB64,
            audio: audioB64,
            tags: note.tags,
            deckId: noteDeckId,
            deckName: noteDeckName,
        });

        if (i % 10 === 0) {
            onProgress(75 + Math.round((i / totalNotes) * 25), "Montando flashcards");
        }
    }

    db.close();
    onProgress(100, "Concluído");
    
    const cardsWithImages = ankiCards.filter(c => c.image).length;
    const cardsWithAudio = ankiCards.filter(c => c.audio).length;
    
    console.log('='.repeat(80));
    console.log('🎴 [ANKI IMPORT] Import completed successfully');
    console.log(`📊 Total cards: ${ankiCards.length}`);
    console.log(`🖼️  Cards with images: ${cardsWithImages}`);
    console.log(`🔊 Cards with audio: ${cardsWithAudio}`);
    console.log('='.repeat(80));

    return ankiCards;
};
