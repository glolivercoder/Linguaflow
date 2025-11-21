import React, { useState } from 'react';
import { CustomCategory, RawCard } from '../types';
import { generateCategory, validateCategoryName } from '../services/categoryGeneratorService';
import * as db from '../services/db';

interface CustomCategoryManagerProps {
    type: 'phrases' | 'objects';
    onCategoryCreated: (category: CustomCategory) => void;
    onClose: () => void;
}

type Screen = 'mode-selection' | 'manual' | 'ai-generate';

export const CustomCategoryManager: React.FC<CustomCategoryManagerProps> = ({
    type,
    onCategoryCreated,
    onClose
}) => {
    const [screen, setScreen] = useState<Screen>('mode-selection');
    const [categoryName, setCategoryName] = useState('');
    const [theme, setTheme] = useState('');
    const [itemCount, setItemCount] = useState(10);
    const [generatedCards, setGeneratedCards] = useState<RawCard[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');

    const handleGenerateAI = async () => {
        // Validate
        const nameValidation = validateCategoryName(categoryName);
        if (!nameValidation.valid) {
            setError(nameValidation.error || 'Nome inválido');
            return;
        }

        if (!theme.trim()) {
            setError('Por favor, escolha um tema');
            return;
        }

        setError('');
        setIsGenerating(true);

        try {
            const cards = await generateCategory({
                theme,
                type,
                itemCount,
                nativeLanguage: 'pt-BR',
                targetLanguage: 'en-US'
            });

            setGeneratedCards(cards);
            console.log('[CustomCategoryManager] Generated cards:', cards);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao gerar categoria');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveCategory = async () => {
        if (generatedCards.length === 0) {
            setError('Nenhum card foi gerado');
            return;
        }

        const category: CustomCategory = {
            id: `custom-cat-${Date.now()}`,
            type,
            name: categoryName.trim(),
            cards: generatedCards,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        try {
            await db.saveCustomCategory(category);
            onCategoryCreated(category);
            onClose();
        } catch (err) {
            setError('Erro ao salvar categoria');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-cyan-400">
                            Nova Categoria - {type === 'phrases' ? 'Frases' : 'Objetos'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                            aria-label="Fechar"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Mode Selection */}
                    {screen === 'mode-selection' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-200 mb-4">Como deseja criar a categoria?</h3>

                            <button
                                onClick={() => setScreen('ai-generate')}
                                className="w-full p-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg transition-all transform hover:scale-105"
                            >
                                <div className="flex items-center gap-4">
                                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    <div className="text-left">
                                        <div className="text-xl font-bold text-white">Gerar com IA</div>
                                        <div className="text-sm text-cyan-100">Gemini cria automaticamente baseado em um tema</div>
                                    </div>
                                </div>
                            </button>

                            <div className="text-center text-gray-500 text-sm py-2">
                                Criação manual será implementada em breve
                            </div>
                        </div>
                    )}

                    {/* AI Generation Screen */}
                    {screen === 'ai-generate' && (
                        <div className="space-y-6">
                            {generatedCards.length === 0 ? (
                                <>
                                    {/* Configuration Form */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Nome da Categoria
                                            </label>
                                            <input
                                                type="text"
                                                value={categoryName}
                                                onChange={(e) => setCategoryName(e.target.value)}
                                                placeholder="Ex: Frutas, Restaurante, Viagem..."
                                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Tema
                                            </label>
                                            <input
                                                type="text"
                                                value={theme}
                                                onChange={(e) => setTheme(e.target.value)}
                                                placeholder="Ex: Compras no supermercado, No aeroporto..."
                                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Quantidade de Itens: {itemCount}
                                            </label>
                                            <input
                                                type="range"
                                                min="5"
                                                max="20"
                                                value={itemCount}
                                                onChange={(e) => setItemCount(parseInt(e.target.value))}
                                                className="w-full"
                                            />
                                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                                                <span>5</span>
                                                <span>20</span>
                                            </div>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
                                            {error}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setScreen('mode-selection')}
                                            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                        >
                                            Voltar
                                        </button>
                                        <button
                                            onClick={handleGenerateAI}
                                            disabled={isGenerating}
                                            className="flex-1 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors font-semibold"
                                        >
                                            {isGenerating ? 'Gerando...' : 'Gerar Categoria'}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Preview Generated Cards */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-green-400 mb-4">
                                            ✓ {generatedCards.length} itens gerados com sucesso!
                                        </h3>
                                        <div className="bg-gray-900 rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                                            {generatedCards.map((card, idx) => (
                                                <div key={card.id} className="flex gap-3 text-sm">
                                                    <span className="text-gray-500 w-6">{idx + 1}.</span>
                                                    <div className="flex-1">
                                                        <div className="text-white">{card.texts['pt-BR']}</div>
                                                        <div className="text-gray-400">{card.texts['en-US']}</div>
                                                        {card.phoneticTexts?.['en-US'] && (
                                                            <div className="text-cyan-400 text-xs">{card.phoneticTexts['en-US']}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
                                            {error}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                setGeneratedCards([]);
                                                setError('');
                                            }}
                                            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                        >
                                            Gerar Novamente
                                        </button>
                                        <button
                                            onClick={handleSaveCategory}
                                            className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-500 rounded-lg transition-colors font-semibold"
                                        >
                                            Salvar Categoria
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
