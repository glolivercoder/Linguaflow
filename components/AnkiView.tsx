import React, { useCallback, useMemo, useState } from 'react';
import { parseAnkiPackage } from '../services/ankiParser';
import { AnkiCard, Flashcard, Settings, ConversionConfig } from '../types';
import { FlashcardItem } from './FlashcardsView';
import { convertAnkiToLinguaFlow, ConversionResult } from '../services/ankiConverter';

interface AnkiViewProps {
  decks: Record<string, { name: string; cards: Flashcard[] }>;
  onImportComplete: (cards: AnkiCard[]) => void;
  onConvertComplete: (flashcards: Flashcard[]) => void;
  settings: Settings;
  onBack: () => void;
}

const AnkiView: React.FC<AnkiViewProps> = ({ decks, onImportComplete, onConvertComplete, settings, onBack }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<AnkiCard[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importCount, setImportCount] = useState(0);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);

  // Converter state
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [conversionStatus, setConversionStatus] = useState('');
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);

  const sortedDeckEntries = useMemo(() => {
    const entries = Object.entries(decks) as [string, { name: string; cards: Flashcard[] }][];
    return entries.sort((a, b) => {
      const nameA = a[1].name.toLowerCase();
      const nameB = b[1].name.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [decks]);

  const selectedDeck = selectedDeckId ? decks[selectedDeckId] : null;
  const deckCount = sortedDeckEntries.length;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
    console.log('[AnkiView] Starting file processing:', file.name);

    if (!file.name.endsWith('.apkg')) {
      const errorMsg = 'Por favor, selecione um arquivo .apkg válido do Anki.';
      console.error('[AnkiView] Invalid file type:', file.name);
      setError(errorMsg);
      return;
    }

    setError(null);
    setPreview([]);
    setImportCount(0);
    setFileName(file.name);
    setIsImporting(true);
    setProgress(0);

    try {
      console.log('[AnkiView] Calling parseAnkiPackage...');
      const cards = await parseAnkiPackage(file, (progress, status) => {
        console.log('[AnkiView] Progress:', progress, status);
        setProgress(progress);
        setStatusText(status);
      });

      console.log('[AnkiView] Parsing complete. Cards found:', cards.length);

      if (cards.length > 0) {
        console.log('[AnkiView] First 3 cards:', cards.slice(0, 3));
        setPreview(cards.slice(0, 5));
        onImportComplete(cards);
        setImportCount(cards.length);
        console.log('[AnkiView] Import completed successfully');
      } else {
        const errorMsg = "Nenhum card compatível foi encontrado no baralho. O importador funciona melhor com baralhos do tipo 'Básico'.";
        console.warn('[AnkiView]', errorMsg);
        setError(errorMsg);
      }

    } catch (err) {
      console.error('[AnkiView] Import error:', err);
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido ao importar o arquivo.');
    } finally {
      setIsImporting(false);
      console.log('[AnkiView] Import process finished');
    }
  }

  const handleConvertCards = async () => {
    setShowConvertModal(false);
    setIsConverting(true);
    setConversionProgress(0);
    setConversionResult(null);

    const config: ConversionConfig = {
      nativeLanguage: settings.nativeLanguage,
      learningLanguage: settings.learningLanguage,
      usePixabayForImages: false, // Keep Anki images
      enableOCR: false,
      generatePhonetics: true
    };

    try {
      // Get all cards from all decks
      const allCards: AnkiCard[] = [];
      for (const [deckId, deckInfo] of Object.entries(decks)) {
        // Convert Flashcard back to AnkiCard format
        deckInfo.cards.forEach(card => {
          if (card.ankiNoteId) {
            allCards.push({
              id: card.ankiNoteId,
              front: card.translatedText,
              back: card.originalText,
              image: card.imageUrl,
              audio: undefined,
              tags: [],
              deckId: card.ankiDeckId,
              deckName: card.ankiDeckName
            });
          }
        });
      }

      const result = await convertAnkiToLinguaFlow(
        allCards,
        config,
        (current, total, status) => {
          setConversionProgress(Math.round((current / total) * 100));
          setConversionStatus(status);
        }
      );

      setConversionResult(result);

      // Call onConvertComplete with the converted flashcards
      if (result.flashcards.length > 0) {
        onConvertComplete(result.flashcards);
      }
    } catch (error) {
      console.error('[AnkiView] Conversion error:', error);
      setError(error instanceof Error ? error.message : 'Erro ao converter cards');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-cyan-400">Baralhos do Anki</h2>
        <button
          onClick={() => setShowConvertModal(true)}
          disabled={deckCount === 0 || isConverting}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${deckCount === 0 || isConverting
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-cyan-600 text-white hover:bg-cyan-700'
            }`}
        >
          {isConverting ? '🔄 Convertendo...' : '🔄 Converter Cards'}
        </button>
      </div>
      <div className="max-w-5xl mx-auto w-full space-y-8">

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-white">Baralhos importados</h3>
              <p className="text-sm text-gray-400">
                {deckCount === 0
                  ? 'Nenhum baralho importado ainda. Importe um arquivo .apkg para começar.'
                  : `${deckCount} baralho${deckCount > 1 ? 's' : ''} disponível${deckCount > 1 ? 's' : ''}.`}
              </p>
            </div>
          </div>

          {deckCount === 0 ? (
            <p className="mt-4 text-sm text-gray-400">
              Após importar um arquivo, os baralhos aparecerão aqui com acesso rápido aos cards.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedDeckEntries.map(([deckId, deckInfo]) => (
                <button
                  key={deckId}
                  onClick={() => setSelectedDeckId(deckId)}
                  className={`text-left bg-gray-900 border ${selectedDeckId === deckId ? 'border-cyan-500' : 'border-gray-700 hover:border-cyan-400'} rounded-lg p-4 transition-colors`}
                >
                  <h4 className="text-lg font-semibold text-white truncate">{deckInfo.name}</h4>
                  <p className="text-sm text-gray-400 mt-1">{deckInfo.cards.length} cards</p>
                  <p className="text-xs text-gray-500 mt-3">Clique para visualizar os cards deste baralho.</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedDeck && (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">{selectedDeck.name}</h3>
                <p className="text-sm text-gray-400">{selectedDeck.cards.length} cards importados</p>
              </div>
              <button
                onClick={() => setSelectedDeckId(null)}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Fechar
              </button>
            </div>
            <div className="mt-4 grid gap-6 md:grid-cols-2">
              {selectedDeck.cards.map(card => {
                const displayCard: Flashcard = {
                  ...card,
                  originalText: card.translatedText,
                  originalLang: card.translatedLang,
                  translatedText: card.originalText,
                  translatedLang: card.originalLang,
                };

                return (
                  <div key={card.id} className="bg-gray-900/40 border border-gray-700 rounded-lg p-4 flex justify-center">
                    <div className="w-full max-w-xs">
                      <FlashcardItem
                        card={displayCard}
                        settings={settings}
                        isObjectCard={false}
                        onPickImage={() => { }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-8 h-8 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mb-2 text-sm text-gray-400">
                  <span className="font-semibold">Clique para selecionar</span> ou arraste o arquivo
                </p>
                <p className="text-xs text-gray-500">Arquivo .apkg do Anki</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".apkg"
                onChange={handleFileSelect}
                disabled={isImporting}
              />
            </label>
          </div>

          {isImporting && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>{statusText}...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-cyan-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-900/50 border border-red-500 rounded-lg p-3">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {importCount > 0 && (
            <div className="mt-4 bg-green-900/50 border border-green-500 rounded-lg p-3">
              <p className="text-green-300 text-sm font-semibold">{importCount} cards importados com sucesso de "{fileName}"!</p>
              <p className="text-gray-300 text-xs mt-1">Abra o baralho listado acima para revisar os novos cards.</p>
            </div>
          )}


          {preview.length > 0 && (
            <div className="mt-4 bg-gray-700 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold text-white">
                Prévia dos primeiros cards:
              </h4>
              {preview.map((card) => (
                <div key={card.id} className="bg-gray-800 rounded p-3">
                  <div className="flex items-start gap-3">
                    {card.image && (
                      <img
                        src={card.image}
                        alt="Card image"
                        className="w-16 h-16 object-cover rounded flex-shrink-0"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-sm text-gray-300"><strong className="text-white">Frente:</strong> {card.front}</p>
                      <p className="text-sm text-gray-300"><strong className="text-white">Verso:</strong> {card.back}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conversion Modal */}
        {showConvertModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-white mb-4">Converter Baralhos Anki</h3>
              <p className="text-gray-300 mb-6">
                Deseja converter todos os baralhos Anki importados para flashcards do LinguaFlow?
                <br /><br />
                Esta ação irá:
                <br />• Detectar idiomas automaticamente
                <br />• Gerar fonética para todos os cards
                <br />• Manter as imagens existentes
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConvertModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConvertCards}
                  className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
                >
                  Converter
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Conversion Progress */}
        {isConverting && (
          <div className="bg-gray-800 rounded-lg p-6 mt-4">
            <h4 className="text-lg font-semibold text-white mb-3">Convertendo cards...</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>{conversionStatus}</span>
                <span>{conversionProgress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-cyan-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${conversionProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Conversion Result */}
        {conversionResult && (
          <div className={`mt-4 rounded-lg p-4 ${conversionResult.failed > 0 ? 'bg-yellow-900/50 border border-yellow-500' : 'bg-green-900/50 border border-green-500'
            }`}>
            <h4 className={`font-semibold mb-2 ${conversionResult.failed > 0 ? 'text-yellow-300' : 'text-green-300'
              }`}>
              Conversão Concluída
            </h4>
            <p className="text-sm text-gray-300">
              ✅ {conversionResult.successful} cards convertidos com sucesso
              {conversionResult.failed > 0 && (
                <>
                  <br />❌ {conversionResult.failed} cards falharam
                </>
              )}
            </p>
            {conversionResult.errors.length > 0 && (
              <details className="mt-2">
                <summary className="text-sm text-gray-400 cursor-pointer">Ver erros</summary>
                <ul className="mt-2 text-xs text-gray-400 list-disc list-inside">
                  {conversionResult.errors.slice(0, 5).map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                  {conversionResult.errors.length > 5 && (
                    <li>... e mais {conversionResult.errors.length - 5} erros</li>
                  )}
                </ul>
              </details>
            )}
          </div>
        )}

      </div>
      <div className="mt-auto pt-6">
        <button
          onClick={onBack}
          className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-colors"
        >
          Voltar
        </button>
      </div>
    </div >
  );
};

export default AnkiView;