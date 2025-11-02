import Dexie, { type Table } from 'dexie';
import { Settings, Flashcard } from '../types';
import { DEFAULT_SETTINGS } from '../constants';

interface PhoneticCache {
  cardId: string;
  phonetic: string;
}

export interface ImageOverride {
  cardId: string;
  imageUrl: string;
}

interface SettingsRecord extends Settings {
    id: number;
}

const db = new Dexie('linguaFlowDB');

db.version(2).stores({
  settings: 'id',
  flashcards: 'id',
  phonetics: 'cardId',
  imageOverrides: 'cardId',
});

const settingsTable: Table<SettingsRecord, number> = db.table('settings');
const flashcardsTable: Table<Flashcard, string> = db.table('flashcards');
const phoneticsTable: Table<PhoneticCache, string> = db.table('phonetics');
const imageOverridesTable: Table<ImageOverride, string> = db.table('imageOverrides');


// --- Settings ---
export const getSettings = async (): Promise<Settings> => {
  const settingsRecord = await settingsTable.get(1);
  
  const cleanedRecord: Partial<Settings> = {};
  if (settingsRecord) {
    for (const key in DEFAULT_SETTINGS) {
      const recordKey = key as keyof Settings;
      if (
        Object.prototype.hasOwnProperty.call(settingsRecord, recordKey) &&
        settingsRecord[recordKey] !== null &&
        settingsRecord[recordKey] !== undefined
      ) {
        (cleanedRecord as any)[recordKey] = settingsRecord[recordKey];
      }
    }
  }

  const finalSettings = { ...DEFAULT_SETTINGS, ...cleanedRecord };

  // The record in the DB has an `id`, but the Settings type doesn't.
  // We remove it before returning to match the type.
  const { id, ...settingsToReturn } = finalSettings as SettingsRecord;

  return settingsToReturn;
};

export const saveSettings = async (settings: Settings): Promise<void> => {
  await settingsTable.put({ ...settings, id: 1 });
};

// --- Flashcards ---
export const getFlashcards = (): Promise<Flashcard[]> => {
  return flashcardsTable.toArray();
};

export const addFlashcard = async (card: Flashcard): Promise<void> => {
  await flashcardsTable.add(card);
};

export const bulkAddFlashcards = async (cards: Flashcard[]): Promise<void> => {
    await flashcardsTable.bulkAdd(cards);
};

export const updateFlashcardImage = async (cardId: string, imageUrl: string): Promise<void> => {
  await flashcardsTable.update(cardId, { imageUrl });
};

// --- Phonetics Cache ---
export const cachePhonetic = async (cardId: string, phonetic: string): Promise<void> => {
  await phoneticsTable.put({ cardId, phonetic });
};

export const getPhonetic = async (cardId: string): Promise<string | null> => {
  const cached = await phoneticsTable.get(cardId);
  return cached?.phonetic || null;
};

export const getAllPhonetics = (): Promise<PhoneticCache[]> => {
  return phoneticsTable.toArray();
}

// --- Image Overrides ---
export const saveImageOverride = async (cardId: string, imageUrl: string): Promise<void> => {
  await imageOverridesTable.put({ cardId, imageUrl });
};

export const getAllImageOverrides = (): Promise<ImageOverride[]> => {
  return imageOverridesTable.toArray();
};
