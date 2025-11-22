
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Settings, Flashcard, RawCard } from './types';
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
import { invalidateImageCache } from './services/imageCacheService';
import { triggerBackupOnFlashcardAdd, triggerBackupOnSettingsChange, triggerBackupOnTranslationCache } from './services/autoBackupService';

type CategorizedFlashcards = Record<'phrases' | 'objects', Record<string, Flashcard[]>>;

const App: React.FC = () => {
  const [view, setView] = useState<View>('conversation');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [userFlashcards, setUserFlashcards] = useState<Flashcard[]>([]);
  const [phoneticCache, setPhoneticCache] = useState<Awaited<ReturnType<typeof db.getAllPhonetics>>>([]);
  const [imageOverrides, setImageOverrides] = useState<ImageOverride[]>([]);
  const [isAutoPreprocessing, setIsAutoPreprocessing] = useState(false);
  const [autoPreprocessStatus, setAutoPreprocessStatus] = useState('');
  const [autoPreprocessProgress, setAutoPreprocessProgress] = useState(0);

  // Load initial data from DB on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [savedSettings, savedFlashcards, savedPhonetics, savedImageOverrides] = await Promise.all([
          db.getSettings(),
          db.getFlashcards(),
          db.getAllPhonetics(),
          db.getAllImageOverrides(),
        ]);
        setSettings(savedSettings);
        setUserFlashcards(savedFlashcards);
        setPhoneticCache(savedPhonetics);
        setImageOverrides(savedImageOverrides);
      } catch (error) {
        console.error("Fatal: Failed to load initial data from the database.", error);
        // If loading fails, fall back to default settings to prevent a crash.
        setSettings(DEFAULT_SETTINGS);
        setUserFlashcards([]);
        setPhoneticCache([]);
        setImageOverrides([]);
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
      processed.phrases["Minhas Frases"] = userFlashcards;
    }

    return processed;
  }, [settings, userFlashcards, phoneticCache, imageOverrides]);




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

      const [savedSettings, savedFlashcards, savedPhonetics, savedImageOverrides] = await Promise.all([
        db.getSettings(),
        db.getFlashcards(),
        db.getAllPhonetics(),
        db.getAllImageOverrides(),
      ]);

      setSettings(savedSettings);
      setUserFlashcards(savedFlashcards);
      setPhoneticCache(savedPhonetics);
      setImageOverrides(savedImageOverrides);
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

    await invalidateImageCache(cardId);

    // 2. Persist the change to the database in the background.
    await db.saveImageOverride(cardId, newImageUrl);
    addPixabayLog('info', 'Image persisted to override store', { cardId });
  }, []);




  const renderView = () => {
    if (!settings) {
      return <div className="flex items-center justify-center h-full text-gray-400">Carregando configurações...</div>;
    }
    switch (view) {
      case 'conversation':
        return <ConversationView settings={settings} addFlashcard={addFlashcard} isAutoPreprocessing={isAutoPreprocessing} autoPreprocessStatus={autoPreprocessStatus} autoPreprocessProgress={autoPreprocessProgress} />;
      case 'flashcards':
        // FIX: Corrected typo in function name from 'handleImagechange' to 'handleImageChange'.
        return <FlashcardsView categorizedFlashcards={categorizedFlashcards} settings={settings} onBack={() => setView('conversation')} onImageChange={handleImageChange} imageOverrides={imageOverrides} />;
      case 'settings':
        return (
          <SettingsView
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onExportBackup={handleExportData}
            onImportBackup={handleImportBackup}
            onBack={() => setView('conversation')}
          />
        );
      case 'anki':
        return <AnkiView settings={settings} onBack={() => setView('conversation')} />;
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
