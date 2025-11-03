

export type LanguageCode = 'en-US' | 'es-ES' | 'pt-BR' | 'zh-CN' | 'ja-JP' | 'ru-RU' | 'fr-FR' | 'it-IT' | 'eo';

export interface Language {
  code: LanguageCode;
  name: string;
}

export type VoiceGender = 'male' | 'female' | 'neutral';

export type FlashcardSourceType = 'manual' | 'anki';

export interface Flashcard {
  id: string;
  originalText: string;
  translatedText: string;
  phoneticText: string;
  originalLang: LanguageCode;
  translatedLang: LanguageCode;
  imageUrl?: string;
  sourceType?: FlashcardSourceType;
  ankiDeckId?: string;
  ankiDeckName?: string;
  ankiNoteId?: number;
}

export interface Settings {
  nativeLanguage: LanguageCode;
  learningLanguage: LanguageCode;
  voiceGender: VoiceGender;
}

export type View = 'conversation' | 'flashcards' | 'settings' | 'anki' | 'smartLearn';


// --- New types for Predefined Flashcard Data ---

export type MultilingualText = Partial<Record<LanguageCode, string>>;

export interface RawCard {
    id: string;
    texts: MultilingualText;
    imageUrl?: string; // Add imageUrl to raw card data
}

export interface RawCategory {
    [categoryName: string]: RawCard[];
}

// FIX: Corrected typo 'Raw-Category' to 'RawCategory'. A hyphen is not allowed in a type name and was causing parsing errors.
export interface RawFlashcardData {
    phrases: RawCategory;
    objects: RawCategory;
}

// --- Types for Anki Importer ---
export interface AnkiCard {
    id: number;
    front: string;
    back: string;
    image?: string;
    audio?: string;
    tags: string[];
    deckId?: string;
    deckName?: string;
}

export interface AnkiDeckSummary {
    id: string;
    name: string;
    cardCount: number;
    importedAt: number;
}