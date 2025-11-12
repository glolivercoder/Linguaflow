import Dexie, { type Table } from 'dexie';
import { Settings, Flashcard, AnkiDeckSummary } from '../types';
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

interface AnkiDeckRecord extends AnkiDeckSummary {}

const db = new Dexie('linguaFlowDB');

db.version(2).stores({
  settings: 'id',
  flashcards: 'id',
  phonetics: 'cardId',
  imageOverrides: 'cardId',
});

db.version(3).stores({
  settings: 'id',
  flashcards: 'id, sourceType, ankiDeckId',
  phonetics: 'cardId',
  imageOverrides: 'cardId',
  ankiDecks: 'id',
}).upgrade(async tx => {
  const flashcardsTable = tx.table('flashcards');
  await flashcardsTable.toCollection().modify((card: any) => {
    if (!card.sourceType) {
      card.sourceType = typeof card.id === 'string' && card.id.startsWith('anki-') ? 'anki' : 'manual';
    }
  });
});

db.version(4).stores({
  settings: 'id',
  flashcards: 'id, sourceType, ankiDeckId',
  phonetics: 'cardId',
  imageOverrides: 'cardId',
  ankiDecks: 'id, importedAt',
}).upgrade(async tx => {
  const ankiDecksTable = tx.table('ankiDecks');
  await ankiDecksTable.toCollection().modify((deck: any) => {
    if (!deck.importedAt) {
      deck.importedAt = new Date().toISOString();
    }
  });
});

const settingsTable: Table<SettingsRecord, number> = db.table('settings');
const flashcardsTable: Table<Flashcard, string> = db.table('flashcards');
const phoneticsTable: Table<PhoneticCache, string> = db.table('phonetics');
const imageOverridesTable: Table<ImageOverride, string> = db.table('imageOverrides');
const ankiDecksTable: Table<AnkiDeckRecord, string> = db.table('ankiDecks');


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

export const deleteFlashcards = async (cardIds: string[]): Promise<void> => {
  if (!cardIds.length) return;
  await flashcardsTable.bulkDelete(cardIds);
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

// --- Anki Decks ---
export const getAnkiDeckSummaries = (): Promise<AnkiDeckSummary[]> => {
  return ankiDecksTable.orderBy('importedAt').reverse().toArray();
};

export const upsertAnkiDeckSummary = async (summary: AnkiDeckSummary): Promise<void> => {
  await ankiDecksTable.put(summary);
};

export const deleteAnkiDeck = async (deckId: string): Promise<void> => {
  await db.transaction('rw', flashcardsTable, phoneticsTable, imageOverridesTable, ankiDecksTable, async () => {
    const flashcardIds = await flashcardsTable.where('ankiDeckId').equals(deckId).primaryKeys() as string[];
    if (flashcardIds.length) {
      await flashcardsTable.where('ankiDeckId').equals(deckId).delete();
      await phoneticsTable.bulkDelete(flashcardIds);
      await imageOverridesTable.bulkDelete(flashcardIds);
    }
    await ankiDecksTable.delete(deckId);
  });
};

export const replaceAnkiDeckSummaries = async (summaries: AnkiDeckSummary[]): Promise<void> => {
  await db.transaction('rw', ankiDecksTable, async () => {
    await ankiDecksTable.clear();
    if (summaries.length) {
      await ankiDecksTable.bulkAdd(summaries);
    }
  });
};
