
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Settings, Flashcard, RawCard, AnkiCard, AnkiDeckSummary } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { PREDEFINED_FLASHCARD_DATA } from './data/flashcardData';
import ConversationView from './components/ConversationView';
import FlashcardsView from './components/FlashcardsView';
import SettingsView from './components/SettingsView';
import AnkiView from './components/AnkiView';
import { SettingsIcon, BookOpenIcon, MicIcon, CubeIcon } from './components/icons';
import * as db from './services/db';
import { ImageOverride } from './services/db';
import { downloadPixabayLogs, clearPixabayLogs, addPixabayLog, getPixabayLogs } from './services/pixabayLogger';

type CategorizedFlashcards = Record<'phrases' | 'objects', Record<string, Flashcard[]>>;

const UNKNOWN_ANKI_DECK_ID = 'anki-unknown';
const UNKNOWN_ANKI_DECK_NAME = 'Baralho Anki';

const isAnkiFlashcard = (card: Flashcard): boolean =>
  card.sourceType === 'anki' || card.id.startsWith('anki-');

const buildDeckSummaries = (
  cards: Flashcard[],
  existingSummaries: AnkiDeckSummary[]
): AnkiDeckSummary[] => {
  const existingMap = new Map(existingSummaries.map(summary => [summary.id, summary]));
  const aggregate = new Map<string, { name: string; count: number }>();

  cards.forEach(card => {
    if (!isAnkiFlashcard(card)) {
      return;
    }

    const deckId = card.ankiDeckId || UNKNOWN_ANKI_DECK_ID;
    const deckName = card.ankiDeckName || UNKNOWN_ANKI_DECK_NAME;
    const current = aggregate.get(deckId);
    if (current) {
      current.count += 1;
      if (!current.name && deckName) {
        current.name = deckName;
      }
    } else {
      aggregate.set(deckId, { name: deckName, count: 1 });
    }
  });

  const rebuilt = Array.from(aggregate.entries()).map(([deckId, data]) => ({
    id: deckId,
    name: data.name || UNKNOWN_ANKI_DECK_NAME,
    cardCount: data.count,
    importedAt: existingMap.get(deckId)?.importedAt ?? Date.now(),
  }));

  rebuilt.sort((a, b) => b.importedAt - a.importedAt);

  return rebuilt;
};

