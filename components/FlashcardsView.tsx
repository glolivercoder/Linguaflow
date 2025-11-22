import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Flashcard, Settings, LanguageCode, RawCard } from '../types';
import { searchImages } from '../services/pixabayService';
import { getPhonetics } from '../services/geminiService';
import { SUPPORTED_LANGUAGES } from '../constants';
import { SpeakerIcon, ImageIcon, PlusCircleIcon } from './icons';
import { downloadAndCacheImage, getCachedImageUrl } from '../services/imageCacheService';
import { playAudio as playLocalAudio } from '../services/ttsService';
import * as db from '../services/db';
import { CustomCategoryManager } from './CustomCategoryManager';

type CategorizedFlashcards = Record<'phrases' | 'objects', Record<string, Flashcard[]>>;

interface FlashcardsViewProps {
  categorizedFlashcards: CategorizedFlashcards;
  settings: Settings;
  onBack: () => void;
  onImageChange: (cardId: string, newImageUrl: string) => void;
  imageOverrides: { cardId: string; imageUrl: string }[]; // ADD: For custom category image overrides
}

const ImagePickerModal: React.FC<{
  card: Flashcard;
  onSelect: (imageUrl: string) => void;
  onClose: () => void;
}> = ({ card, onSelect, onClose }) => {
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      console.log('[ImagePickerModal] Starting to fetch images for:', card.translatedText);
      setIsLoading(true);
      const fetchedImages = await searchImages(card.translatedText);
      console.log('[ImagePickerModal] Fetched', fetchedImages.length, 'images');
      setImages(fetchedImages);
      setIsLoading(false);
    };
    fetchImages();
  }, [card.translatedText]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-gray-800 rounded-xl shadow-lg p-6 w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-cyan-400 mb-4">Escolha uma imagem para "{card.translatedText}"</h3>
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <p className="text-gray-400">Buscando imagens...</p>
          </div>
        ) : images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((imgUrl, index) => (
              <img
                key={index}
                src={imgUrl}
                alt={`Option ${index + 1} for ${card.translatedText}`}
                className="w-full h-32 object-cover rounded-md cursor-pointer hover:ring-4 ring-cyan-500 transition-all"
                onClick={() => {
                  console.log('[ImagePickerModal] Image selected:', imgUrl);
                  onSelect(imgUrl);
                  onClose(); // Close modal immediately after selection
                }}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 h-48 flex items-center justify-center">Nenhuma imagem encontrada. Verifique sua chave da API do Pixabay.</p>
        )}
        <button onClick={onClose} className="mt-6 px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500">
          Cancelar
        </button>
      </div>
    </div>
  );
};


