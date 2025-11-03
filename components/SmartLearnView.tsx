import React, { useCallback, useMemo, useState } from 'react';
import { Settings } from '../types';
import { SUPPORTED_LANGUAGES } from '../constants';

interface GrammarPoint {
  id: string;
  title: string;
  description: string;
  pattern: string;
  exampleEn: string;
  examplePt: string;
}

interface ExerciseItem {
  id: string;
  title: string;
  sentenceEn: string;
  sentencePt: string;
  answer: string;
  hint?: string;
}

interface SmartLearnViewProps {
  settings: Settings;
  onBack: () => void;
}

const grammarPoints: GrammarPoint[] = [
  {
    id: 'plural',
    title: 'Plurals',
    description: 'Most English nouns become plural by adding “-s”. Words ending in s, sh, ch, x, or z usually add “-es”.',
    pattern: 'singular + s → plural',
    exampleEn: 'One book → Two books / One class → Two classes',
    examplePt: 'Um livro → Dois livros / Uma aula → Duas aulas'
  },
  {
    id: 'present-simple',
    title: 'Present Simple',
    description: 'Used for routines and facts. Add “-s” or “-es” to the verb with he/she/it.',
    pattern: 'Subject + base verb (add -s/-es for he/she/it)',
    exampleEn: 'She works every day.',
    examplePt: 'Ela trabalha todos os dias.'
  },
  {
    id: 'past-simple',
    title: 'Past Simple',
    description: 'Used for finished actions in the past. Regular verbs often end in “-ed”.',
    pattern: 'Subject + verb-ed (regular verbs)',
    exampleEn: 'They visited their grandparents.',
    examplePt: 'Eles visitaram os avós.'
  },
  {
    id: 'future-will',
    title: 'Future with Will',
    description: 'Use “will” + base verb to express future decisions or predictions.',
    pattern: 'Subject + will + base verb',
    exampleEn: 'We will travel tomorrow.',
    examplePt: 'Nós viajaremos amanhã.'
  },
  {
    id: 'negative-do',
    title: 'Negative with Do/Does',
    description: 'Use “do not (don’t)” or “does not (doesn’t)” + base verb for negation in the present simple.',
    pattern: 'Subject + do/does + not + base verb',
    exampleEn: "He doesn't like coffee.",
    examplePt: 'Ele não gosta de café.'
  },
  {
    id: 'negative-did',
    title: 'Negative with Did',
    description: 'Use “did not (didn’t)” + base verb to negate actions in the past simple.',
    pattern: 'Subject + did not + base verb',
    exampleEn: "They didn't finish the homework.",
    examplePt: 'Eles não terminaram a lição de casa.'
  },
  {
    id: 'negative-will',
    title: 'Negative with Will',
    description: 'Use “will not (won’t)” + base verb to negate future actions.',
    pattern: 'Subject + will not + base verb',
    exampleEn: "She won't forget your birthday.",
    examplePt: 'Ela não vai esquecer o seu aniversário.'
  }
];

const exerciseItems: ExerciseItem[] = [
  {
    id: 'ex1',
    title: 'Plural Practice',
    sentenceEn: 'There are two _______ (book) on the table.',
    sentencePt: 'Há dois _______ na mesa.',
    answer: 'books',
    hint: 'Lembre-se de adicionar “-s”.'
  },
  {
    id: 'ex2',
    title: 'Present Simple',
    sentenceEn: 'She _______ (study) English every night.',
    sentencePt: 'Ela _______ inglês todas as noites.',
    answer: 'studies',
    hint: 'He/she/it precisa de “-es” quando termina em consoante + y.'
  },
  {
    id: 'ex3',
    title: 'Past Simple',
    sentenceEn: 'They _______ (watch) a movie yesterday.',
    sentencePt: 'Eles _______ um filme ontem.',
    answer: 'watched'
  },
  {
    id: 'ex4',
    title: 'Future Will',
    sentenceEn: 'I _______ (call) you later.',
    sentencePt: 'Eu _______ você mais tarde.',
    answer: 'will call'
  },
  {
    id: 'ex5',
    title: 'Negative Do/Does',
    sentenceEn: 'He _______ (not / eat) vegetables.',
    sentencePt: 'Ele _______ vegetais.',
    answer: "doesn't eat"
  },
  {
    id: 'ex6',
    title: 'Negative Did',
    sentenceEn: 'We _______ (not / go) to the party.',
    sentencePt: 'Nós _______ à festa.',
    answer: "didn't go"
  },
  {
    id: 'ex7',
    title: 'Negative Will',
    sentenceEn: 'They _______ (not / travel) this weekend.',
    sentencePt: 'Eles _______ neste final de semana.',
    answer: "won't travel"
  }
];

const SmartLearnView: React.FC<SmartLearnViewProps> = ({ settings, onBack }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, 'correct' | 'incorrect' | null>>({});

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

  const definitions = useMemo(() => grammarPoints, []);
  const exercises = useMemo(() => exerciseItems, []);

  return (
    <div className="p-4 md:p-6 h-full flex flex-col animate-fade-in">
      <header className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-cyan-400">Smart Learn</h2>
        <p className="text-sm md:text-base text-gray-300 mt-2 max-w-2xl">
          Estude estruturas básicas do inglês ({learningLangName}) com explicações em {nativeLangName}. Complete os espaços em
          branco para fixar o conteúdo. Sons e animações mostram acertos e erros instantaneamente.
        </p>
      </header>

      <section className="grid gap-4 md:gap-6 md:grid-cols-2 xl:grid-cols-3 mb-8">
        {definitions.map(point => (
          <article key={point.id} className="bg-gray-800 rounded-xl border border-gray-700 p-4 shadow-lg hover:border-cyan-500 transition-colors">
            <h3 className="text-lg font-semibold text-white mb-2">{point.title}</h3>
            <p className="text-sm text-gray-300 mb-3">{point.description}</p>
            <div className="bg-gray-900/60 rounded-lg p-3 mb-2">
              <p className="text-xs uppercase tracking-wide text-gray-400">Estrutura</p>
              <p className="text-sm text-white">{point.pattern}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-cyan-400">Exemplo em inglês</p>
              <p className="text-sm text-white">{point.exampleEn}</p>
              <p className="text-xs uppercase tracking-wide text-gray-400 mt-3">Tradução</p>
              <p className="text-sm text-gray-200">{point.examplePt}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="bg-gray-800/60 border border-gray-700 rounded-xl p-5 shadow-xl">
        <h3 className="text-xl font-semibold text-white mb-4">Exercícios de Fixação</h3>
        <div className="space-y-4">
          {exercises.map(item => {
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
                <h4 className="text-lg font-semibold text-cyan-300 mb-2">{item.title}</h4>
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
