import { act } from "@testing-library/react";

import type { AnkiImportPayload, ImportedDeck, MediaAsset } from "@services/anki/types";
import { useImportStore } from "./importStore";

const createMockPayload = (): AnkiImportPayload => {
  const deck: ImportedDeck = {
    id: "deck-1",
    name: "Deck Teste",
    cards: [],
    rawDeck: {},
  };

  const mediaBlob = new Blob(["test"], { type: "text/plain" });
  const mediaAsset: MediaAsset = {
    name: "file.txt",
    size: mediaBlob.size,
    blob: mediaBlob,
    url: "blob:test",
    revokeUrl: jest.fn(),
  };

  return {
    decks: [deck],
    mediaAssets: [mediaAsset],
  };
};

describe("importStore", () => {
  beforeEach(() => {
    useImportStore.getState().reset();
  });

  it("armazena o payload importado", () => {
    const payload = createMockPayload();

    act(() => {
      useImportStore.getState().setPayload(payload);
    });

    const state = useImportStore.getState();
    expect(state.decks).toHaveLength(1);
    expect(state.mediaAssets).toHaveLength(1);
  });

  it("limpa decks/mídias e revoga URLs ao resetar", () => {
    const payload = createMockPayload();
    const revokeSpy = payload.mediaAssets[0].revokeUrl as jest.Mock;

    act(() => {
      useImportStore.getState().setPayload(payload);
      useImportStore.getState().reset();
    });

    const state = useImportStore.getState();
    expect(state.decks).toHaveLength(0);
    expect(state.mediaAssets).toHaveLength(0);
    expect(revokeSpy).toHaveBeenCalled();
  });
});