export const FlashcardItem: React.FC<{
  card: Flashcard;
  settings: Settings;
  isObjectCard: boolean;
  onPickImage: (card: Flashcard) => void;
  onImageError?: (card: Flashcard) => void;
}> = ({ card, settings, isObjectCard, onPickImage, onImageError }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [phoneticText, setPhoneticText] = useState<string>('');
  const [isLoadingPhonetics, setIsLoadingPhonetics] = useState(false);
  const [displayImageUrl, setDisplayImageUrl] = useState<string | undefined>(card.imageUrl);

  useEffect(() => {
    // Reset state when card changes
    setIsFlipped(false);
    setPhoneticText(''); // Reset phonetic text
    console.log('[FlashcardItem] Card updated:', {
      cardId: card.id,
      imageUrl: card.imageUrl,
      originalText: card.originalText
    });
  }, [card]);

  useEffect(() => {
    let canceled = false;
    const load = async () => {
      if (!card.imageUrl) {
        setDisplayImageUrl(undefined);
        return;
      }
      const cached = await getCachedImageUrl(card.id);
      if (cached) {
        if (!canceled) setDisplayImageUrl(cached);
        return;
      }
      const url = await downloadAndCacheImage(card.imageUrl, card.id);
      if (!canceled) setDisplayImageUrl(url);
    };
    load();
    return () => { canceled = true; };
  }, [card.id, card.imageUrl]);

  // Load cached phonetic on mount
  useEffect(() => {
    const loadCachedPhonetic = async () => {
      try {
        const cached = await db.getPhonetic(card.id);
        if (cached) {
          setPhoneticText(cached); // getPhonetic returns string directly
        }
      } catch (error) {
        console.error('[FlashcardItem] Failed to load cached phonetic:', error);
      }
    };
    loadCachedPhonetic();
  }, [card.id]);


  const playAudio = useCallback(async (text: string, lang: LanguageCode) => {
    setIsPlaying(true);
    await playLocalAudio(text, lang, settings.voiceGender);
    setIsPlaying(false);
  }, [settings.voiceGender]);

  const fetchPhonetics = useCallback(async () => {
    if (!card.translatedText || phoneticText || isLoadingPhonetics) return;

    setIsLoadingPhonetics(true);
    try {
      const learningLangName = SUPPORTED_LANGUAGES.find(
        l => l.code === settings.learningLanguage
      )?.name || 'English (US)';
      const nativeLangName = SUPPORTED_LANGUAGES.find(
        l => l.code === settings.nativeLanguage
      )?.name || 'Português (Brasil)';

      const phonetic = await getPhonetics(card.translatedText, learningLangName, nativeLangName);
      setPhoneticText(phonetic);

      // Save to database for persistence
      await db.cachePhonetic(card.id, phonetic);
    } catch (error) {
      console.error('[FlashcardItem] Failed to fetch phonetics:', error);
    } finally {
      setIsLoadingPhonetics(false);
    }
  }, [card.translatedText, card.id, phoneticText, isLoadingPhonetics, settings.learningLanguage, settings.nativeLanguage]);

  const handleFlip = () => {
    const nextFlippedState = !isFlipped;
    console.log('[FlashcardItem] Flipping card:', {
      cardId: card.id,
      currentState: isFlipped ? 'back' : 'front',
      nextState: nextFlippedState ? 'back' : 'front',
      frontText: frontText?.substring(0, 30),
      backText: backText?.substring(0, 30)
    });
    setIsFlipped(nextFlippedState);
    if (nextFlippedState) { // Flipping to the back
      playAudio(card.translatedText, card.translatedLang);
      fetchPhonetics(); // Re-enabled
    }
  };

  // In this app, originalText is always native lang, translatedText is learning lang
  const frontText = card.originalText;
  const frontLang = card.originalLang;
  const backText = card.translatedText;
  const backLang = card.translatedLang;

  const backPhoneticText = phoneticText; // Use fetched phonetic text

  const renderImage = () => {
    if (!displayImageUrl) {
      console.log('[FlashcardItem] No imageUrl for card:', { cardId: card.id, frontText });
      return null;
    }

    console.log('[FlashcardItem] Rendering image:', {
      cardId: card.id,
      imageUrl: displayImageUrl,
      frontText
    });

    return (
      <img
        src={displayImageUrl}
        alt={frontText}
        className="w-full h-48 object-cover rounded-t-xl flex-shrink-0"
        onLoad={() => console.log('[FlashcardItem] Image loaded successfully:', card.id)}
        onError={(e) => {
          console.error('[FlashcardItem] Image failed to load:', {
            cardId: card.id,
            imageUrl: displayImageUrl,
            error: e
          });
          onImageError?.(card);
        }}
      />
    );
  };

  return (
    <div className="w-full h-64 md:h-72 perspective-1000">
      <div
        className={`relative w-full h-full transform-style-3d transition-transform duration-700 ${isFlipped ? 'rotate-y-180' : ''}`}
        onClick={handleFlip}
      >
        {/* Front of Card */}
        <div className="absolute w-full h-full backface-hidden bg-gray-700 rounded-xl shadow-lg overflow-hidden cursor-pointer">
          <div className="relative w-full h-full flex flex-col">
            {renderImage()}
            {isObjectCard && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('[FlashcardItem] Camera icon clicked:', {
                    cardId: card.id,
                    frontText: card.originalText
                  });
                  onPickImage(card);
                }}
                className="absolute top-2 left-2 p-2 rounded-full bg-gray-800/50 hover:bg-cyan-600/80 transition-colors backdrop-blur-sm z-10"
                aria-label="Change image"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
            )}
            <div className="p-4 flex-grow flex flex-col justify-center">
              <p className="text-xs text-cyan-400">{SUPPORTED_LANGUAGES.find(l => l.code === frontLang)?.name}</p>
              <p className="text-xl md:text-2xl mt-1">{frontText}</p>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); playAudio(frontText, frontLang); }}
            className="absolute bottom-4 right-4 p-2 rounded-full bg-gray-800 hover:bg-cyan-600 transition-colors"
            disabled={isPlaying}
            aria-label={`Play audio for ${frontText}`}
          >
            <SpeakerIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Back of Card */}
        <div className="absolute w-full h-full backface-hidden bg-cyan-800 rounded-xl shadow-lg p-6 flex flex-col justify-between cursor-pointer rotate-y-180">
          <div className="flex-grow flex flex-col justify-center">
            <p className="text-xs text-gray-200">{SUPPORTED_LANGUAGES.find(l => l.code === backLang)?.name}</p>
            <p className="text-xl md:text-2xl mt-1 text-white">{backText}</p>
            {backPhoneticText && (
              <p className="text-sm text-gray-300 mt-2 italic">
                {backPhoneticText}
              </p>
            )}
            {isLoadingPhonetics && (
              <p className="text-xs text-gray-400 mt-2">
                Carregando fonética...
              </p>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); playAudio(backText, backLang); }}
            className="absolute bottom-4 right-4 p-2 rounded-full bg-cyan-900 hover:bg-white hover:text-cyan-900 transition-colors"
            disabled={isPlaying}
            aria-label={`Play audio for ${backText}`}
          >
            <SpeakerIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

