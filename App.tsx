
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Settings, Flashcard, RawCard, AnkiCard, AnkiDeckSummary } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { PREDEFINED_FLASHCARD_DATA } from './data/flashcardData';
import ConversationView from './components/ConversationView';
import FlashcardsView from './components/FlashcardsView';
import SettingsView from './components/SettingsView';
import SmartLearnView from './components/SmartLearnView';
import AnkiView from './components/AnkiView';
import LicoesView from './components/LicoesView';
import { SettingsIcon, BookOpenIcon, MicIcon, CubeIcon } from './components/icons';
import { GraduationCap } from 'lucide-react';
import * as db from './services/db';
import { translateText, getPhonetics } from './services/geminiService';
import { CATEGORY_DEFINITIONS, CATEGORY_KEYS, BASE_CATEGORY_LANGUAGE_NAME, type QAItem, type CategoryDefinition, type CategorySection, type PhraseSection, type TranslatedCategories } from './data/conversationCategories';
import { saveCategoryTranslations, getCategoryTranslations, getCategoryPhonetic, saveCategoryPhonetic } from './services/db';
import { ImageOverride } from './services/db';
import { downloadPixabayLogs, clearPixabayLogs, addPixabayLog, getPixabayLogs } from './services/pixabayLogger';
import { triggerBackupOnFlashcardAdd, triggerBackupOnSettingsChange, triggerBackupOnTranslationCache } from './services/autoBackupService';

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
  const [isAutoPreprocessing, setIsAutoPreprocessing] = useState(false);
  const [autoPreprocessStatus, setAutoPreprocessStatus] = useState('');
  const [autoPreprocessProgress, setAutoPreprocessProgress] = useState(0);

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

  const autoPreprocessIfNeeded = useCallback(async (currentSettings: Settings) => {
    try {
      setIsAutoPreprocessing(true);
      setAutoPreprocessStatus('Verificando cache...');
      setAutoPreprocessProgress(0);
      const englishName = 'English (US)';
      const nativeName = currentSettings.nativeLanguage;
      const enExisting = await getCategoryTranslations('en-US');
      const needsFix = (existing: TranslatedCategories | null): boolean => {
        if (!existing) return true;
        for (const key of CATEGORY_KEYS) {
          const base = CATEGORY_DEFINITIONS[key];
          const enCat = existing[key];
          if (!enCat) return true;
          if (enCat.sections.length !== base.sections.length) return true;
          for (let i = 0; i < base.sections.length; i++) {
            const s = base.sections[i];
            const es = enCat.sections[i];
            if (!es) return true;
            if (s.type === 'phrases') {
              const srcItems = s.items as string[];
              const enItems = es.items as string[];
              if (enItems.length !== srcItems.length) return true;
              for (let j = 0; j < srcItems.length; j++) {
                const pt = (srcItems[j] || '').trim();
                const en = (enItems[j] || '').trim();
                if (!en || en.toLowerCase() === pt.toLowerCase()) return true;
              }
            } else {
              const srcItems = s.items as QAItem[];
              const enItems = es.items as QAItem[];
              if (enItems.length !== srcItems.length) return true;
              for (let j = 0; j < srcItems.length; j++) {
                const ptQ = (srcItems[j].question || '').trim();
                const enQ = (enItems[j].question || '').trim();
                const ptA = (srcItems[j].answer || '').trim();
                const enA = (enItems[j].answer || '').trim();
                if (!enQ || enQ.toLowerCase() === ptQ.toLowerCase()) return true;
                if (!enA || enA.toLowerCase() === ptA.toLowerCase()) return true;
              }
            }
          }
        }
        return false;
      };

      if (!needsFix(enExisting)) {
        setAutoPreprocessStatus('Cache pronto');
        setAutoPreprocessProgress(100);
        setIsAutoPreprocessing(false);
        return;
      }

      const out: Partial<TranslatedCategories> = {};
      setAutoPreprocessStatus('Preparando categorias...');
      for (const key of CATEGORY_KEYS) {
        const base = CATEGORY_DEFINITIONS[key];
        const sections: CategorySection[] = [];
        for (const section of base.sections) {
          if (section.type === 'phrases') {
            const items: string[] = [];
            for (const it of section.items as string[]) {
              const tr = await translateText(it, BASE_CATEGORY_LANGUAGE_NAME, englishName);
              items.push(tr && tr !== 'Erro na tradução.' ? tr : it);
            }
            sections.push({ ...section, heading: await translateText(section.heading, BASE_CATEGORY_LANGUAGE_NAME, englishName), items } as PhraseSection);
          } else {
            const items: QAItem[] = [];
            for (const it of section.items as QAItem[]) {
              const q = await translateText(it.question, BASE_CATEGORY_LANGUAGE_NAME, englishName);
              const a = await translateText(it.answer, BASE_CATEGORY_LANGUAGE_NAME, englishName);
              items.push({ question: q, answer: a });
            }
            sections.push({ ...section, heading: await translateText(section.heading, BASE_CATEGORY_LANGUAGE_NAME, englishName), items } as CategorySection);
          }
        }
        const translated: CategoryDefinition = {
          ...base,
          title: await translateText(base.title, BASE_CATEGORY_LANGUAGE_NAME, englishName),
          description: await translateText(base.description, BASE_CATEGORY_LANGUAGE_NAME, englishName),
          roleInstruction: await translateText(base.roleInstruction, BASE_CATEGORY_LANGUAGE_NAME, englishName),
          kickoffPrompt: await translateText(base.kickoffPrompt, BASE_CATEGORY_LANGUAGE_NAME, englishName),
          sections,
        };
        (out as TranslatedCategories)[key] = translated;
      }

      const merged = out as TranslatedCategories;
      await saveCategoryTranslations('en-US', merged);

      setAutoPreprocessStatus('Gerando fonética...');
      const texts: string[] = [];
      CATEGORY_KEYS.forEach((key) => {
        const cat = merged[key];
        cat.sections.forEach((section) => {
          if (section.type === 'qa') {
            (section.items as QAItem[]).forEach((it) => { texts.push(it.question); texts.push(it.answer); });
          } else {
            (section.items as string[]).forEach((it) => texts.push(it));
          }
        });
      });
      let processed = 0;
      const total = texts.length;
      for (const t of texts) {
        const cached = await getCategoryPhonetic('en-US', currentSettings.nativeLanguage, t);
        if (!cached) {
          const ph = await getPhonetics(t, englishName, nativeName);
          await saveCategoryPhonetic('en-US', currentSettings.nativeLanguage, t, ph);
        }
        processed++;
        setAutoPreprocessProgress(Math.round((processed / total) * 100));
      }
      setAutoPreprocessStatus('Concluído');
    } catch (error) {
      console.error('[App] Auto preprocess failed:', error);
    }
    finally {
      setIsAutoPreprocessing(false);
    }
  }, []);

  useEffect(() => {
    if (!settings) return;
    autoPreprocessIfNeeded(settings);
  }, [settings, autoPreprocessIfNeeded]);

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
      // Prioritize predefined phonetics, then fall back to cached phonetics
      const predefinedPhonetic = rawCard.phoneticTexts?.[learningLanguage] || '';
      const cachedPhonetic = phoneticCache.find(p => p.cardId === rawCard.id)?.phonetic || '';
      const phoneticText = predefinedPhonetic || cachedPhonetic;

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
    triggerBackupOnSettingsChange(); // Auto-backup trigger
  };

  const handleExportData = async () => {
    try {
      const snapshot = await db.exportDatabaseSnapshot();
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.href = url;
      link.download = `linguaflow-backup-${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      alert('Backup exportado com sucesso!');
    } catch (error) {
      console.error('Failed to export data snapshot', error);
      alert('Falha ao exportar backup. Verifique o console para detalhes.');
    }
  };

  const handleImportBackup = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as db.DatabaseSnapshot;
      await db.importDatabaseSnapshot(parsed);

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
      alert('Backup restaurado com sucesso!');
      if (savedSettings) {
        autoPreprocessIfNeeded(savedSettings);
      }
    } catch (error) {
      console.error('Failed to import backup', error);
      alert('Falha ao restaurar backup. Verifique se o arquivo é válido.');
    }
  };

  const addFlashcard = useCallback((newCardData: Omit<Flashcard, 'id'>) => {
    const newCard: Flashcard = { ...newCardData, id: new Date().toISOString(), sourceType: 'manual' };
    db.addFlashcard(newCard).then(() => {
      setUserFlashcards(prev => [...prev, newCard]);
      triggerBackupOnFlashcardAdd(); // Auto-backup trigger
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
        return <ConversationView settings={settings} addFlashcard={addFlashcard} isAutoPreprocessing={isAutoPreprocessing} autoPreprocessStatus={autoPreprocessStatus} autoPreprocessProgress={autoPreprocessProgress} />;
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
            onExportBackup={handleExportData}
            onImportBackup={handleImportBackup}
            onBack={() => setView('conversation')}
          />
        );
      case 'anki':
        return <AnkiView decks={ankiDeckCards} onImportComplete={handleAnkiImport} onConvertComplete={async (flashcards) => {
          // Save converted flashcards to database
          await db.bulkAddFlashcards(flashcards);
          // Reload flashcards from DB
          const [allFlashcards, allPhonetics, allImageOverrides] = await Promise.all([
            db.getFlashcards(),
            db.getAllPhonetics(),
            db.getAllImageOverrides(),
          ]);
          setUserFlashcards(allFlashcards);
          setPhoneticCache(allPhonetics);
          setImageOverrides(allImageOverrides);
          console.log(`[App] ${flashcards.length} cards converted and saved`);
        }} settings={settings} onBack={() => setView('conversation')} />;
      case 'smartLearn':
        return <SmartLearnView settings={settings} onBack={() => setView('conversation')} />;
      case 'licoes':
        return <LicoesView settings={settings} onBack={() => setView('conversation')} />;
      default:
        return <ConversationView settings={settings} addFlashcard={addFlashcard} isAutoPreprocessing={isAutoPreprocessing} autoPreprocessStatus={autoPreprocessStatus} autoPreprocessProgress={autoPreprocessProgress} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-inter">
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
            label="Smart Learn"
            icon={<BookOpenIcon className="w-5 h-5" />}
            isActive={view === 'smartLearn'}
            onClick={() => setView('smartLearn')}
          />
          <NavButton
            label="Lições"
            icon={<GraduationCap className="w-5 h-5" />}
            isActive={view === 'licoes'}
            onClick={() => setView('licoes')}
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
