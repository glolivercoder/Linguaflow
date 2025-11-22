export interface ImportedCard {
  id: string;
  deckId: string;
  front?: string;
  back?: string;
  rawCard: unknown;
}

export interface ImportedDeck {
  id: string;
  name: string;
  description?: string;
  cards: ImportedCard[];
  rawDeck: unknown;
}

export interface MediaAsset {
  name: string;
  size: number;
  blob: Blob;
  url?: string;
  revokeUrl: () => void;
}

export interface AnkiImportPayload {
  decks: ImportedDeck[];
  mediaAssets: MediaAsset[];
  rawCollection?: unknown;
}
