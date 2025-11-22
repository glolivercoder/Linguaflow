import { importAnkiPackage, resolveProxyMediaPath } from "./importService";
import type { ReadAnkiPackageResult } from "anki-reader";

const mockedReadAnkiPackage = jest.fn();

jest.mock("anki-reader", () => ({
  readAnkiPackage: (...args: unknown[]) => mockedReadAnkiPackage(...args),
}));

describe("importService", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    mockedReadAnkiPackage.mockReset();
    process.env.REACT_APP_PROXY_BASE_URL = "https://proxy";
    process.env.REACT_APP_MEDIA_BASE_URL = "https://proxy/media";

    global.URL.createObjectURL = jest.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    process.env.REACT_APP_PROXY_BASE_URL = originalEnv.REACT_APP_PROXY_BASE_URL;
    process.env.REACT_APP_MEDIA_BASE_URL = originalEnv.REACT_APP_MEDIA_BASE_URL;
  });

  it("converte decks, cartões e mídia retornados pelo anki-reader", async () => {
    const deckId = "123";
    const cardId = "1";

    mockedReadAnkiPackage.mockResolvedValue({
      collection: {
        getDecks: () => ({
          [deckId]: {
            getName: () => "Deck teste",
            getCards: () => ({
              [cardId]: {
                getQuestion: () => "Frente",
                getAnswer: () => "Verso",
                getRawCard: () => ({ id: cardId }),
              },
            }),
            getRawDeck: () => ({ name: "Deck teste", desc: "Descrição" }),
          },
        }),
        getRawCollection: () => ({ db: "raw" }),
      },
      media: {
        "audio.mp3": new Blob(["audio"], { type: "audio/mpeg" }),
      },
    } as ReadAnkiPackageResult);

    const file = new File(["dummy"], "deck.apkg", { type: "application/zip" });
    const payload = await importAnkiPackage({ file });

    expect(payload.decks).toHaveLength(1);
    expect(payload.decks[0].cards).toHaveLength(1);
    expect(payload.mediaAssets).toHaveLength(1);
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it("resolveProxyMediaPath utiliza a URL do .env e falha se ausente", () => {
    expect(resolveProxyMediaPath("audio.mp3")).toBe("https://proxy/media/audio.mp3");

    process.env.REACT_APP_MEDIA_BASE_URL = "";
    process.env.REACT_APP_PROXY_BASE_URL = "https://proxy";
    expect(() => resolveProxyMediaPath("audio.mp3")).toThrow();
  });
});