const SWEAR_CARDS = [
  { id: 'phr-swear-1', texts: { 'pt-BR': 'Idiota', 'en-US': 'Idiot' }, phoneticTexts: { 'en-US': '/ˈɪdiət/' } },
  { id: 'phr-swear-2', texts: { 'pt-BR': 'Estúpido', 'en-US': 'Stupid' }, phoneticTexts: { 'en-US': '/ˈstuːpɪd/' } },
  { id: 'phr-swear-3', texts: { 'pt-BR': 'Bobo', 'en-US': 'Fool' }, phoneticTexts: { 'en-US': '/fuːl/' } },
  { id: 'phr-swear-4', texts: { 'pt-BR': 'Pateta', 'en-US': 'Jerk' }, phoneticTexts: { 'en-US': '/dʒɝk/' } },
  { id: 'phr-swear-5', texts: { 'pt-BR': 'Chato', 'en-US': 'Annoying' }, phoneticTexts: { 'en-US': '/əˈnɔɪɪŋ/' } },
  { id: 'phr-swear-6', texts: { 'pt-BR': 'Droga', 'en-US': 'Darn' }, phoneticTexts: { 'en-US': '/dɑrn/' } },
  { id: 'phr-swear-7', texts: { 'pt-BR': 'Eita (leve)', 'en-US': 'Heck' }, phoneticTexts: { 'en-US': '/hɛk/' } },
  { id: 'phr-swear-8', texts: { 'pt-BR': 'Maldito', 'en-US': 'Damn' }, phoneticTexts: { 'en-US': '/dæm/' } },
  { id: 'phr-swear-9', texts: { 'pt-BR': 'Burro', 'en-US': 'Ass' }, phoneticTexts: { 'en-US': '/æs/' } },
  { id: 'phr-swear-10', texts: { 'pt-BR': 'Canalha', 'en-US': 'Bastard' }, phoneticTexts: { 'en-US': '/ˈbæstərd/' } },
  { id: 'phr-swear-11', texts: { 'pt-BR': 'Cadela (insulto)', 'en-US': 'Bitch' }, phoneticTexts: { 'en-US': '/bɪtʃ/' } },
  { id: 'phr-swear-12', texts: { 'pt-BR': 'Filho da mãe', 'en-US': 'Son of a gun' }, phoneticTexts: { 'en-US': '/sʌn əv ə ɡʌn/' } },
  { id: 'phr-swear-13', texts: { 'pt-BR': 'Merda', 'en-US': 'Crap' }, phoneticTexts: { 'en-US': '/kræp/' } },
  { id: 'phr-swear-14', texts: { 'pt-BR': 'Besteira', 'en-US': 'Bullshit' }, phoneticTexts: { 'en-US': '/ˈbʊlʃɪt/' } },
  { id: 'phr-swear-15', texts: { 'pt-BR': 'Cai fora', 'en-US': 'Piss off' }, phoneticTexts: { 'en-US': '/pɪs ɔf/' } },
  { id: 'phr-swear-16', texts: { 'pt-BR': 'Babaca', 'en-US': 'Asshole' }, phoneticTexts: { 'en-US': '/ˈæshoʊl/' } },
  { id: 'phr-swear-17', texts: { 'pt-BR': 'Pau (insulto)', 'en-US': 'Dick' }, phoneticTexts: { 'en-US': '/dɪk/' } },
  { id: 'phr-swear-18', texts: { 'pt-BR': 'Merda (forte)', 'en-US': 'Shit' }, phoneticTexts: { 'en-US': '/ʃɪt/' } },
  { id: 'phr-swear-19', texts: { 'pt-BR': 'Foda-se você', 'en-US': 'Screw you' }, phoneticTexts: { 'en-US': '/skruː juː/' } },
  { id: 'phr-swear-20', texts: { 'pt-BR': 'Vai se foder', 'en-US': 'Fuck off' }, phoneticTexts: { 'en-US': '/fʌk ɔf/' } },
  { id: 'phr-swear-21', texts: { 'pt-BR': 'Foda', 'en-US': 'Fuck' }, phoneticTexts: { 'en-US': '/fʌk/' } },
  { id: 'phr-swear-22', texts: { 'pt-BR': 'Filho da puta', 'en-US': 'Son of a bitch' }, phoneticTexts: { 'en-US': '/sʌn əv ə bɪtʃ/' } },
  { id: 'phr-swear-23', texts: { 'pt-BR': 'Desgraçado (forte)', 'en-US': 'Motherfucker' }, phoneticTexts: { 'en-US': '/ˈmʌðərˌfʌkər/' } },
  { id: 'phr-swear-24', texts: { 'pt-BR': 'Vagabunda (insulto)', 'en-US': 'Whore' }, phoneticTexts: { 'en-US': '/hɔr/' } },
  { id: 'phr-swear-25', texts: { 'pt-BR': 'Insulto extremo', 'en-US': 'Cunt' }, phoneticTexts: { 'en-US': '/kʌnt/' } },
];

