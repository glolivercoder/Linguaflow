import React, { useCallback, useMemo, useState } from 'react';
import { Settings } from '../types';
import { SUPPORTED_LANGUAGES } from '../constants';
import { smartCategories, SmartCategory, SmartTopic, ExerciseItem } from '../data/smartLearnData';

interface SmartLearnViewProps {
  settings: Settings;
  onBack: () => void;
}

const SmartLearnView: React.FC<SmartLearnViewProps> = ({ settings, onBack }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, 'correct' | 'incorrect' | null>>({});
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  const learningLangName = useMemo(() => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === settings.learningLanguage)?.name || 'Inglês';
  }, [settings.learningLanguage]);

  const nativeLangName = useMemo(() => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === settings.nativeLanguage)?.name || 'Português';
  }, [settings.nativeLanguage]);

  const handleAnswerChange = useCallback((id: string, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
    setFeedback(prev => ({ ...prev, [id]: null }));
  }, []);

  const playFeedbackSound = useCallback((type: 'success' | 'error') => {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = type === 'success' ? 660 : 220;
    gain.gain.value = 0.25;

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.25);
    oscillator.onended = () => ctx.close();
  }, []);

  const checkAnswer = useCallback((exercise: ExerciseItem) => {
    const userInput = (answers[exercise.id] || '').trim().toLowerCase();
    const expected = exercise.answer.trim().toLowerCase();
    const isCorrect = userInput === expected;

    setFeedback(prev => ({ ...prev, [exercise.id]: isCorrect ? 'correct' : 'incorrect' }));
    playFeedbackSound(isCorrect ? 'success' : 'error');
  }, [answers, playFeedbackSound]);

  const resetAnswer = useCallback((exerciseId: string) => {
    setAnswers(prev => ({ ...prev, [exerciseId]: '' }));
    setFeedback(prev => ({ ...prev, [exerciseId]: null }));
  }, []);

  const categories = useMemo(() => smartCategories, []);
  const selectedCategory = useMemo(() => categories.find(category => category.id === selectedCategoryId) || null, [selectedCategoryId, categories]);
  const selectedTopic = useMemo(() => selectedCategory?.topics.find(topic => topic.id === selectedTopicId) || null, [selectedCategory, selectedTopicId]);

  const handleSelectCategory = useCallback((categoryId: string) => {
    setSelectedCategoryId(prev => {
      if (prev === categoryId) {
        setSelectedTopicId(null);
        return null;
      }

      setSelectedTopicId(null);
      return categoryId;
    });
  }, []);

  const handleSelectTopic = useCallback((topicId: string) => {
    setSelectedTopicId(topicId);
  }, []);

  return (
    <div className="p-4 md:p-6 h-full flex flex-col animate-fade-in">
      <header className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-cyan-400">Smart Learn</h2>
        <p className="text-sm md:text-base text-gray-300 mt-2 max-w-2xl">
          Estude estruturas básicas do inglês ({learningLangName}) com explicações em {nativeLangName}. Complete os espaços em
          branco para fixar o conteúdo. Sons e animações mostram acertos e erros instantaneamente.
        </p>
      </header>
      <div className="flex flex-1 flex-col md:flex-row gap-6 overflow-hidden">
        <aside className="w-full md:w-72 lg:w-80 bg-gray-800/80 border border-gray-700 rounded-xl p-4 h-full max-h-[32rem] md:max-h-none md:overflow-y-auto">
          <h3 className="text-lg font-semibold text-cyan-300 mb-3">Categorias de Gramática</h3>
          <nav className="space-y-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => handleSelectCategory(category.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                  selectedCategoryId === category.id
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                    : 'bg-gray-900/60 border border-gray-700 text-gray-200 hover:border-cyan-500'
                }`}
              >
                {category.title}
              </button>
            ))}
          </nav>
          {selectedCategory && (
            <nav className="space-y-2 mt-6">
              <h4 className="text-md font-semibold text-cyan-300 mb-2">Tópicos</h4>
              {selectedCategory.topics.map(topic => (
                <button
                  key={topic.id}
                  onClick={() => handleSelectTopic(topic.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                    selectedTopicId === topic.id
                      ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                      : 'bg-gray-900/60 border border-gray-700 text-gray-200 hover:border-cyan-500'
                  }`}
                >
                  {topic.title}
                </button>
              ))}
            </nav>
          )}
        </aside>

        <main className="flex-1 bg-gray-800/60 border border-gray-700 rounded-xl p-6 shadow-xl overflow-y-auto">
          {selectedTopic ? (
            <div className="space-y-6">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-semibold text-white">{selectedTopic.title}</h3>
                    <p className="text-sm text-gray-300 mt-2">{selectedTopic.description}</p>
                  </div>
                  <button
                    onClick={() => setSelectedTopicId(null)}
                    className="text-xs uppercase tracking-wide text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    Fechar tópico
                  </button>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="bg-gray-900/70 rounded-lg p-4 border border-gray-700">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Estrutura</p>
                    <p className="text-sm text-white mt-1">{selectedTopic.pattern}</p>
                  </div>
                  <div className="bg-gray-900/70 rounded-lg p-4 border border-gray-700">
                    <p className="text-xs uppercase tracking-wide text-cyan-400">Exemplo em inglês</p>
                    <p className="text-sm text-white mt-1">{selectedTopic.exampleEn}</p>
                    <p className="text-xs uppercase tracking-wide text-gray-400 mt-3">Tradução</p>
                    <p className="text-sm text-gray-200 mt-1">{selectedTopic.examplePt}</p>
                  </div>
                </div>
              </div>

              <section>
                <h4 className="text-lg font-semibold text-white mb-3">Exercícios de Fixação</h4>
                <div className="space-y-4">
                  {selectedTopic.exercises.map(item => {
                    const status = feedback[item.id];
                    const isCorrect = status === 'correct';
                    const isIncorrect = status === 'incorrect';

                    return (
                      <div
                        key={item.id}
                        className={`rounded-lg p-4 bg-gray-900/70 border transition-all duration-300 ${
                          isCorrect ? 'border-green-500 shadow-green-500/30 smart-animate-correct' :
                          isIncorrect ? 'border-red-500 shadow-red-500/30 smart-animate-incorrect' : 'border-gray-700'
                        }`}
                      >
                        <h5 className="text-md font-semibold text-cyan-300 mb-2">{item.title}</h5>
                        <p className="text-sm text-white">{item.sentenceEn}</p>
                        <p className="text-xs text-gray-400 mb-3">{item.sentencePt}</p>
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                          <input
                            type="text"
                            value={answers[item.id] || ''}
                            onChange={event => handleAnswerChange(item.id, event.target.value)}
                            placeholder="Digite a resposta em inglês"
                            className={`w-full md:w-2/3 px-4 py-2 rounded-lg bg-gray-800 border focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                              isCorrect ? 'border-green-500' : isIncorrect ? 'border-red-500' : 'border-gray-600'
                            }`}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => checkAnswer(item)}
                              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 transition-colors text-sm font-semibold"
                            >
                              Verificar
                            </button>
                            <button
                              onClick={() => resetAnswer(item.id)}
                              className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-sm"
                            >
                              Limpar
                            </button>
                          </div>
                        </div>
                        {item.hint && !isCorrect && !isIncorrect && (
                          <p className="text-xs text-gray-500 mt-2">Dica: {item.hint}</p>
                        )}
                        {isCorrect && (
                          <p className="text-sm text-green-400 mt-2 font-semibold">Excelente! Você acertou.</p>
                        )}
                        {isIncorrect && (
                          <p className="text-sm text-red-400 mt-2 font-semibold">Quase! Reveja a estrutura e tente novamente.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-300">
              <p className="text-lg font-semibold text-white">Selecione uma categoria e um tópico na barra lateral</p>
              <p className="text-sm mt-2 text-gray-400 max-w-md">
                Clique em uma categoria e em seguida em um tópico para ver a explicação completa, exemplos traduzidos e exercícios interativos com feedback imediato.
              </p>
            </div>
          )}
        </main>
      </div>

      <div className="mt-auto pt-6 flex justify-end">
        <button
          onClick={onBack}
          className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-colors"
        >
          Voltar
        </button>
      </div>
    </div>
  );
};

export default SmartLearnView;
