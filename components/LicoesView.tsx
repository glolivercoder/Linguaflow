import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Settings } from '../types';
import {
  LessonLevel,
  LessonTheme,
  Lesson,
  Expression,
  ExpressionType,
  DictionaryEntry,
  WritingExercise,
} from '../types/licoes';
import { LESSONS, BASE_DICTIONARY_ENTRIES } from '../data/lessonsData';
import {
  Search,
  BookOpen,
  Mic,
  PenTool,
  ArrowLeft,
  GraduationCap,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Info,
} from 'lucide-react';

interface LicoesViewProps {
  settings: Settings;
  onBack: () => void;
}

type TabType = 'stories' | 'interpretation' | 'writing' | 'pronunciation';

type DictionaryEntryWithMeta = DictionaryEntry & {
  term: string;
  type?: ExpressionType;
};

type QuizStatus = 'correct' | 'incorrect' | null;

interface QuizProgressState {
  answers: (number | null)[];
  correctness: QuizStatus[];
  score: number;
  completed: boolean;
}

type WritingStatus = 'pending' | 'correct' | 'needs-review';

interface WritingProgressState {
  responses: string[];
  statuses: WritingStatus[];
  feedback: string[];
  wordCounts: number[];
  completed: boolean;
}

interface WritingEvaluation {
  status: WritingStatus;
  feedback: string;
}

const createInitialQuizProgress = (questionCount: number): QuizProgressState => ({
  answers: Array(questionCount).fill(null),
  correctness: Array(questionCount).fill(null),
  score: 0,
  completed: questionCount === 0,
});

const createInitialWritingProgress = (exerciseCount: number): WritingProgressState => ({
  responses: Array(exerciseCount).fill(''),
  statuses: Array(exerciseCount).fill('pending'),
  feedback: Array(exerciseCount).fill(''),
  wordCounts: Array(exerciseCount).fill(0),
  completed: exerciseCount === 0,
});

const levelLabels: Record<LessonLevel, string> = {
  [LessonLevel.BASICO]: 'Básico',
  [LessonLevel.INTERMEDIARIO]: 'Intermediário',
  [LessonLevel.AVANCADO]: 'Avançado',
};

const themeLabels: Record<LessonTheme, string> = {
  [LessonTheme.APRESENTACAO]: 'Apresentações',
  [LessonTheme.AMIZADE]: 'Amizades',
  [LessonTheme.HOBBIES]: 'Hobbies',
  [LessonTheme.PAQUERA]: 'Paquera',
  [LessonTheme.DESCONTRAIDO]: 'Descontraído',
  [LessonTheme.FOFOCA]: 'Fofoca',
};

const expressionTypeLabels: Record<ExpressionType, string> = {
  [ExpressionType.IDIOM]: 'Expressão idiomática',
  [ExpressionType.SLANG]: 'Gíria',
  [ExpressionType.PROVERB]: 'Provérbio',
};

const expressionTypeColors: Record<ExpressionType, string> = {
  [ExpressionType.IDIOM]: 'bg-amber-500/20 text-amber-200 border border-amber-400/40',
  [ExpressionType.SLANG]: 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40',
  [ExpressionType.PROVERB]: 'bg-purple-500/20 text-purple-200 border border-purple-400/40',
};

const normalizeTerm = (term: string): string => term.trim().toLowerCase();

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeText = (value: string): string => value.trim().replace(/\s+/g, ' ').toLowerCase();

const countWords = (value: string): number => {
  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }
  return trimmed.split(/\s+/).length;
};