const App: React.FC = () => {
  const [view, setView] = useState<View>('conversation');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [userFlashcards, setUserFlashcards] = useState<Flashcard[]>([]);
  const [phoneticCache, setPhoneticCache] = useState<Awaited<ReturnType<typeof db.getAllPhonetics>>>([]);
  const [imageOverrides, setImageOverrides] = useState<ImageOverride[]>([]);
  const [ankiDecks, setAnkiDecks] = useState<AnkiDeckSummary[]>([]);

  // Load initial data from DB on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [savedSettings, savedFlashcards, savedPhonetics, savedImageOverrides, savedAnkiDecks] = await Promise.all([
          db.getSettings(),
          db.getFlashcards(),
          db.getAllPhonetics(),
          db.getAllImageOverrides(),
          db.getAnkiDeckSummaries(),
        ]);
        setSettings(savedSettings);
        setUserFlashcards(savedFlashcards);
        setPhoneticCache(savedPhonetics);
        setImageOverrides(savedImageOverrides);
        setAnkiDecks(savedAnkiDecks);
      } catch (error) {
        console.error("Fatal: Failed to load initial data from the database.", error);
        // If loading fails, fall back to default settings to prevent a crash.
        setSettings(DEFAULT_SETTINGS);
        setUserFlashcards([]);
        setPhoneticCache([]);
        setImageOverrides([]);
        setAnkiDecks([]);
      }
    };
    loadData();
  }, []);
  
  // This memoized value will re-calculate ONLY when settings or user flashcards change.
  // This is a more robust and declarative way to handle data processing.
  const categorizedFlashcards = useMemo<CategorizedFlashcards>(() => {
    console.log('[App] Recalculating categorizedFlashcards. imageOverrides count:', imageOverrides.length);
    
    if (!settings) {
      // If settings are not loaded yet, return an empty structure.
      return { phrases: {}, objects: {} };
    }
    
    const { nativeLanguage, learningLanguage } = settings;
    const processed: CategorizedFlashcards = { phrases: {}, objects: {} };

    // Helper function to map raw card data to a displayable Flashcard object.
    const mapCard = (rawCard: RawCard): Flashcard => {
        const phoneticText = phoneticCache.find(p => p.cardId === rawCard.id)?.phonetic || '';
        const imageOverride = imageOverrides.find(o => o.cardId === rawCard.id);
        
        if (imageOverride) {
          console.log('[App] Found imageOverride for card:', { cardId: rawCard.id, imageUrl: imageOverride.imageUrl });
        }
        
        return {
          id: rawCard.id,
          originalText: rawCard.texts[nativeLanguage] || 'Texto não disponível',
          translatedText: rawCard.texts[learningLanguage] || 'Tradução não disponível',
          phoneticText,
          originalLang: nativeLanguage,
          translatedLang: learningLanguage,
          imageUrl: imageOverride?.imageUrl || rawCard.imageUrl, // Use override if available
        };
    };

    // Process all predefined phrases and objects.
    for (const category in PREDEFINED_FLASHCARD_DATA.phrases) {
      processed.phrases[category] = PREDEFINED_FLASHCARD_DATA.phrases[category].map(rawCard => mapCard(rawCard));
    }
    for (const category in PREDEFINED_FLASHCARD_DATA.objects) {
      processed.objects[category] = PREDEFINED_FLASHCARD_DATA.objects[category].map(rawCard => mapCard(rawCard));
    }

    // Add user's saved flashcards to a special "Minhas Frases" category.
    if (userFlashcards.length > 0) {
      const userCreatedCards = userFlashcards.filter(card => !isAnkiFlashcard(card));

      if (userCreatedCards.length > 0) {
        processed.phrases["Minhas Frases"] = userCreatedCards;
      }
    }

    return processed;
  }, [settings, userFlashcards, phoneticCache, imageOverrides]);

  const ankiDeckCards = useMemo(() => {
    const deckMap = new Map<string, { name: string; cards: Flashcard[] }>();
    userFlashcards.forEach(card => {
      if (!isAnkiFlashcard(card)) {
        return;
      }

      const deckId = card.ankiDeckId || UNKNOWN_ANKI_DECK_ID;
      const deckName = card.ankiDeckName || UNKNOWN_ANKI_DECK_NAME;
      const existing = deckMap.get(deckId);
      if (existing) {
        existing.cards.push(card);
        if (!existing.name && deckName) {
          existing.name = deckName;
        }
      } else {
        deckMap.set(deckId, { name: deckName, cards: [card] });
      }
    });

    const result: Record<string, { name: string; cards: Flashcard[] }> = {};
    deckMap.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }, [userFlashcards]);


  const handleSettingsChange = (newSettings: Settings) => {
    setSettings(newSettings);
    db.saveSettings(newSettings);
  };

  const addFlashcard = useCallback((newCardData: Omit<Flashcard, 'id'>) => {
    const newCard: Flashcard = { ...newCardData, id: new Date().toISOString(), sourceType: 'manual' };
    db.addFlashcard(newCard).then(() => {
        setUserFlashcards(prev => [...prev, newCard]);
    });
  }, []);
  
  const handleImageChange = useCallback(async (cardId: string, newImageUrl: string) => {
    addPixabayLog('info', 'Applying image to card', { cardId, imageUrl: newImageUrl });
    console.log('[App] handleImageChange called:', { cardId, newImageUrl });
    
    // Use an "optimistic update" pattern.
    // 1. Update the state immediately for a responsive UI.
    setImageOverrides(prevOverrides => {
      const overrideExists = prevOverrides.some(o => o.cardId === cardId);
      const newOverrides = overrideExists
        ? prevOverrides.map(override =>
            override.cardId === cardId
              ? { ...override, imageUrl: newImageUrl }
              : override
          )
        : [...prevOverrides, { cardId, imageUrl: newImageUrl }];
      
      console.log('[App] Updated imageOverrides:', { 
        oldCount: prevOverrides.length, 
        newCount: newOverrides.length,
        updatedCard: newOverrides.find(o => o.cardId === cardId)
      });
      return newOverrides;
    });

    // 2. Persist the change to the database in the background.
    await db.saveImageOverride(cardId, newImageUrl);
    addPixabayLog('info', 'Image persisted to override store', { cardId });
  }, []);

  const handleAnkiImport = useCallback(async (ankiCards: AnkiCard[]) => {
    if (!settings) return;

    console.log('='.repeat(80));
    console.log('💾 [APP] Processing Anki cards for database');
    console.log(`📦 Received ${ankiCards.length} cards from parser`);
    console.log('='.repeat(80));
    
    const now = Date.now();
    const newFlashcards: Flashcard[] = ankiCards.map((ankiCard, index) => {
      const deckId = ankiCard.deckId || UNKNOWN_ANKI_DECK_ID;
      const deckName = ankiCard.deckName || UNKNOWN_ANKI_DECK_NAME;
      const flashcard: Flashcard = {
        id: `anki-${ankiCard.id}-${now + index}`, // Ensure unique ID even within same millisecond
        // Match the pattern from ConversationView: original=native, translated=learning
        originalText: ankiCard.back,      // Native language (back of Anki card)
        translatedText: ankiCard.front,   // Learning language (front of Anki card)
        phoneticText: '',
        originalLang: settings.nativeLanguage,
        translatedLang: settings.learningLanguage,
        imageUrl: ankiCard.image,
        sourceType: 'anki',
        ankiDeckId: deckId,
        ankiDeckName: deckName,
        ankiNoteId: ankiCard.id,
      };

      // Log first 3 cards for debugging
      if (index < 3) {
        console.log(`🔍 [APP] Card ${index + 1}/${ankiCards.length}:`, {
          ankiId: ankiCard.id,
          front: ankiCard.front?.substring(0, 50),
          back: ankiCard.back?.substring(0, 50),
          hasImage: !!ankiCard.image,
          hasAudio: !!ankiCard.audio,
          imageLength: ankiCard.image?.length || 0,
          imagePrefix: ankiCard.image?.substring(0, 50)
        });
      }
      
      return flashcard;
    });

    await db.bulkAddFlashcards(newFlashcards);
    console.log('✅ [APP] Anki cards saved to DB');

    // Reload all flashcards from DB to ensure state is in sync
    const [allFlashcards, allPhonetics, allImageOverrides] = await Promise.all([
      db.getFlashcards(),
      db.getAllPhonetics(),
      db.getAllImageOverrides(),
    ]);
    setUserFlashcards(allFlashcards);
    setPhoneticCache(allPhonetics);
    setImageOverrides(allImageOverrides);

    const ankiCardsFromDb = allFlashcards.filter(isAnkiFlashcard);
    const ankiWithImages = ankiCardsFromDb.filter(c => c.imageUrl).length;

    console.log('='.repeat(80));
    console.log('📚 [APP] Flashcards reloaded from database');
    console.log(`📊 Total flashcards: ${allFlashcards.length}`);
    console.log(`🎴 Anki cards: ${ankiCardsFromDb.length}`);
    console.log(`🖼️  Anki cards with images: ${ankiWithImages}`);
    console.log('='.repeat(80));

    const updatedDeckSummaries = buildDeckSummaries(allFlashcards, ankiDecks);
    await db.replaceAnkiDeckSummaries(updatedDeckSummaries);
    setAnkiDecks(updatedDeckSummaries);

    // Switch to flashcards view to see the new deck
    setView('flashcards');

  }, [settings, ankiDecks]);

  const handleRemoveAnkiDeck = useCallback(async (deckId: string) => {
    await db.deleteAnkiDeck(deckId);
    const [allFlashcards, allPhonetics, allImageOverrides] = await Promise.all([
      db.getFlashcards(),
      db.getAllPhonetics(),
      db.getAllImageOverrides(),
    ]);
    const remainingSummaries = ankiDecks.filter(deck => deck.id !== deckId);
    const updatedDeckSummaries = buildDeckSummaries(allFlashcards, remainingSummaries);
    await db.replaceAnkiDeckSummaries(updatedDeckSummaries);
    setUserFlashcards(allFlashcards);
    setPhoneticCache(allPhonetics);
    setImageOverrides(allImageOverrides);
    setAnkiDecks(updatedDeckSummaries);
  }, [ankiDecks]);


  const renderView = () => {
    if (!settings) {
        return <div className="flex items-center justify-center h-full text-gray-400">Carregando configurações...</div>;
    }
    switch (view) {
      case 'conversation':
        return <ConversationView settings={settings} addFlashcard={addFlashcard} />;
      case 'flashcards':
        // FIX: Corrected typo in function name from 'handleImagechange' to 'handleImageChange'.
        return <FlashcardsView categorizedFlashcards={categorizedFlashcards} settings={settings} onBack={() => setView('conversation')} onImageChange={handleImageChange} />;
      case 'settings':
        return (
          <SettingsView
            settings={settings}
            ankiDecks={ankiDecks}
            onSettingsChange={handleSettingsChange}
            onRemoveAnkiDeck={handleRemoveAnkiDeck}
            onBack={() => setView('conversation')}
          />
        );
      case 'anki':
        return <AnkiView decks={ankiDeckCards} onImportComplete={handleAnkiImport} settings={settings} onBack={() => setView('conversation')} />;
      default:
        return <ConversationView settings={settings} addFlashcard={addFlashcard} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">
      <header className="bg-gray-800 shadow-md p-4 flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-bold text-white">
          LinguaFlow <span className="text-cyan-400">AI</span>
        </h1>
        <nav className="flex items-center space-x-2 md:space-x-4">
          <NavButton
            label="Conversa"
            icon={<MicIcon className="w-5 h-5" />}
            isActive={view === 'conversation'}
            onClick={() => setView('conversation')}
          />
          <NavButton
            label="Flashcards"
            icon={<BookOpenIcon className="w-5 h-5" />}
            isActive={view === 'flashcards'}
            onClick={() => setView('flashcards')}
          />
          <NavButton
            label="Anki"
            icon={<CubeIcon className="w-5 h-5" />}
            isActive={view === 'anki'}
            onClick={() => setView('anki')}
          />
          <NavButton
            label="Ajustes"
            icon={<SettingsIcon className="w-5 h-5" />}
            isActive={view === 'settings'}
            onClick={() => setView('settings')}
          />
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const logs = getPixabayLogs();
              console.log('=== PIXABAY LOGS ===');
              console.log(logs);
              console.log('=== END LOGS ===');
              downloadPixabayLogs();
            }}
            className="text-sm px-3 py-2 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
            title="Baixa arquivo .txt e exibe logs no console"
          >
            Baixar logs Pixabay
          </button>
          <button
            onClick={() => clearPixabayLogs()}
            className="text-sm px-3 py-2 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
          >
            Limpar logs
          </button>
        </div>
      </header>
      <main className="flex-grow overflow-y-auto">
        {renderView()}
      </main>
    </div>
  );
};

const NavButton: React.FC<{
  label: string,
  icon: React.ReactNode,
  isActive: boolean,
  onClick: () => void
}> = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors text-sm font-medium ${isActive
        ? 'bg-cyan-600 text-white'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
  >
    {icon}
    <span className="hidden md:inline">{label}</span>
  </button>
)

export default App;