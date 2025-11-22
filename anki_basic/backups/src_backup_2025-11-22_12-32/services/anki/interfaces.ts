export interface AnkiCard {
  getQuestion?(): string;
  getAnswer?(): string;
  getRawCard?(): unknown;
}

export interface AnkiDeck {
  getName?(): string;
  getCards(): Record<string, AnkiCard>;
  getRawDeck?(): { name?: string; desc?: string };
}

export interface AnkiCollection {
  getDecks(): Record<string, AnkiDeck>;
  getRawCollection?(): unknown;
}

export interface ReadAnkiPackageResult {
  collection: AnkiCollection;
  media?: Record<string, Blob>;
}

export interface ReadAnkiPackageOptions {
  sqlConfig?: {
    locateFile?: (file: string) => string;
  };
}
