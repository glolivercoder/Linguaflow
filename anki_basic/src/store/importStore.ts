import { create } from "zustand";

import type { AnkiImportPayload, ImportedDeck, MediaAsset } from "@services/anki/types";

interface ImportState {
  decks: ImportedDeck[];
  mediaAssets: MediaAsset[];
  setPayload: (payload: AnkiImportPayload) => void;
  reset: () => void;
}

function disposeMediaAssets(assets: MediaAsset[]) {
  assets.forEach((asset) => {
    if (asset.url) {
      asset.revokeUrl();
    }
  });
}

export const useImportStore = create<ImportState>((set, get) => ({
  decks: [],
  mediaAssets: [],
  setPayload: (payload) => {
    disposeMediaAssets(get().mediaAssets);
    set({ decks: payload.decks, mediaAssets: payload.mediaAssets });
  },
  reset: () => {
    disposeMediaAssets(get().mediaAssets);
    set({ decks: [], mediaAssets: [] });
  },
}));
