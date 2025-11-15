import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Flashcard, Settings, LanguageCode } from '../types';
import { getIPA } from '../services/geminiService';
import { searchImages } from '../services/pixabayService';
import { SUPPORTED_LANGUAGES } from '../constants';
import { SpeakerIcon, ImageIcon } from './icons';
import { playAudio as playLocalAudio } from '../services/ttsService';
import * as db from '../services/db';

type CategorizedFlashcards = Record<'phrases' | 'objects', Record<string, Flashcard[]>>;

interface FlashcardsViewProps {
  categorizedFlashcards: CategorizedFlashcards;
  settings: Settings;
  onBack: () => void;
  onImageChange: (cardId: string, newImageUrl: string) => void;
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
      setIsLoading(true);
      const fetchedImages = await searchImages(card.translatedText);
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
                onClick={() => onSelect(imgUrl)}
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
}> = ({ card, settings, isObjectCard, onPickImage }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [phoneticText, setPhoneticText] = useState<string | null>(card.phoneticText || null);
  const [isLoadingPhonetics, setIsLoadingPhonetics] = useState(false);

  useEffect(() => {
    // Reset state when card changes
    setIsFlipped(false);
    setPhoneticText(card.phoneticText || null);
    console.log('[FlashcardItem] Card updated:', { 
      cardId: card.id, 
      imageUrl: card.imageUrl,
      originalText: card.originalText 
    });
  }, [card]);


  const playAudio = useCallback(async (text: string, lang: LanguageCode) => {
    setIsPlaying(true);
    await playLocalAudio(text, lang, settings.voiceGender);
    setIsPlaying(false);
  }, [settings.voiceGender]);

  const fetchPhonetics = useCallback(async () => {
    if (phoneticText) return; // Already have it (from cache or previous fetch)
    setIsLoadingPhonetics(true);
    const learningLangName = SUPPORTED_LANGUAGES.find(l => l.code === settings.learningLanguage)?.name || '';
    if (learningLangName) {
      const fetchedIpa = await getIPA(card.translatedText, learningLangName);
      setPhoneticText(fetchedIpa);
      // Cache the result in the database
      db.cachePhonetic(card.id, fetchedIpa);
    } else {
      setPhoneticText("Idioma não configurado.");
    }
    setIsLoadingPhonetics(false);
  }, [card.id, card.translatedText, settings.learningLanguage, phoneticText]);

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
      fetchPhonetics();
    }
  };

  // In this app, originalText is always native lang, translatedText is learning lang
  const frontText = card.originalText;
  const frontLang = card.originalLang;
  const backText = card.translatedText;
  const backLang = card.translatedLang;

  const backPhoneticText = isLoadingPhonetics ? 'Buscando AFI...' : phoneticText;

  const renderImage = () => {
    if (!card.imageUrl) {
      console.log('[FlashcardItem] No imageUrl for card:', { cardId: card.id, frontText });
      return null;
    }
    
    console.log('[FlashcardItem] Rendering image:', { 
      cardId: card.id, 
      imageUrl: card.imageUrl,
      frontText 
    });
    
    return (
      <img
        src={card.imageUrl}
        alt={frontText}
        className="w-full h-48 object-cover rounded-t-xl flex-shrink-0"
        onLoad={() => console.log('[FlashcardItem] Image loaded successfully:', card.id)}
        onError={(e) => console.error('[FlashcardItem] Image failed to load:', { 
          cardId: card.id, 
          imageUrl: card.imageUrl,
          error: e 
        })}
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
                onClick={(e) => { e.stopPropagation(); onPickImage(card); }}
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
            {(backPhoneticText && backPhoneticText !== "AFI indisponível") && <p className="text-md mt-4 text-gray-300 font-mono italic">{backPhoneticText}</p>}
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

const FlashcardsView: React.FC<FlashcardsViewProps> = ({ categorizedFlashcards, settings, onBack, onImageChange }) => {
  const [activeTab, setActiveTab] = useState<'phrases' | 'objects'>('phrases');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pickingImageForCard, setPickingImageForCard] = useState<Flashcard | null>(null);
  const autoLoadedCardsRef = useRef<Set<string>>(new Set());

  const categories = Object.keys(categorizedFlashcards[activeTab] || {});
  const cards = (selectedCategory && categorizedFlashcards[activeTab]?.[selectedCategory]) || [];

  useEffect(() => {
    const currentCategories = Object.keys(categorizedFlashcards[activeTab] || {});
    if (currentCategories.length > 0 && !currentCategories.includes(selectedCategory || '')) {
      setSelectedCategory(currentCategories[0]);
    } else if (currentCategories.length === 0) {
      setSelectedCategory(null);
    }
    setCurrentIndex(0);
  }, [activeTab, categorizedFlashcards, selectedCategory]);

  useEffect(() => {
    if (activeTab !== 'objects' || cards.length === 0) {
      return;
    }

    const loadImagesForCards = async () => {
      console.log('[FlashcardsView] Starting auto-load for', cards.length, 'cards');
      
      for (const card of cards) {
        // Skip if already processed by auto-load (not manually changed)
        if (autoLoadedCardsRef.current.has(card.id)) {
          console.log('[FlashcardsView] Skipping already loaded card:', card.id);
          continue;
        }

        // Mark this card as processed, but don't block retries on errors
        autoLoadedCardsRef.current.add(card.id);
        
        // Try to load a new image if:
        // 1. No image exists, OR
        // 2. The image is from Pixabay (might be a placeholder), OR
        // 3. The image is from any HTTP source (might be broken)
        const needsPixabayImage = !card.imageUrl || 
                                (card.imageUrl && 
                                 (card.imageUrl.includes('pixabay.com') || 
                                  card.imageUrl.startsWith('http')));
        
        console.log('[FlashcardsView] Card image check:', { 
          cardId: card.id, 
          hasImage: !!card.imageUrl, 
          needsPixabayImage,
          currentUrl: card.imageUrl 
        });
        
        if (needsPixabayImage && card.translatedText?.trim()) {
          try {
            console.log('[FlashcardsView] Fetching images for:', card.translatedText);
            const images = await searchImages(card.translatedText);
            console.log('[FlashcardsView] Received images:', images.length);
            
            if (images && images.length > 0) {
              const imageUrl = images[0];
              console.log('[FlashcardsView] Applying image to card:', { 
                cardId: card.id,
                imageUrl: imageUrl.substring(0, 50) + '...' 
              });
              
              // Preload the image before setting it
              await new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = resolve;
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = imageUrl;
              });
              
              await onImageChange(card.id, imageUrl);
            } else {
              console.warn('[FlashcardsView] No images found for:', card.translatedText);
            }
          } catch (error) {
            console.error('[FlashcardsView] Failed to auto-assign image for card', { 
              cardId: card.id, 
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined
            });
          }
        }
      }
      console.log('[FlashcardsView] Auto-load completed');
    };

    // Add a small delay to ensure the component is fully mounted
    const timer = setTimeout(() => {
      loadImagesForCards().catch(error => {
        console.error('[FlashcardsView] Error in loadImagesForCards:', error);
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [activeTab, cards, onImageChange]);
  
  const handleImageSelect = (imageUrl: string) => {
    if (pickingImageForCard) {
      onImageChange(pickingImageForCard.id, imageUrl);
      setPickingImageForCard(null);
    }
  };

  const nextCard = () => cards.length > 0 && setCurrentIndex((prev) => (prev + 1) % cards.length);
  const prevCard = () => cards.length > 0 && setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);

  return (
    <div className="p-4 md:p-6 h-full flex flex-col animate-fade-in">
       {pickingImageForCard && (
        <ImagePickerModal
          card={pickingImageForCard}
          onSelect={handleImageSelect}
          onClose={() => setPickingImageForCard(null)}
        />
      )}
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
          <h3 className="text-lg font-semibold text-gray-400 mb-3">Categorias</h3>
          <ul className="space-y-2">
            {categories.length > 0 ? categories.map(cat => (
              <li key={cat}>
                <button
                  onClick={() => { setSelectedCategory(cat); setCurrentIndex(0); }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedCategory === cat ? 'bg-cyan-600 text-white font-bold' : 'hover:bg-gray-700'}`}
                >
                  {cat}
                </button>
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
                  // FIX: Add a dynamic key to ensure the component re-mounts when the image URL changes.
                  // This forces the new image to be displayed immediately after selection.
                  key={cards[currentIndex].id + (cards[currentIndex].imageUrl || '')}
                  card={cards[currentIndex]}
                  settings={settings}
                  isObjectCard={activeTab === 'objects'}
                  onPickImage={setPickingImageForCard}
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
    </div>
  );
};

const TabButton: React.FC<{ title: string; isActive: boolean; onClick: () => void; }> = ({ title, isActive, onClick }) => (
  <button onClick={onClick} className={`px-4 py-2 -mb-px text-sm font-medium border-b-2 transition-colors ${isActive ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
    {title}
  </button>
);

export default FlashcardsView;