const FlashcardsView: React.FC<FlashcardsViewProps> = ({ categorizedFlashcards, settings, onBack, onImageChange, imageOverrides }) => {
  const [activeTab, setActiveTab] = useState<'phrases' | 'objects'>('phrases');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pickingImageForCard, setPickingImageForCard] = useState<Flashcard | null>(null);
  const [imageErrorNonce, setImageErrorNonce] = useState(0);
  const autoLoadedCardsRef = useRef<Set<string>>(new Set());
  const [isCustomManagerOpen, setIsCustomManagerOpen] = useState(false);
  const [customCategories, setCustomCategories] = useState<Record<'phrases' | 'objects', db.CustomCategory[]>>({ phrases: [], objects: [] });
  const updateCustomCardImage = useCallback((cardId: string, imageUrl: string) => {
    setCustomCategories(prev => {
      const updateList = (list: db.CustomCategory[]) => {
        let listChanged = false;
        const updatedList = list.map(category => {
          const hasCard = category.cards.some(card => card.id === cardId);
          if (!hasCard) {
            return category;
          }
          listChanged = true;
          return {
            ...category,
            cards: category.cards.map(card =>
              card.id === cardId ? { ...card, imageUrl } : card
            )
          };
        });
        return { listChanged, updatedList };
      };

      const { listChanged: phrasesChanged, updatedList: phrasesList } = updateList(prev.phrases);
      const { listChanged: objectsChanged, updatedList: objectsList } = updateList(prev.objects);

      if (!phrasesChanged && !objectsChanged) {
        return prev;
      }

      return {
        phrases: phrasesChanged ? phrasesList : prev.phrases,
        objects: objectsChanged ? objectsList : prev.objects
      };
    });
  }, []);

  const rawCardToFlashcard = useCallback((rawCard: RawCard): Flashcard => {
    // Check for image override
    const override = imageOverrides.find(o => o.cardId === rawCard.id);

    return {
      id: rawCard.id,
      originalText: rawCard.texts[settings.nativeLanguage] || '',
      translatedText: rawCard.texts[settings.learningLanguage] || '',
      phoneticText: '',
      originalLang: settings.nativeLanguage,
      translatedLang: settings.learningLanguage,
      imageUrl: override?.imageUrl || rawCard.imageUrl, // Use override if exists
    };
  }, [settings.nativeLanguage, settings.learningLanguage, imageOverrides]);

  const allCategories = React.useMemo(() => {
    const predefined = categorizedFlashcards[activeTab] || {};
    const customList = customCategories[activeTab] || [];
    const customRecord: Record<string, Flashcard[]> = {};
    for (const cat of customList) {
      customRecord[cat.name] = cat.cards.map(rawCardToFlashcard);
    }
    const merged: Record<string, Flashcard[]> = { ...predefined };
    for (const name of Object.keys(customRecord)) {
      merged[name] = merged[name] ? [...merged[name], ...customRecord[name]] : customRecord[name];
    }
    return merged;
  }, [categorizedFlashcards, activeTab, customCategories, rawCardToFlashcard]);

  const customCategoryNames = React.useMemo(() => {
    return new Set((customCategories[activeTab] || []).map(c => c.name));
  }, [customCategories, activeTab]);

  const categories = Object.keys(allCategories).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  const cards = (selectedCategory && allCategories[selectedCategory]) || [];
  const currentCard = cards[currentIndex];

  useEffect(() => {
    const currentCategories = Object.keys(allCategories);
    if (currentCategories.length > 0 && !currentCategories.includes(selectedCategory || '')) {
      setSelectedCategory(currentCategories[0]);
      setCurrentIndex(0); // Only reset when category doesn't exist
    } else if (currentCategories.length === 0) {
      setSelectedCategory(null);
      setCurrentIndex(0); // Only reset when no categories
    }
    // DON'T reset currentIndex here - it causes deck to restart on every allCategories change!
  }, [activeTab, selectedCategory, allCategories]);

  // Reset currentIndex ONLY when user explicitly changes category or tab
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeTab, selectedCategory]);

  useEffect(() => {
    const loadCustomCategories = async () => {
      try {
        const [phrasesCategories, objectsCategories] = await Promise.all([
          db.getCustomCategories('phrases'),
          db.getCustomCategories('objects')
        ]);
        setCustomCategories({ phrases: phrasesCategories, objects: objectsCategories });
      } catch (error) {
        console.error('[FlashcardsView] Error loading custom categories:', error);
      }
    };
    loadCustomCategories();
  }, []);

  const hasUpdatedSwearRef = useRef(false);
  useEffect(() => {
    const replaceSwearCategory = async () => {
      if (hasUpdatedSwearRef.current) return;
      try {
        const phrases = await db.getCustomCategories('phrases');
        const target = phrases.find(c => c.name === 'Palavrões e Xingamentos');
        if (!target) return;
        const updated = { ...target, cards: SWEAR_CARDS, updatedAt: new Date().toISOString() };
        await db.saveCustomCategory(updated);
        const refreshed = await db.getCustomCategories('phrases');
        setCustomCategories(prev => ({ ...prev, phrases: refreshed }));
        if (selectedCategory === 'Palavrões e Xingamentos') {
          setCurrentIndex(0);
        }
        hasUpdatedSwearRef.current = true;
      } catch (e) {
        console.error('[FlashcardsView] Failed to replace swear category', e);
      }
    };
    replaceSwearCategory();
  }, [selectedCategory]);

  useEffect(() => {
    if (activeTab !== 'objects' || !currentCard) {
      return;
    }

    if (autoLoadedCardsRef.current.has(currentCard.id)) {
      return;
    }

    const hasOverride = imageOverrides.some(o => o.cardId === currentCard.id);
    const trimmedUrl = currentCard.imageUrl?.trim();
    const needsImage = !hasOverride && (!trimmedUrl || trimmedUrl === 'pixabay:auto');

    if (!needsImage) {
      autoLoadedCardsRef.current.add(currentCard.id);
      return;
    }

    const query = (currentCard.translatedText || currentCard.originalText || '').trim();
    if (!query) {
      return;
    }

    let canceled = false;

    const autoLoadImage = async () => {
      try {
        const images = await searchImages(query);
        if (!images || images.length === 0 || canceled) {
          console.warn('[FlashcardsView] No images found for autoload', { cardId: currentCard.id, query });
          return;
        }
        const imageUrl = images[0];
        await onImageChange(currentCard.id, imageUrl);
        updateCustomCardImage(currentCard.id, imageUrl);
        autoLoadedCardsRef.current.add(currentCard.id);
      } catch (error) {
        console.error('[FlashcardsView] Failed to auto-load image for card', {
          cardId: currentCard.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    };

    const timer = setTimeout(() => {
      autoLoadImage().catch(err => console.error('[FlashcardsView] Autoload error', err));
    }, 600);

    return () => {
      canceled = true;
      clearTimeout(timer);
    };
  }, [activeTab, currentCard, imageOverrides, onImageChange, updateCustomCardImage, imageErrorNonce]);

  const handleBrokenImage = useCallback((card: Flashcard) => {
    const lowerUrl = card.imageUrl?.toLowerCase() || '';
    const looksPixabay = lowerUrl.includes('pixabay.com');

    if (!looksPixabay) {
      return;
    }

    console.warn('[FlashcardsView] Broken Pixabay image detected. Resetting for autoload.', {
      cardId: card.id,
      imageUrl: card.imageUrl,
    });

    autoLoadedCardsRef.current.delete(card.id);
    onImageChange(card.id, 'pixabay:auto');
    updateCustomCardImage(card.id, 'pixabay:auto');
    setImageErrorNonce(n => n + 1);
  }, [onImageChange, updateCustomCardImage]);

  const handleImageSelect = (imageUrl: string) => {
    console.log('[FlashcardsView] handleImageSelect called:', {
      imageUrl,
      cardId: pickingImageForCard?.id,
      hasPickingCard: !!pickingImageForCard
    });

    if (pickingImageForCard) {
      console.log('[FlashcardsView] Calling onImageChange for card:', pickingImageForCard.id);
      onImageChange(pickingImageForCard.id, imageUrl);
      updateCustomCardImage(pickingImageForCard.id, imageUrl);
      setPickingImageForCard(null);
      console.log('[FlashcardsView] Image selection completed, modal should close');
    } else {
      console.warn('[FlashcardsView] No pickingImageForCard set!');
    }
  };

  const nextCard = () => cards.length > 0 && setCurrentIndex((prev) => (prev + 1) % cards.length);
  const prevCard = () => cards.length > 0 && setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);

  const [isAddItemsOpen, setIsAddItemsOpen] = useState(false);
  const [addTargetCategory, setAddTargetCategory] = useState<string | null>(null);
  const [addItemCount, setAddItemCount] = useState(10);
  const [addGenerated, setAddGenerated] = useState<RawCard[]>([]);
  const [addGenerating, setAddGenerating] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const openAddItemsModal = (categoryName: string) => {
    setAddTargetCategory(categoryName);
    setAddGenerated([]);
    setAddError(null);
    setIsAddItemsOpen(true);
  };

  const handleGenerateItems = async () => {
    if (!addTargetCategory) return;
    setAddError(null);
    setAddGenerating(true);
    try {
      const cards = await (await import('../services/categoryGeneratorService')).generateCategory({
        theme: addTargetCategory,
        type: activeTab,
        itemCount: addItemCount,
        nativeLanguage: settings.nativeLanguage,
        targetLanguage: settings.learningLanguage,
      });
      setAddGenerated(cards);
    } catch (e) {
      setAddError(e instanceof Error ? e.message : 'Falha ao gerar itens');
    } finally {
      setAddGenerating(false);
    }
  };

  const handleSaveItems = async () => {
    if (!addTargetCategory || addGenerated.length === 0) return;
    try {
      await db.appendCardsToCustomCategory(activeTab, addTargetCategory, addGenerated);
      const updated = await db.getCustomCategories(activeTab);
      setCustomCategories(prev => ({ ...prev, [activeTab]: updated }));
      setIsAddItemsOpen(false);
    } catch (e) {
      setAddError('Erro ao salvar itens');
    }
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col animate-fade-in">
      {pickingImageForCard && (() => {
        console.log('[FlashcardsView] Rendering ImagePickerModal for card:', {
          cardId: pickingImageForCard.id,
          translatedText: pickingImageForCard.translatedText
        });
        return (
          <ImagePickerModal
            card={pickingImageForCard}
            onSelect={handleImageSelect}
            onClose={() => {
              console.log('[FlashcardsView] Modal closing via onClose');
              setPickingImageForCard(null);
            }}
          />
        );
      })()}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-cyan-400">Flashcards</h2>
      </div>

      <div className="flex border-b border-gray-700 mb-4">
        <TabButton title="Frases" isActive={activeTab === 'phrases'} onClick={() => setActiveTab('phrases')} />
        <TabButton title="Objetos" isActive={activeTab === 'objects'} onClick={() => setActiveTab('objects')} />
      </div>

      <div className="flex-grow flex flex-col md:flex-row gap-6 overflow-y-auto">
        {/* Categories Sidebar */}
        <aside className="w-full md:w-1/4 lg:w-1/5 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-400">Categorias</h3>
            <button
              onClick={() => setIsCustomManagerOpen(true)}
              title="Nova categoria"
              className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              <PlusCircleIcon className="w-4 h-4 text-white" />
            </button>
          </div>
          <ul className="space-y-2">
            {categories.length > 0 ? categories.map(cat => (
              <li key={cat}>
                <div className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${selectedCategory === cat
                  ? 'bg-cyan-600 text-white font-bold'
                  : customCategoryNames.has(cat)
                    ? 'bg-yellow-300/15 hover:bg-yellow-300/25 text-yellow-200'
                    : 'hover:bg-gray-700'}`}
                >
                  <button
                    onClick={() => { setSelectedCategory(cat); setCurrentIndex(0); }}
                    className="text-left flex-1"
                  >
                    {cat}
                  </button>
                  <button
                    onClick={() => openAddItemsModal(cat)}
                    title="Adicionar itens"
                    aria-label={`Adicionar itens à categoria ${cat}`}
                    className="ml-2 inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#00FF00] hover:bg-[#00EE00] text-black ring-2 ring-[#00CC00] hover:ring-white"
                  >
                    <PlusCircleIcon className="w-4 h-4" />
                  </button>
                </div>
              </li>
            )) : <p className="text-sm text-gray-500">Nenhuma categoria encontrada.</p>}
          </ul>

          {activeTab === 'objects' && (
            <div className="mt-6 p-3 bg-gray-800 rounded-lg">
              <h4 className="font-semibold text-sm text-gray-300 mb-2">Imagens para Flashcards</h4>
              <p className="text-xs text-gray-400 mb-3">
                As imagens são carregadas dinamicamente via Pixabay. Clique no ícone de imagem no flashcard para escolher uma nova.
              </p>
            </div>
          )}

          <div className="mt-6 p-3 bg-gray-800 rounded-lg">
            <h4 className="font-semibold text-sm text-gray-300 mb-2">Importar Baralhos</h4>
            <p className="text-xs text-gray-400">
              Tem seus próprios baralhos? Use a aba 'Anki' para importar seus arquivos .apkg diretamente para o aplicativo.
            </p>
          </div>

        </aside>

        {/* Main Content */}
        <main className="w-full md:w-3/4 lg:w-4/5">
          {cards.length > 0 && selectedCategory ? (
            <div className="flex-grow flex flex-col items-center justify-center">
              <div className="w-full max-w-lg">
                <FlashcardItem
                  // Use only card ID as key - imageUrl in key causes unnecessary re-mounts
                  key={cards[currentIndex].id}
                  card={cards[currentIndex]}
                  settings={settings}
                  isObjectCard={activeTab === 'objects'}
                  onPickImage={setPickingImageForCard}
                  onImageError={handleBrokenImage}
                />
              </div>
              <div className="mt-6 flex items-center justify-center space-x-4">
                <button onClick={prevCard} className="px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600">Anterior</button>
                <span className="text-gray-400">{currentIndex + 1} / {cards.length}</span>
                <button onClick={nextCard} className="px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600">Próximo</button>
              </div>
            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-center text-gray-500 h-full">
              <p className="text-lg">Selecione uma categoria para começar</p>
              <p>Ou crie seus próprios flashcards na aba de conversa!</p>
            </div>
          )}
        </main>
      </div>

      <div className="mt-auto pt-6 flex-shrink-0">
        <button onClick={onBack} className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-colors">
          Voltar
        </button>
      </div>

      {isCustomManagerOpen && (
        <CustomCategoryManager
          type={activeTab}
          onCategoryCreated={async (category) => {
            try {
              const updated = await db.getCustomCategories(activeTab);
              setCustomCategories(prev => ({ ...prev, [activeTab]: updated }));
              setSelectedCategory(category.name);
              setCurrentIndex(0);
            } finally {
              setIsCustomManagerOpen(false);
            }
          }}
          onClose={() => setIsCustomManagerOpen(false)}
        />
      )}

      {isAddItemsOpen && addTargetCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-xl bg-gray-900 border border-gray-700 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-green-400">Adicionar itens em "{addTargetCategory}"</h2>
              <button onClick={() => setIsAddItemsOpen(false)} className="text-gray-400 hover:text-gray-200" title="Fechar">
                <PlusCircleIcon className="w-5 h-5 rotate-45" />
              </button>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Quantidade: {addItemCount}</label>
              <input type="range" min={5} max={20} value={addItemCount} onChange={(e) => setAddItemCount(parseInt(e.target.value))} className="w-full" />
            </div>
            {addError && <div className="text-red-300 text-sm">{addError}</div>}
            {addGenerated.length === 0 ? (
              <div className="flex gap-3">
                <button onClick={handleGenerateItems} disabled={addGenerating} className="flex-1 px-4 py-2 bg-[#00FF00] hover:bg-[#00EE00] text-black rounded-md font-semibold">
                  {addGenerating ? 'Gerando...' : 'Gerar com IA'}
                </button>
                <button onClick={() => setIsAddItemsOpen(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md">Cancelar</button>
              </div>
            ) : (
              <>
                <div className="max-h-48 overflow-y-auto space-y-2 bg-gray-800 rounded-md p-3 text-sm">
                  {addGenerated.map((c, i) => (
                    <div key={c.id} className="flex gap-2">
                      <span className="text-gray-500 w-6">{i + 1}.</span>
                      <div className="flex-1">
                        <div className="text-white">{c.texts[settings.nativeLanguage]}</div>
                        <div className="text-gray-400">{c.texts[settings.learningLanguage]}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={handleSaveItems} className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-md font-semibold">Adicionar à categoria</button>
                  <button onClick={() => { setAddGenerated([]); }} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md">Gerar novamente</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const TabButton: React.FC<{ title: string; isActive: boolean; onClick: () => void; }> = ({ title, isActive, onClick }) => (
  <button onClick={onClick} className={`px-4 py-2 -mb-px text-sm font-medium border-b-2 transition-colors ${isActive ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
    {title}
  </button>
);

export default FlashcardsView;