const LicoesView: React.FC<LicoesViewProps> = ({ settings, onBack }) => {
  const [activeTab, setActiveTab] = useState<TabType>('stories');
  const [selectedLevel, setSelectedLevel] = useState<LessonLevel | 'all'>('all');
  const [selectedTheme, setSelectedTheme] = useState<LessonTheme | 'all'>('all');
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [dictionaryQuery, setDictionaryQuery] = useState('');
  const [activeDictionaryEntry, setActiveDictionaryEntry] = useState<DictionaryEntryWithMeta | null>(null);
  const [quizProgress, setQuizProgress] = useState<Record<string, QuizProgressState>>({});
  const [writingProgress, setWritingProgress] = useState<Record<string, WritingProgressState>>({});

  const ensureQuizProgress = useCallback((lesson: Lesson) => {
    setQuizProgress(prev => {
      const questionCount = lesson.quizQuestions.length;
      const existing = prev[lesson.id];

      if (existing && existing.answers.length === questionCount) {
        return prev;
      }

      return {
        ...prev,
        [lesson.id]: createInitialQuizProgress(questionCount),
      };
    });
  }, []);

  const handleQuizAnswer = useCallback((lesson: Lesson, questionIndex: number, optionIndex: number) => {
    if (!lesson.quizQuestions[questionIndex]) {
      return;
    }

    setQuizProgress(prev => {
      const questionCount = lesson.quizQuestions.length;
      const existing = prev[lesson.id];
      const baseState = existing && existing.answers.length === questionCount
        ? existing
        : createInitialQuizProgress(questionCount);

      const answers = [...baseState.answers];
      const correctness = [...baseState.correctness];

      answers[questionIndex] = optionIndex;
      const isCorrect = lesson.quizQuestions[questionIndex].correctAnswer === optionIndex;
      correctness[questionIndex] = isCorrect ? 'correct' : 'incorrect';

      const score = correctness.filter(value => value === 'correct').length;
      const completed = answers.every(answer => answer !== null);

      return {
        ...prev,
        [lesson.id]: {
          answers,
          correctness,
          score,
          completed,
        },
      };
    });
  }, []);

  const handleResetQuiz = useCallback((lesson: Lesson) => {
    setQuizProgress(prev => ({
      ...prev,
      [lesson.id]: createInitialQuizProgress(lesson.quizQuestions.length),
    }));
  }, []);

  const ensureWritingProgress = useCallback((lesson: Lesson) => {
    if (!lesson.writingExercises.length) {
      return;
    }

    setWritingProgress(prev => {
      const exerciseCount = lesson.writingExercises.length;
      const existing = prev[lesson.id];

      if (existing && existing.responses.length === exerciseCount) {
        return prev;
      }

      return {
        ...prev,
        [lesson.id]: createInitialWritingProgress(exerciseCount),
      };
    });
  }, []);

  const evaluateWritingResponse = useCallback((exercise: WritingExercise, response: string): WritingEvaluation => {
    const trimmed = response.trim();
    const wordCount = countWords(response);

    if (!trimmed) {
      return {
        status: 'needs-review',
        feedback: 'Digite sua resposta antes de verificar.',
      };
    }

    const mode = exercise.evaluationMode ?? 'free';

    if (mode === 'exact') {
      if (!exercise.expectedAnswer) {
        return {
          status: 'needs-review',
          feedback: 'Resposta modelo não disponível para validação automática.',
        };
      }

      if (normalizeText(response) === normalizeText(exercise.expectedAnswer)) {
        return {
          status: 'correct',
          feedback: 'Resposta correta! Ótimo trabalho.',
        };
      }

      return {
        status: 'needs-review',
        feedback: `Compare com a resposta sugerida: ${exercise.modelAnswer ?? exercise.expectedAnswer}.`,
      };
    }

    if (mode === 'keywords') {
      const keywords = exercise.keywords ?? [];
      const normalizedResponse = normalizeText(response);
      const missingKeywords = keywords.filter(keyword => !normalizedResponse.includes(normalizeText(keyword)));

      if (missingKeywords.length === 0) {
        if (exercise.wordCountTarget && wordCount < exercise.wordCountTarget) {
          return {
            status: 'needs-review',
            feedback: `Inclua ao menos ${exercise.wordCountTarget} palavras. Você escreveu ${wordCount}.`,
          };
        }

        return {
          status: 'correct',
          feedback: 'Excelente! Você utilizou todas as expressões-chave.',
        };
      }

      return {
        status: 'needs-review',
        feedback: `Inclua também: ${missingKeywords.join(', ')}.`,
      };
    }

    const targetWords = exercise.wordCountTarget ?? 0;
    if (targetWords > 0 && wordCount < targetWords) {
      return {
        status: 'needs-review',
        feedback: `Escreva pelo menos ${targetWords} palavras. Você escreveu ${wordCount}.`,
      };
    }

    return {
      status: 'needs-review',
      feedback: 'Boa resposta! Envie para revisão do professor ou compare com o modelo sugerido.',
    };
  }, []);

  const handleWritingChange = useCallback((lesson: Lesson, exerciseIndex: number, value: string) => {
    if (!lesson.writingExercises[exerciseIndex]) {
      return;
    }

    setWritingProgress(prev => {
      const exerciseCount = lesson.writingExercises.length;
      const existing = prev[lesson.id];
      const baseState = existing && existing.responses.length === exerciseCount
        ? existing
        : createInitialWritingProgress(exerciseCount);

      const responses = [...baseState.responses];
      const statuses = [...baseState.statuses];
      const feedback = [...baseState.feedback];
      const wordCounts = [...baseState.wordCounts];

      responses[exerciseIndex] = value;
      statuses[exerciseIndex] = 'pending';
      feedback[exerciseIndex] = '';
      wordCounts[exerciseIndex] = countWords(value);

      const completed = statuses.every(status => status === 'correct');

      return {
        ...prev,
        [lesson.id]: {
          responses,
          statuses,
          feedback,
          wordCounts,
          completed,
        },
      };
    });
  }, []);

  const handleWritingEvaluate = useCallback((lesson: Lesson, exerciseIndex: number) => {
    if (!lesson.writingExercises[exerciseIndex]) {
      return;
    }

    setWritingProgress(prev => {
      const exerciseCount = lesson.writingExercises.length;
      const existing = prev[lesson.id];
      const baseState = existing && existing.responses.length === exerciseCount
        ? existing
        : createInitialWritingProgress(exerciseCount);

      const responses = [...baseState.responses];
      const statuses = [...baseState.statuses];
      const feedback = [...baseState.feedback];
      const wordCounts = [...baseState.wordCounts];

      const evaluation = evaluateWritingResponse(lesson.writingExercises[exerciseIndex], responses[exerciseIndex] ?? '');
      statuses[exerciseIndex] = evaluation.status;
      feedback[exerciseIndex] = evaluation.feedback;

      const completed = statuses.every(status => status === 'correct');

      return {
        ...prev,
        [lesson.id]: {
          responses,
          statuses,
          feedback,
          wordCounts,
          completed,
        },
      };
    });
  }, [evaluateWritingResponse]);

  const handleResetWriting = useCallback((lesson: Lesson) => {
    setWritingProgress(prev => ({
      ...prev,
      [lesson.id]: createInitialWritingProgress(lesson.writingExercises.length),
    }));
  }, []);

  const dictionaryMap: Map<string, DictionaryEntryWithMeta> = useMemo(() => {
    const map = new Map<string, DictionaryEntryWithMeta>();

    Object.entries(BASE_DICTIONARY_ENTRIES).forEach(([key, entry]) => {
      const normalized = normalizeTerm(key);
      map.set(normalized, {
        ...entry,
        term: entry.word ?? key,
      });
    });

    LESSONS.forEach(lesson => {
      lesson.story.expressions.forEach(expression => {
        const normalized = normalizeTerm(expression.text);
        if (!map.has(normalized)) {
          map.set(normalized, {
            term: expression.text,
            word: expression.text,
            translation: expression.translation,
            examples: expression.examples,
            audioUrl: expression.audioUrl,
            type: expression.type,
          });
        } else {
          const existing = map.get(normalized)!;
          if (!existing.translation) {
            existing.translation = expression.translation;
          }
          if ((!existing.examples || existing.examples.length === 0) && expression.examples.length) {
            existing.examples = expression.examples;
          }
          if (!existing.type) {
            existing.type = expression.type;
          }
        }
      });
    });

    return map;
  }, []);

  const dictionaryEntries: DictionaryEntryWithMeta[] = useMemo(() => {
    return Array.from(dictionaryMap.values()).sort((a, b) => a.term.localeCompare(b.term, 'en'));
  }, [dictionaryMap]);

  const filteredLessons = useMemo(() => {
    return LESSONS.filter(lesson => {
      const levelMatches = selectedLevel === 'all' || lesson.level === selectedLevel;
      const themeMatches = selectedTheme === 'all' || lesson.theme === selectedTheme;
      return levelMatches && themeMatches;
    });
  }, [selectedLevel, selectedTheme]);

  const selectedLesson = useMemo<Lesson | null>(() => {
    if (!selectedLessonId) return null;
    return filteredLessons.find(lesson => lesson.id === selectedLessonId) ?? null;
  }, [filteredLessons, selectedLessonId]);

  const quizLessons = useMemo(
    () => filteredLessons.filter(lesson => lesson.quizQuestions.length > 0),
    [filteredLessons]
  );

  const writingLessons = useMemo(
    () => filteredLessons.filter(lesson => lesson.writingExercises.length > 0),
    [filteredLessons]
  );

  useEffect(() => {
    if (!filteredLessons.length) {
      setSelectedLessonId(null);
      return;
    }

    if (!selectedLessonId || !filteredLessons.some(lesson => lesson.id === selectedLessonId)) {
      setSelectedLessonId(filteredLessons[0].id);
    }
  }, [filteredLessons, selectedLessonId]);

  useEffect(() => {
    if (activeTab !== 'interpretation') {
      return;
    }

    if (!quizLessons.length) {
      return;
    }

    if (!selectedLesson || selectedLesson.quizQuestions.length === 0) {
      setSelectedLessonId(quizLessons[0].id);
    }
  }, [activeTab, quizLessons, selectedLesson]);

  useEffect(() => {
    if (activeTab !== 'writing') {
      return;
    }

    if (!writingLessons.length) {
      return;
    }

    if (!selectedLesson || selectedLesson.writingExercises.length === 0) {
      setSelectedLessonId(writingLessons[0].id);
    }
  }, [activeTab, writingLessons, selectedLesson]);

  useEffect(() => {
    if (selectedLesson) {
      ensureQuizProgress(selectedLesson);
      ensureWritingProgress(selectedLesson);
    }
  }, [selectedLesson, ensureQuizProgress, ensureWritingProgress]);

  useEffect(() => {
    if (activeTab !== 'interpretation') {
      return;
    }

    if (!quizLessons.length) {
      return;
    }

    if (!selectedLesson || selectedLesson.quizQuestions.length === 0) {
      setSelectedLessonId(quizLessons[0].id);
    }
  }, [activeTab, quizLessons, selectedLesson]);

  const selectedQuizLesson = useMemo<Lesson | null>(() => {
    if (!selectedLesson) {
      return null;
    }
    if (selectedLesson.quizQuestions.length > 0) {
      return selectedLesson;
    }
    return quizLessons[0] ?? null;
  }, [quizLessons, selectedLesson]);

  const selectedWritingLesson = useMemo<Lesson | null>(() => {
    if (!selectedLesson) {
      return writingLessons[0] ?? null;
    }
    if (selectedLesson.writingExercises.length > 0) {
      return selectedLesson;
    }
    return writingLessons[0] ?? null;
  }, [selectedLesson, writingLessons]);

  const searchResults = useMemo(() => {
    const query = normalizeTerm(dictionaryQuery);
    if (!query) return [];

    return dictionaryEntries.filter(entry => normalizeTerm(entry.term).includes(query)).slice(0, 6);
  }, [dictionaryEntries, dictionaryQuery]);

  const openDictionaryEntry = useCallback(
    (rawTerm: string) => {
      const normalized = normalizeTerm(rawTerm);
      if (!normalized) return;

      const entry = dictionaryMap.get(normalized);
      if (entry) {
        setActiveDictionaryEntry(entry);
        return;
      }

      const firstExactByWord = dictionaryEntries.find(
        item => normalizeTerm(item.word ?? item.term) === normalized
      );

      if (firstExactByWord) {
        setActiveDictionaryEntry(firstExactByWord);
        return;
      }

      setActiveDictionaryEntry({
        term: rawTerm,
        word: rawTerm,
        translation: 'Tradução não encontrada no dicionário interno.',
        examples: [],
      });
    },
    [dictionaryEntries, dictionaryMap]
  );

  const handleDictionarySubmit = useCallback(
    (event?: React.FormEvent) => {
      event?.preventDefault();
      if (!dictionaryQuery.trim()) {
        return;
      }
      openDictionaryEntry(dictionaryQuery);
    },
    [dictionaryQuery, openDictionaryEntry]
  );

  const closeDictionaryPopup = useCallback(() => {
    setActiveDictionaryEntry(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDictionaryPopup();
      }
    };

    if (activeDictionaryEntry) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDictionaryEntry, closeDictionaryPopup]);

  const renderContent = () => {
    switch (activeTab) {
      case 'stories':
        return (
          <StoriesSection
            lessons={filteredLessons}
            selectedLesson={selectedLesson}
            onSelectLesson={setSelectedLessonId}
            onOpenDictionary={openDictionaryEntry}
          />
        );
      case 'interpretation':
        return (
          <InterpretationSection
            lessons={quizLessons}
            selectedLesson={selectedQuizLesson}
            onSelectLesson={lessonId => setSelectedLessonId(lessonId)}
            quizProgress={quizProgress}
            onSelectAnswer={handleQuizAnswer}
            onResetLesson={handleResetQuiz}
          />
        );
      case 'writing':
        return (
          <WritingSection
            lessons={writingLessons}
            selectedLesson={selectedWritingLesson}
            onSelectLesson={lessonId => setSelectedLessonId(lessonId)}
            writingProgress={writingProgress}
            onChangeResponse={handleWritingChange}
            onEvaluateResponse={handleWritingEvaluate}
            onResetLesson={handleResetWriting}
          />
        );
      case 'pronunciation':
        return <PronunciationSection />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100">
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>

            <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
              <GraduationCap className="hidden h-6 w-6 text-cyan-400 sm:block" />
              Lições de Inglês
            </h2>

            <p className="text-sm text-gray-400">
              Treinando de {settings.nativeLanguage} para {settings.learningLanguage}
            </p>
          </div>

          <form className="relative flex items-center space-x-2" onSubmit={handleDictionarySubmit}>
            <div className="relative">
              <input
                type="search"
                placeholder="Buscar palavra ou expressão..."
                value={dictionaryQuery}
                onChange={event => setDictionaryQuery(event.target.value)}
                className="bg-gray-700 text-white rounded-lg pl-10 pr-4 py-2 w-72 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <span className="text-cyan-400 font-semibold">Dic</span>
            <button
              type="submit"
              className="hidden rounded-md bg-cyan-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500 md:inline-flex"
            >
              Buscar
            </button>

            {dictionaryQuery && searchResults.length > 0 && (
              <div className="absolute top-full left-0 mt-2 w-full rounded-lg border border-gray-700 bg-gray-800 shadow-xl">
                <ul className="max-h-48 overflow-y-auto py-2 text-sm">
                  {searchResults.map(result => (
                    <li key={result.term}>
                      <button
                        type="button"
                        onClick={() => openDictionaryEntry(result.term)}
                        className="flex w-full flex-col items-start gap-1 px-4 py-2 text-left text-gray-200 transition hover:bg-gray-700"
                      >
                        <span className="font-semibold text-white">{result.term}</span>
                        <span className="text-xs text-gray-400">{result.translation}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </form>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <TabButton
            icon={<BookOpen className="w-5 h-5" />}
            label="Histórias"
            isActive={activeTab === 'stories'}
            onClick={() => setActiveTab('stories')}
          />
          <TabButton
            icon={<BookOpen className="w-5 h-5" />}
            label="Interpretação"
            isActive={activeTab === 'interpretation'}
            onClick={() => setActiveTab('interpretation')}
          />
          <TabButton
            icon={<PenTool className="w-5 h-5" />}
            label="Escrita"
            isActive={activeTab === 'writing'}
            onClick={() => setActiveTab('writing')}
          />
          <TabButton
            icon={<Mic className="w-5 h-5" />}
            label="Pronúncia"
            isActive={activeTab === 'pronunciation'}
            onClick={() => setActiveTab('pronunciation')}
          />
        </div>

        {activeTab === 'stories' && (
          <div className="mt-4 flex flex-wrap gap-4 border-t border-gray-700 pt-4">
            <FilterControl label="Nível">
              <select
                value={selectedLevel}
                onChange={event => setSelectedLevel(event.target.value as LessonLevel | 'all')}
                className="bg-gray-700 text-white rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="all">Todos</option>
                {Object.entries(levelLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </FilterControl>

            <FilterControl label="Tema">
              <select
                value={selectedTheme}
                onChange={event => setSelectedTheme(event.target.value as LessonTheme | 'all')}
                className="bg-gray-700 text-white rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="all">Todos</option>
                {Object.entries(themeLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </FilterControl>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {renderContent()}
      </div>

      {activeDictionaryEntry && (
        <DictionaryPopup entry={activeDictionaryEntry} onClose={closeDictionaryPopup} />
      )}
    </div>
  );
};

interface StoriesSectionProps {
  lessons: Lesson[];
  selectedLesson: Lesson | null;
  onSelectLesson: (lessonId: string) => void;
  onOpenDictionary: (term: string) => void;
}

const StoriesSection: React.FC<StoriesSectionProps> = ({
  lessons,
  selectedLesson,
  onSelectLesson,
  onOpenDictionary,
}) => {
  if (!lessons.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
        <BookOpen className="mb-4 h-12 w-12 text-gray-600" />
        <h3 className="text-xl font-semibold">Nenhuma lição encontrada com os filtros atuais</h3>
        <p className="mt-2 max-w-md text-sm text-gray-500">
          Ajuste o nível ou tema para explorar outras histórias com expressões idiomáticas, gírias e provérbios.
        </p>
      </div>
    );
  }

  if (!selectedLesson) {
    return null;
  }

  const paragraphs = selectedLesson.story.paragraphs?.length
    ? selectedLesson.story.paragraphs
    : selectedLesson.story.content.split(/\n\n+/);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr] xl:grid-cols-[360px_1fr]">
      <aside className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
          Selecionar lição
        </h3>
        <div className="space-y-3">
          {lessons.map(lesson => {
            const isActive = lesson.id === selectedLesson.id;
            return (
              <button
                key={lesson.id}
                onClick={() => onSelectLesson(lesson.id)}
                className={`w-full rounded-xl border p-4 text-left transition ${isActive
                    ? 'border-cyan-500 bg-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.25)]'
                    : 'border-gray-700 bg-gray-800 hover:border-cyan-500/60 hover:bg-gray-800/70'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-semibold text-white">{lesson.title}</h4>
                  <span className="rounded-full bg-gray-900/70 px-3 py-1 text-xs text-gray-300">
                    {levelLabels[lesson.level]}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-400">Tema: {themeLabels[lesson.theme]}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {lesson.story.expressions.slice(0, 3).map(expression => (
                    <span
                      key={`${lesson.id}-${expression.text}`}
                      className={`${expressionTypeColors[expression.type]} rounded-full px-2 py-1 text-xs`}
                    >
                      {expression.text}
                    </span>
                  ))}
                  {lesson.story.expressions.length > 3 && (
                    <span className="rounded-full bg-gray-700 px-2 py-1 text-xs text-gray-300">
                      +{lesson.story.expressions.length - 3}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="flex flex-col gap-6 rounded-2xl border border-gray-700 bg-gray-900/60 p-6 shadow-inner">
        <header className="flex flex-col gap-2 border-b border-gray-700 pb-4">
          <span className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-400">
            História em inglês
          </span>
          <h3 className="text-2xl font-bold text-white">{selectedLesson.story.title}</h3>
          <p className="text-sm text-gray-400">
            Nível {levelLabels[selectedLesson.level]} • Tema {themeLabels[selectedLesson.theme]}
          </p>
        </header>

        <div className="space-y-6 text-lg leading-relaxed text-gray-100">
          {paragraphs.map((paragraph, index) => (
            <p key={`${selectedLesson.id}-paragraph-${index}`} className="space-x-1">
              {renderParagraph(paragraph, selectedLesson.story.expressions, onOpenDictionary)}
            </p>
          ))}
        </div>

        <ExpressionLegend expressions={selectedLesson.story.expressions} onOpenDictionary={onOpenDictionary} />
      </section>
    </div>
  );
};

const renderParagraph = (
  paragraph: string,
  expressions: Expression[],
  onOpenDictionary: (term: string) => void
): React.ReactNode[] => {
  const sortedExpressions = [...expressions].sort(
    (a, b) => normalizeTerm(b.text).length - normalizeTerm(a.text).length
  );

  let nodes: React.ReactNode[] = [paragraph];
  let expressionKey = 0;

  sortedExpressions.forEach(expression => {
    const regex = new RegExp(`(${escapeRegex(expression.text)})`, 'gi');
    const nextNodes: React.ReactNode[] = [];

    nodes.forEach(node => {
      if (typeof node !== 'string') {
        nextNodes.push(node);
        return;
      }

      let lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(node)) !== null) {
        if (match.index > lastIndex) {
          nextNodes.push(node.slice(lastIndex, match.index));
        }

        const matchedText = match[0];
        nextNodes.push(
          <ExpressionLink
            key={`expression-${expressionKey++}`}
            expression={expression}
            onClick={() => onOpenDictionary(matchedText)}
          >
            {matchedText}
          </ExpressionLink>
        );

        lastIndex = regex.lastIndex;
      }

      if (lastIndex < node.length) {
        nextNodes.push(node.slice(lastIndex));
      }
    });

    nodes = nextNodes;
  });

  const finalNodes: React.ReactNode[] = [];
  nodes.forEach((node, index) => {
    if (typeof node !== 'string') {
      finalNodes.push(React.cloneElement(node as React.ReactElement, { key: `node-${index}` }));
      return;
    }

    const tokens = node.split(/(\s+)/);
    tokens.forEach((token, tokenIndex) => {
      if (!token) return;
      if (/\s+/.test(token)) {
        finalNodes.push(<span key={`space-${index}-${tokenIndex}`}>{token}</span>);
        return;
      }

      finalNodes.push(
        <DictionaryWord
          key={`word-${index}-${tokenIndex}`}
          display={token}
          lookupTerm={token}
          onLookup={onOpenDictionary}
        />
      );
    });
  });

  return finalNodes;
};

const ExpressionLink: React.FC<{
  expression: Expression;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ expression, onClick, children }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-pre-wrap underline decoration-dotted underline-offset-4 transition hover:text-cyan-200 focus:text-cyan-200 focus:outline-none ${
        expressionTypeColors[expression.type]
      } px-1 py-0.5 rounded-md`}
    >
      {children}
    </button>
  );
};

interface DictionaryWordProps {
  display: string;
  lookupTerm: string;
  onLookup: (term: string) => void;
}

const DictionaryWord: React.FC<DictionaryWordProps> = ({ display, lookupTerm, onLookup }) => {
  const holdTimeout = useRef<number>();

  const clearHold = () => {
    if (holdTimeout.current) {
      window.clearTimeout(holdTimeout.current);
      holdTimeout.current = undefined;
    }
  };

  const triggerLookup = () => {
    const cleaned = lookupTerm.replace(/[.,!?;:"'()\[\]{}]/g, '');
    if (!cleaned) return;
    onLookup(cleaned);
  };

  const handleMouseDown = () => {
    clearHold();
    holdTimeout.current = window.setTimeout(triggerLookup, 1000);
  };

  const handleTouchStart: React.TouchEventHandler<HTMLSpanElement> = event => {
    event.preventDefault();
    clearHold();
    holdTimeout.current = window.setTimeout(triggerLookup, 1000);
  };

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={triggerLookup}
      onMouseDown={handleMouseDown}
      onMouseUp={clearHold}
      onMouseLeave={clearHold}
      onTouchStart={handleTouchStart}
      onTouchEnd={clearHold}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          triggerLookup();
        }
      }}
      className="cursor-pointer rounded-sm px-0.5 transition hover:bg-cyan-500/20 focus:bg-cyan-500/20"
    >
      {display}
    </span>
  );
};

const ExpressionLegend: React.FC<{
  expressions: Expression[];
  onOpenDictionary: (term: string) => void;
}> = ({ expressions, onOpenDictionary }) => {
  if (!expressions.length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-4">
      <h4 className="text-sm font-semibold text-gray-300">
        Expressões desta história (clique para ver a tradução)
      </h4>
      <div className="mt-3 flex flex-wrap gap-2">
        {expressions.map(expression => (
          <button
            key={expression.text}
            type="button"
            onClick={() => onOpenDictionary(expression.text)}
            className={`${expressionTypeColors[expression.type]} rounded-full px-3 py-1 text-sm transition hover:brightness-125`}
          >
            <span className="font-medium text-white">{expression.text}</span>
            <span className="ml-2 text-xs uppercase tracking-widest text-gray-200/80">
              {expressionTypeLabels[expression.type]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

const DictionaryPopup: React.FC<{
  entry: DictionaryEntryWithMeta;
  onClose: () => void;
}> = ({ entry, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative max-w-lg w-full rounded-2xl border border-cyan-500/30 bg-gray-900 p-6 shadow-[0_0_30px_rgba(8,145,178,0.35)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-sm text-gray-400 transition hover:text-white"
        >
          Fechar
        </button>
        <div className="space-y-4">
          <header className="space-y-1">
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-300/80">Dicionário</p>
            <h3 className="text-2xl font-bold text-white">{entry.word ?? entry.term}</h3>
            {entry.type && (
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${expressionTypeColors[entry.type]}`}>
                {expressionTypeLabels[entry.type]}
              </span>
            )}
          </header>
          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-200">
              Tradução
            </h4>
            <p className="rounded-lg bg-gray-800/70 p-3 text-gray-100">
              {entry.translation}
            </p>
          </section>
          {entry.examples && entry.examples.length > 0 && (
            <section className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-200">Exemplos</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                {entry.examples.map((example, index) => (
                  <li
                    key={`${entry.term}-example-${index}`}
                    className="rounded-md bg-gray-800/50 p-3"
                  >
                    “{example}”
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

const FilterControl: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="flex flex-col gap-1 text-sm text-gray-400">
    <span className="font-medium uppercase tracking-widest text-gray-500">{label}</span>
    {children}
  </label>
);

const TabButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
      isActive
        ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(34,211,238,0.35)]'
        : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

interface InterpretationSectionProps {
  lessons: Lesson[];
  selectedLesson: Lesson | null;
  onSelectLesson: (lessonId: string) => void;
  quizProgress: Record<string, QuizProgressState>;
  onSelectAnswer: (lesson: Lesson, questionIndex: number, optionIndex: number) => void;
  onResetLesson: (lesson: Lesson) => void;
}

const InterpretationSection: React.FC<InterpretationSectionProps> = ({
  lessons,
  selectedLesson,
  onSelectLesson,
  quizProgress,
  onSelectAnswer,
  onResetLesson,
}) => {
  if (!lessons.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
        <BookOpen className="mb-4 h-12 w-12 text-gray-600" />
        <h3 className="text-xl font-semibold">Ainda não há quizzes disponíveis</h3>
        <p className="mt-2 max-w-md text-sm text-gray-500">
          Em breve você poderá testar sua compreensão com novos exercícios de interpretação.
        </p>
      </div>
    );
  }

  if (!selectedLesson) {
    return null;
  }

  const progress = quizProgress[selectedLesson.id] ?? createInitialQuizProgress(selectedLesson.quizQuestions.length);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr] xl:grid-cols-[360px_1fr]">
      <aside className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
          Selecionar quiz
        </h3>
        <div className="space-y-3">
          {lessons.map(lesson => {
            const lessonProgress = quizProgress[lesson.id] ?? createInitialQuizProgress(lesson.quizQuestions.length);
            const isActive = selectedLesson.id === lesson.id;
            const isCompleted = lessonProgress.completed && lesson.quizQuestions.length > 0;

            return (
              <button
                key={`quiz-${lesson.id}`}
                onClick={() => onSelectLesson(lesson.id)}
                className={`w-full rounded-xl border p-4 text-left transition ${isActive
                    ? 'border-purple-500 bg-purple-500/15 shadow-[0_0_20px_rgba(192,132,252,0.25)]'
                    : 'border-gray-700 bg-gray-800 hover:border-purple-500/50 hover:bg-gray-800/70'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-semibold text-white">{lesson.title}</h4>
                  <span className="rounded-full bg-gray-900/70 px-3 py-1 text-xs text-gray-300">
                    {levelLabels[lesson.level]}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-400">Tema: {themeLabels[lesson.theme]}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                  <Info className="h-3.5 w-3.5" />
                  <span>
                    {lesson.quizQuestions.length} questões • {lessonProgress.score}/{lesson.quizQuestions.length} acertos
                  </span>
                </div>

                {isCompleted && (
                  <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Quiz concluído
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      <section className="flex flex-col gap-6 rounded-2xl border border-purple-500/40 bg-gray-900/60 p-6 shadow-inner">
        <header className="flex flex-col gap-3 border-b border-gray-700 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium uppercase tracking-[0.3em] text-purple-300">
                Quiz de compreensão
              </span>
              <h3 className="text-2xl font-bold text-white">{selectedLesson.title}</h3>
            </div>

            <button
              type="button"
              onClick={() => onResetLesson(selectedLesson)}
              className="inline-flex items-center gap-2 rounded-md border border-purple-500/40 px-3 py-2 text-xs font-semibold text-purple-200 transition hover:bg-purple-500/20"
            >
              <RefreshCw className="h-4 w-4" /> Reiniciar quiz
            </button>
          </div>

          <p className="text-sm text-gray-400">
            Nível {levelLabels[selectedLesson.level]} • Tema {themeLabels[selectedLesson.theme]}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
            <span className="inline-flex items-center gap-2 rounded-md bg-gray-800/70 px-3 py-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Acertos: {progress.score}
            </span>
            <span className="inline-flex items-center gap-2 rounded-md bg-gray-800/70 px-3 py-1">
              Questões respondidas: {progress.answers.filter(a => a !== null).length}/{selectedLesson.quizQuestions.length}
            </span>
            {progress.completed && (
              <span className="inline-flex items-center gap-2 rounded-md bg-emerald-500/20 px-3 py-1 text-emerald-200">
                Quiz concluído!
              </span>
            )}
          </div>
        </header>

        <div className="space-y-6">
          {selectedLesson.quizQuestions.map((question, questionIndex) => {
            const selectedAnswer = progress.answers[questionIndex];
            const status = progress.correctness[questionIndex];

            return (
              <article
                key={question.id}
                className={`rounded-xl border p-5 transition ${status === 'correct'
                    ? 'border-emerald-500/40 bg-emerald-500/10'
                    : status === 'incorrect'
                      ? 'border-rose-500/40 bg-rose-500/10'
                      : 'border-gray-700 bg-gray-800'
                  }`}
              >
                <div className="mb-4 flex items-start gap-3">
                  <span className="mt-1 inline-flex h-7 min-w-[2rem] items-center justify-center rounded-full bg-purple-500/60 text-sm font-semibold text-white">
                    {questionIndex + 1}
                  </span>
                  <div>
                    <h4 className="text-base font-semibold text-white">{question.question}</h4>
                    <p className="text-sm text-gray-400">Selecione a alternativa correta.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {question.options.map((option, optionIndex) => {
                    const isSelected = selectedAnswer === optionIndex;
                    const isCorrectOption = question.correctAnswer === optionIndex;
                    const showFeedback = status !== null;
                    const isCorrectSelection = showFeedback && isSelected && isCorrectOption;
                    const isIncorrectSelection = showFeedback && isSelected && !isCorrectOption;

                    return (
                      <button
                        key={`${question.id}-option-${optionIndex}`}
                        type="button"
                        onClick={() => onSelectAnswer(selectedLesson, questionIndex, optionIndex)}
                        className={`w-full rounded-lg border px-4 py-3 text-left transition ${isSelected
                            ? 'border-purple-400 bg-purple-500/10 text-white'
                            : 'border-gray-700 bg-gray-800 text-gray-200 hover:border-purple-400/40 hover:bg-gray-700'
                          } ${isCorrectSelection ? 'border-emerald-500 bg-emerald-500/20 text-emerald-100'
                            : ''} ${isIncorrectSelection ? 'border-rose-500 bg-rose-500/20 text-rose-100'
                            : ''}`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm font-medium">{option}</span>
                          {showFeedback && isCorrectOption && (
                            <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                          )}
                          {showFeedback && isIncorrectSelection && (
                            <XCircle className="h-5 w-5 text-rose-300" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {status !== null && (
                  <div className="mt-4 rounded-lg bg-gray-900/60 p-4 text-sm text-gray-200">
                    <strong className="block text-white">
                      {status === 'correct' ? '✅ Resposta correta!' : '⚠️ Resposta incorreta.'}
                    </strong>
                    <p className="mt-2 text-gray-300">{question.explanation}</p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};

interface WritingSectionProps {
  lessons: Lesson[];
  selectedLesson: Lesson | null;
  onSelectLesson: (lessonId: string) => void;
  writingProgress: Record<string, WritingProgressState>;
  onChangeResponse: (lesson: Lesson, exerciseIndex: number, value: string) => void;
  onEvaluateResponse: (lesson: Lesson, exerciseIndex: number) => void;
  onResetLesson: (lesson: Lesson) => void;
}

const WritingSection: React.FC<WritingSectionProps> = ({
  lessons,
  selectedLesson,
  onSelectLesson,
  writingProgress,
  onChangeResponse,
  onEvaluateResponse,
  onResetLesson,
}) => {
  if (!lessons.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
        <PenTool className="mb-4 h-12 w-12 text-gray-600" />
        <h3 className="text-xl font-semibold">Exercícios de escrita chegando em breve</h3>
        <p className="mt-2 max-w-md text-sm text-gray-500">
          Continue praticando as histórias e quizzes enquanto os desafios de escrita são finalizados.
        </p>
      </div>
    );
  }

  if (!selectedLesson) {
    return null;
  }

  const progress = writingProgress[selectedLesson.id] ?? createInitialWritingProgress(selectedLesson.writingExercises.length);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr] xl:grid-cols-[360px_1fr]">
      <aside className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
          Selecionar desafio
        </h3>
        <div className="space-y-3">
          {lessons.map(lesson => {
            const lessonProgress = writingProgress[lesson.id] ?? createInitialWritingProgress(lesson.writingExercises.length);
            const isActive = selectedLesson.id === lesson.id;
            const completedCount = lessonProgress.statuses.filter(status => status === 'correct').length;

            return (
              <button
                key={`writing-${lesson.id}`}
                onClick={() => onSelectLesson(lesson.id)}
                className={`w-full rounded-xl border p-4 text-left transition ${isActive
                    ? 'border-emerald-500 bg-emerald-500/15 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                    : 'border-gray-700 bg-gray-800 hover:border-emerald-500/50 hover:bg-gray-800/70'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-semibold text-white">{lesson.title}</h4>
                  <span className="rounded-full bg-gray-900/70 px-3 py-1 text-xs text-gray-300">
                    {levelLabels[lesson.level]}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-400">Tema: {themeLabels[lesson.theme]}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                  <Info className="h-3.5 w-3.5" />
                  <span>
                    {lesson.writingExercises.length} exercícios • {completedCount}/{lesson.writingExercises.length} concluídos
                  </span>
                </div>

                {lessonProgress.completed && lesson.writingExercises.length > 0 && (
                  <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Escrita concluída
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      <section className="flex flex-col gap-6 rounded-2xl border border-emerald-500/40 bg-gray-900/60 p-6 shadow-inner">
        <header className="flex flex-col gap-3 border-b border-gray-700 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium uppercase tracking-[0.3em] text-emerald-300">
                Treino de escrita
              </span>
              <h3 className="text-2xl font-bold text-white">{selectedLesson.title}</h3>
            </div>

            <button
              type="button"
              onClick={() => onResetLesson(selectedLesson)}
              className="inline-flex items-center gap-2 rounded-md border border-emerald-500/40 px-3 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
            >
              <RefreshCw className="h-4 w-4" /> Reiniciar respostas
            </button>
          </div>

          <p className="text-sm text-gray-400">
            Nível {levelLabels[selectedLesson.level]} • Tema {themeLabels[selectedLesson.theme]}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
            <span className="inline-flex items-center gap-2 rounded-md bg-gray-800/70 px-3 py-1">
              Exercícios concluídos: {progress.statuses.filter(status => status === 'correct').length}/{selectedLesson.writingExercises.length}
            </span>
            {progress.completed && (
              <span className="inline-flex items-center gap-2 rounded-md bg-emerald-500/20 px-3 py-1 text-emerald-200">
                Treino finalizado!
              </span>
            )}
          </div>
        </header>

        <div className="space-y-6">
          {selectedLesson.writingExercises.map((exercise, index) => {
            const response = progress.responses[index] ?? '';
            const status = progress.statuses[index] ?? 'pending';
            const feedback = progress.feedback[index] ?? '';
            const wordCount = progress.wordCounts[index] ?? countWords(response);

            const statusClasses =
              status === 'correct'
                ? 'border-emerald-500/50 bg-emerald-500/10'
                : status === 'needs-review'
                  ? 'border-amber-500/50 bg-amber-500/10'
                  : 'border-gray-700 bg-gray-800';

            return (
              <article key={exercise.id} className={`rounded-xl border p-5 transition ${statusClasses}`}>
                <header className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-7 min-w-[2rem] items-center justify-center rounded-full bg-emerald-500/60 text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-white">{exercise.prompt}</h4>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                      <span className="inline-flex items-center gap-1 rounded bg-gray-900/70 px-2 py-1">
                        Tipo: {exercise.type}
                      </span>
                      {exercise.wordCountTarget && (
                        <span className="inline-flex items-center gap-1 rounded bg-gray-900/70 px-2 py-1">
                          Meta: {exercise.wordCountTarget} palavras
                        </span>
                      )}
                    </div>
                  </div>
                </header>

                <div className="mt-4">
                  <textarea
                    value={response}
                    onChange={event => onChangeResponse(selectedLesson, index, event.target.value)}
                    rows={Math.max(4, Math.ceil((response.trim().length || 120) / 60))}
                    className="w-full rounded-lg border border-gray-700 bg-gray-900/70 px-4 py-3 text-sm text-gray-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    placeholder="Digite sua resposta aqui..."
                  />

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                    <span>Palavras: {wordCount}</span>
                    {exercise.hints && exercise.hints.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-800 px-3 py-1 text-gray-300">
                        Dicas: {exercise.hints.join(' • ')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onEvaluateResponse(selectedLesson, index)}
                    className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                  >
                    Verificar resposta
                  </button>

                  {exercise.modelAnswer && (
                    <details className="group">
                      <summary className="cursor-pointer text-sm text-gray-300 transition hover:text-white">
                        Mostrar resposta sugerida
                      </summary>
                      <div className="mt-2 rounded-lg bg-gray-900/50 p-3 text-sm text-gray-200">
                        {exercise.modelAnswer}
                      </div>
                    </details>
                  )}
                </div>

                {feedback && (
                  <div className="mt-4 rounded-lg bg-gray-900/60 p-4 text-sm text-gray-200">
                    <strong className="block text-white">
                      {status === 'correct' ? '✅ Excelente!' : '📝 Ajuste sugerido'}
                    </strong>
                    <p className="mt-2 text-gray-300">{feedback}</p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};

const PronunciationSection: React.FC = () => (
  <div className="text-center py-12">
    <Mic className="w-16 h-16 text-gray-600 mx-auto mb-4" />
    <h3 className="text-2xl font-bold text-gray-400 mb-2">Testes de Pronúncia</h3>
    <p className="text-gray-500">
      Sistema de análise com openSMILE em desenvolvimento.
    </p>
  </div>
);

export default LicoesView;
