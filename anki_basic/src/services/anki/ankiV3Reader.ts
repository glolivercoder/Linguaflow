import JSZip from "jszip";
// @ts-ignore
import initSqlJs from "sql.js";
import { AnkiCard, AnkiCollection, AnkiDeck, ReadAnkiPackageResult } from "./interfaces";

// Interface for the SQL database
interface SqlDatabase {
  exec(sql: string): { columns: string[]; values: any[][] }[];
  close(): void;
}

export interface AnkiReaderOptions {
  sqlConfig?: {
    locateFile: (file: string) => string;
  };
}

export async function readAnkiPackageV3(
  file: File | Blob | ArrayBuffer,
  options?: AnkiReaderOptions
): Promise<ReadAnkiPackageResult> {
  // 1. Load zip file
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);

  // 2. Find database file
  // Priority: collection.anki21b (latest), collection.anki21 (V3), collection.anki2 (Legacy)
  let dbFile = loadedZip.file("collection.anki21b");
  if (!dbFile) dbFile = loadedZip.file("collection.anki21");
  if (!dbFile) dbFile = loadedZip.file("collection.anki2");

  if (!dbFile) {
    throw new Error("No valid Anki database found in package (checked .anki21b, .anki21, .anki2)");
  }

  console.log(`📦 AnkiV3Reader: Found database file: ${dbFile.name}`);

  // 3. Load database content
  const dbContent = await dbFile.async("uint8array");

  // 4. Initialize SQL.js
  const SQL = await initSqlJs(options?.sqlConfig);
  const db = new SQL.Database(dbContent) as SqlDatabase;

  // DEBUG: List all tables
  try {
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
    console.log("🔍 DEBUG: Database Tables:", tables[0]?.values);

    // DEBUG: Check columns in 'cards' and 'notes' (or 'col')
    const cardsCols = db.exec("PRAGMA table_info(cards)");
    console.log("🔍 DEBUG: 'cards' columns:", cardsCols[0]?.values);

    const notesCols = db.exec("PRAGMA table_info(notes)");
    console.log("🔍 DEBUG: 'notes' columns:", notesCols[0]?.values);

    const colCols = db.exec("PRAGMA table_info(col)");
    console.log("🔍 DEBUG: 'col' columns:", colCols[0]?.values);
  } catch (e) {
    console.error("⚠️ DEBUG: Error inspecting database structure:", e);
  }

  // 5. Extract media mapping
  const mediaFile = loadedZip.file("media");
  let mediaMapping: Record<string, string> = {};
  if (mediaFile) {
    const mediaContent = await mediaFile.async("string");
    try {
      mediaMapping = JSON.parse(mediaContent);
    } catch (e) {
      console.warn("Failed to parse media mapping:", e);
    }
  }

  // 6. Extract media files
  const media: Record<string, Blob> = {};
  for (const [key, filename] of Object.entries(mediaMapping)) {
    const file = loadedZip.file(key);
    if (file) {
      const blob = await file.async("blob");
      media[filename] = blob;
    }
  }

  // 7. Create Collection object
  const collection: AnkiCollection = {
    getDecks: () => {
      const decks: Record<string, AnkiDeck> = {};

      // Query decks from 'col' table (stored as JSON in 'decks' column)
      const colResult = db.exec("SELECT decks FROM col");
      if (colResult.length > 0 && colResult[0].values.length > 0) {
        const decksJson = JSON.parse(colResult[0].values[0][0] as string);

        for (const [deckId, deckData] of Object.entries(decksJson)) {
          const deck = deckData as any;

          // Skip dynamic decks (filtered decks) if needed, usually id < 1 or huge ids

          decks[deckId] = {
            getName: () => deck.name,
            getRawDeck: () => deck,
            getCards: () => {
              const cards: Record<string, AnkiCard> = {};

              // Query cards for this deck
              // We select id, nid, ord from cards table
              const cardsResult = db.exec(`SELECT id, nid, ord FROM cards WHERE did = ${deckId}`);

              if (cardsResult.length > 0) {
                for (const row of cardsResult[0].values) {
                  const cardId = row[0] as number;
                  const nid = row[1] as number;
                  const ord = row[2] as number;

                  cards[cardId.toString()] = {
                    getRawCard: () => ({
                      id: cardId,
                      nid: nid,
                      ord: ord,
                      did: parseInt(deckId),
                    }),
                    // We don't implement getQuestion/getAnswer here as we use raw access in importService
                  };
                }
              }

              return cards;
            },
          };
        }
      }

      return decks;
    },
    getRawCollection: () => db,
  };

  return {
    collection,
    media,
    close: () => {
      try {
        db.close();
        console.log("📦 AnkiV3Reader: Database closed.");
      } catch (e) {
        console.warn("⚠️ AnkiV3Reader: Error closing database:", e);
      }
    }, // Added comma here as per instruction
  };
}
