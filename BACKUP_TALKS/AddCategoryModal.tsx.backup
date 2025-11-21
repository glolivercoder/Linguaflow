import React, { useState } from 'react';
import { RawCard } from '../types';
import { generateCategory, validateCategoryName, validateCard } from '../services/categoryGeneratorService';

interface AddCategoryModalProps {
    type: 'phrases' | 'objects';
    onClose: () => void;
    onSave: (categoryName: string, cards: RawCard[]) => Promise<void>;
}

type ModalMode = 'select' | 'manual' | 'ai';

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
    type,
    onClose,
    onSave
}) => {
    const [mode, setMode] = useState<ModalMode>('select');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {mode === 'select' && (
                    <ModeSelection
                        type={type}
                        onSelectManual={() => setMode('manual')}
                        onSelectAI={() => setMode('ai')}
                        onClose={onClose}
                    />
                )}
                {mode === 'manual' && (
                    <ManualCreation
                        type={type}
                        onSave={onSave}
                        onBack={() => setMode('select')}
                        onClose={onClose}
                    />
                )}
                {mode === 'ai' && (
                    <AIGeneration
                        type={type}
                        onSave={onSave}
                        onBack={() => setMode('select')}
                        onClose={onClose}
                    />
                )}
            </div>
        </div>
    );
};

// ============================================================================
// Mode Selection Component
// ============================================================================

interface ModeSelectionProps {
    type: 'phrases' | 'objects';
    onSelectManual: () => void;
    onSelectAI: () => void;
    onClose: () => void;
}

const ModeSelection: React.FC<ModeSelectionProps> = ({
    type,
    onSelectManual,
    onSelectAI,
    onClose
}) => {
    const typeLabel = type === 'phrases' ? 'Frases' : 'Objetos';

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-cyan-400">Adicionar Categoria de {typeLabel}</h2>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <p className="text-gray-300 mb-6">Escolha como deseja criar sua nova categoria:</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Manual Option */}
                <button
                    onClick={onSelectManual}
                    className="group p-6 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all border-2 border-transparent hover:border-cyan-500"
                >
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-cyan-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Criação Manual</h3>
                        <p className="text-sm text-gray-400">
                            Adicione itens manualmente, um por um, com total controle sobre o conteúdo.
                        </p>
                    </div>
                </button>

                {/* AI Option */}
                <button
                    onClick={onSelectAI}
                    className="group p-6 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all border-2 border-transparent hover:border-purple-500"
                >
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Geração via IA</h3>
                        <p className="text-sm text-gray-400">
                            Escolha um tema e deixe a IA gerar sugestões automaticamente.
                        </p>
                    </div>
                </button>
            </div>
        </div>
    );
};

// ============================================================================
// Manual Creation Component
// ============================================================================

interface ManualCreationProps {
    type: 'phrases' | 'objects';
    onSave: (categoryName: string, cards: RawCard[]) => Promise<void>;
    onBack: () => void;
    onClose: () => void;
}

