// @ts-ignore - file-loader import for WASM
// eslint-disable-next-line import/no-webpack-loader-syntax
import sqlWasm from "!!file-loader?name=sql-wasm-[contenthash].wasm!sql.js/dist/sql-wasm.wasm";

import { readAnkiPackageV3 } from "./ankiV3Reader";
// Removed unused AnkiCollection import
import type { AnkiCard, AnkiDeck } from "./interfaces";
import { ensureProxyConfig } from "@api/config";
import type { AnkiImportPayload, ImportedDeck, ImportedCard, MediaAsset } from "./types";

export interface ImportOptions {
  file: File;
}

export async function importAnkiPackage({ file }: ImportOptions): Promise<AnkiImportPayload> {
  if (!file) {
    throw new Error("Arquivo .apkg não informado");
  }

  let extracted: any = null;
  try {
    // Use custom V3 reader
    extracted = await readAnkiPackageV3(file, {
      sqlConfig: {
        locateFile: () => sqlWasm,
      },
    });
    const { collection, media } = extracted;

    console.log("🔍 DEBUG: extracted =", extracted);
    console.log("🔍 DEBUG: collection =", collection);
    console.log("🔍 DEBUG: collection.getDecks() =", collection.getDecks());
    console.log("🔍 DEBUG: media =", media);

    // Helper function to get note fields from raw note
    const getNoteFields = (rawNote: any): string[] => {
      if (!rawNote || !rawNote.flds) return [];
      // Fields are separated by character 0x1f (31)
      return rawNote.flds.split("\x1f");
    };

    // Get raw collection to access notes
    const rawCollection = collection.getRawCollection?.();

    const decks = Object.entries(collection.getDecks()).map<ImportedDeck>(([deckId, deck]) => {
      const typedDeck = deck as AnkiDeck;
      const rawDeck = typedDeck.getRawDeck?.();
      return {
        id: deckId,
        name: typedDeck.getName?.() ?? rawDeck?.name ?? deckId,
        description: rawDeck?.desc,
        cards: Object.entries(typedDeck.getCards()).map<ImportedCard>(([cardId, card]) => {
          const typedCard = card as AnkiCard;
          const rawCard = (typedCard.getRawCard?.() ?? typedCard) as any;

          let front = "";
          let back = "";

          if (rawCard && rawCard.nid && rawCollection) {
            try {
              const noteQuery = (rawCollection as any).exec(
                `SELECT flds FROM notes WHERE id = ${rawCard.nid}`
              );
              if (noteQuery && noteQuery[0] && noteQuery[0].values && noteQuery[0].values[0]) {
                const fldsRaw = noteQuery[0].values[0][0];
                const fields = getNoteFields({ flds: fldsRaw });
                if (fields.length > 0) front = (fields[0] || "").trim();
                if (fields.length > 1) back = (fields[1] || "").trim();
                if (!front && fields.length > 0) {
                  front = fields.find((f) => f && f.trim()) || "";
                }
              }
            } catch (error) {
              console.error("❌ Error getting note fields for card", cardId, error);
            }
          }

          if (!front) front = "Frente não disponível";
          if (!back) back = "Verso não disponível";

          return {
            id: cardId,
            deckId,
            front,
            back,
            rawCard,
          };
        }),
        rawDeck: rawDeck ?? typedDeck,
      };
    });

    console.log("🔍 DEBUG: decks processados =", decks);
    console.log("🔍 DEBUG: total de decks =", decks.length);

    const mediaAssets: MediaAsset[] = Object.entries(media ?? {}).map(([name, blob]) => {
      const typedBlob = blob as Blob;
      const extension = name.split('.').pop()?.toLowerCase();
      let mimeType = typedBlob.type;
      if (!mimeType || mimeType === "" || mimeType === "application/octet-stream") {
        switch (extension) {
          case "mp3": mimeType = "audio/mpeg"; break;
          case "wav": mimeType = "audio/wav"; break;
          case "ogg": mimeType = "audio/ogg"; break;
          case "m4a": mimeType = "audio/mp4"; break;
          case "aac": mimeType = "audio/aac"; break;
          case "jpg":
          case "jpeg": mimeType = "image/jpeg"; break;
          case "png": mimeType = "image/png"; break;
          case "gif": mimeType = "image/gif"; break;
          case "svg": mimeType = "image/svg+xml"; break;
          case "webp": mimeType = "image/webp"; break;
        }
      }
      const finalBlob = mimeType && mimeType !== typedBlob.type ? new Blob([typedBlob], { type: mimeType }) : typedBlob;
      const url = URL.createObjectURL(finalBlob);
      return {
        name,
        size: finalBlob.size,
        blob: finalBlob,
        url,
        revokeUrl: () => URL.revokeObjectURL(url),
      };
    });

    return {
      decks,
      mediaAssets,
      rawCollection: collection.getRawCollection?.() ?? collection,
    };
  } finally {
    // Ensure database connection is closed regardless of success or failure
    if (extracted && extracted.close) {
      extracted.close();
    }
  }
}

export function getMediaPreviewUrl(asset: MediaAsset): string {
  if (asset.url) {
    return asset.url;
  }
  const url = URL.createObjectURL(asset.blob);
  asset.url = url;
  return url;
}

export function resolveProxyMediaPath(assetName: string): string {
  const config = ensureProxyConfig();
  if (!config.mediaBaseUrl) {
    throw new Error("REACT_APP_MEDIA_BASE_URL não configurado para media proxy");
  }
  return `${config.mediaBaseUrl.replace(/\/$/, "")}/${assetName}`;
}
