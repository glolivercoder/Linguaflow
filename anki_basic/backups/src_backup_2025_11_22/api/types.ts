export interface AnkiMediaFile {
  name: string;
  data: Blob;
}

export interface AnkiImportResult {
  decks: Record<string, unknown>;
  media: Record<string, Blob>;
}