const ManualCreation: React.FC<ManualCreationProps> = ({
    type,
    onSave,
    onBack,
    onClose
}) => {
    const [categoryName, setCategoryName] = useState('');
    const [cards, setCards] = useState<Partial<RawCard>[]>([createEmptyCard()]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function createEmptyCard(): Partial<RawCard> {
        return {
            id: `temp-${Date.now()}-${Math.random()}`,
            texts: { 'pt-BR': '', 'en-US': '' },
            phoneticTexts: { 'en-US': '' },
            imageUrl: type === 'objects' ? '' : undefined
        };
    }

    const addCard = () => {
        setCards([...cards, createEmptyCard()]);
    };

    const removeCard = (index: number) => {
        if (cards.length > 1) {
            setCards(cards.filter((_, i) => i !== index));
        }
    };

    const updateCard = (index: number, field: string, value: string) => {
        const newCards = [...cards];
        const card = newCards[index];

        if (field === 'pt') {
            card.texts = { ...card.texts, 'pt-BR': value };
        } else if (field === 'en') {
            card.texts = { ...card.texts, 'en-US': value };
        } else if (field === 'phonetic') {
            card.phoneticTexts = { ...card.phoneticTexts, 'en-US': value };
        } else if (field === 'imageUrl') {
            card.imageUrl = value;
        }

        setCards(newCards);
    };

    const handleSave = async () => {
        setError(null);

        // Validate category name
        const nameValidation = validateCategoryName(categoryName);
        if (!nameValidation.valid) {
            setError(nameValidation.error!);
            return;
        }

        // Validate cards
        const validCards: RawCard[] = [];
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            const cardValidation = validateCard(card);

            if (!cardValidation.valid) {
                setError(`Item ${i + 1}: ${cardValidation.error}`);
                return;
            }

            validCards.push({
                id: `custom-${Date.now()}-${i}`,
                texts: card.texts!,
                phoneticTexts: card.phoneticTexts,
                imageUrl: card.imageUrl
            });
        }

        if (validCards.length === 0) {
            setError('Adicione pelo menos um item');
            return;
        }

        setSaving(true);
        try {
            await onSave(categoryName.trim(), validCards);
            onClose();
        } catch (err) {
            setError('Erro ao salvar categoria. Tente novamente.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h2 className="text-2xl font-bold text-cyan-400">Criação Manual</h2>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Category Name */}
            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Nome da Categoria
                </label>
                <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="Ex: Compras no Supermercado"
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-cyan-500 focus:outline-none"
                />
            </div>

            {/* Cards List */}
            <div className="mb-6 space-y-4 max-h-96 overflow-y-auto">
                {cards.map((card, index) => (
                    <div key={card.id} className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-gray-300">Item {index + 1}</h4>
                            {cards.length > 1 && (
                                <button
                                    onClick={() => removeCard(index)}
                                    className="text-red-400 hover:text-red-300 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Português</label>
                                <input
                                    type="text"
                                    value={card.texts?.['pt-BR'] || ''}
                                    onChange={(e) => updateCard(index, 'pt', e.target.value)}
                                    placeholder="Texto em português"
                                    className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-600 focus:border-cyan-500 focus:outline-none text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Inglês</label>
                                <input
                                    type="text"
                                    value={card.texts?.['en-US'] || ''}
                                    onChange={(e) => updateCard(index, 'en', e.target.value)}
                                    placeholder="English text"
                                    className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-600 focus:border-cyan-500 focus:outline-none text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Fonética (opcional)</label>
                                <input
                                    type="text"
                                    value={card.phoneticTexts?.['en-US'] || ''}
                                    onChange={(e) => updateCard(index, 'phonetic', e.target.value)}
                                    placeholder="/fəˈnɛ.tɪk/"
                                    className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-600 focus:border-cyan-500 focus:outline-none text-sm"
                                />
                            </div>

                            {type === 'objects' && (
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">URL da Imagem (opcional)</label>
                                    <input
                                        type="text"
                                        value={card.imageUrl || ''}
                                        onChange={(e) => updateCard(index, 'imageUrl', e.target.value)}
                                        placeholder="https://... ou deixe vazio para auto"
                                        className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-600 focus:border-cyan-500 focus:outline-none text-sm"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Card Button */}
            <button
                onClick={addCard}
                className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-cyan-400 rounded-md transition-colors mb-6 flex items-center justify-center gap-2"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Adicionar Item
            </button>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-500 rounded-md text-red-300 text-sm">
                    {error}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={onBack}
                    className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                >
                    Voltar
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white rounded-md transition-colors font-semibold"
                >
                    {saving ? 'Salvando...' : 'Salvar Categoria'}
                </button>
            </div>
        </div>
    );
};

// ============================================================================
// AI Generation Component
// ============================================================================

interface AIGenerationProps {
    type: 'phrases' | 'objects';
    onSave: (categoryName: string, cards: RawCard[]) => Promise<void>;
    onBack: () => void;
    onClose: () => void;
}

const AIGeneration: React.FC<AIGenerationProps> = ({
    type,
    onSave,
    onBack,
    onClose
}) => {
    const [theme, setTheme] = useState('');
    const [itemCount, setItemCount] = useState(10);
    const [generating, setGenerating] = useState(false);
    const [generatedCards, setGeneratedCards] = useState<RawCard[] | null>(null);
    const [categoryName, setCategoryName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const handleGenerate = async () => {
        if (!theme.trim()) {
            setError('Digite um tema para gerar a categoria');
            return;
        }

        setError(null);
        setGenerating(true);
        setGeneratedCards(null);

        try {
            const cards = await generateCategory({
                theme: theme.trim(),
                type,
                itemCount,
                nativeLanguage: 'pt-BR',
                targetLanguage: 'en-US'
            });

            setGeneratedCards(cards);
            setCategoryName(theme.trim());
        } catch (err: any) {
            setError(err.message || 'Erro ao gerar categoria. Tente novamente.');
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!generatedCards || generatedCards.length === 0) {
            setError('Nenhum item gerado para salvar');
            return;
        }

        const nameValidation = validateCategoryName(categoryName);
        if (!nameValidation.valid) {
            setError(nameValidation.error!);
            return;
        }

        setSaving(true);
        setError(null);

        try {
            await onSave(categoryName.trim(), generatedCards);
            onClose();
        } catch (err) {
            setError('Erro ao salvar categoria. Tente novamente.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h2 className="text-2xl font-bold text-purple-400">Geração via IA</h2>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {!generatedCards ? (
                // Generation Form
                <>
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Tema da Categoria
                        </label>
                        <input
                            type="text"
                            value={theme}
                            onChange={(e) => setTheme(e.target.value)}
                            placeholder={type === 'phrases' ? 'Ex: Compras no Supermercado' : 'Ex: Frutas Tropicais'}
                            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-purple-500 focus:outline-none"
                            disabled={generating}
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Quantidade de Itens: {itemCount}
                        </label>
                        <input
                            type="range"
                            min="5"
                            max="20"
                            value={itemCount}
                            onChange={(e) => setItemCount(parseInt(e.target.value))}
                            className="w-full"
                            disabled={generating}
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>5</span>
                            <span>20</span>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-900/30 border border-red-500 rounded-md text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-md transition-colors font-semibold flex items-center justify-center gap-2"
                    >
                        {generating ? (
                            <>
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Gerando...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Gerar com IA
                            </>
                        )}
                    </button>
                </>
            ) : (
                // Preview Generated Cards
                <>
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Nome da Categoria
                        </label>
                        <input
                            type="text"
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-purple-500 focus:outline-none"
                        />
                    </div>

                    <div className="mb-4">
                        <h3 className="text-sm font-semibold text-gray-300 mb-2">
                            Itens Gerados ({generatedCards.length})
                        </h3>
                        <div className="max-h-80 overflow-y-auto space-y-2">
                            {generatedCards.map((card, index) => (
                                <div key={card.id} className="p-3 bg-gray-700 rounded border border-gray-600">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="text-gray-400">PT:</span> <span className="text-white">{card.texts['pt-BR']}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">EN:</span> <span className="text-white">{card.texts['en-US']}</span>
                                        </div>
                                        {card.phoneticTexts?.['en-US'] && (
                                            <div className="col-span-2">
                                                <span className="text-gray-400">IPA:</span> <span className="text-cyan-300">{card.phoneticTexts['en-US']}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-900/30 border border-red-500 rounded-md text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={() => setGeneratedCards(null)}
                            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                        >
                            Gerar Novamente
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-md transition-colors font-semibold"
                        >
                            {saving ? 'Salvando...' : 'Salvar Categoria'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default AddCategoryModal;
