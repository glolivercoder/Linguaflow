import type { ImportedDeck } from "@services/anki/types";

export interface DeckStats {
  totalCards: number;
  totalDecks: number;
  lastImportAt?: string;
}

export interface AppStateSnapshot {
  decks: ImportedDeck[];
  stats: DeckStats;
}
