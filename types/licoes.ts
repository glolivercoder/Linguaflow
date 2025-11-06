// Types for the Lições (Lessons) system

export enum LessonLevel {
  BASICO = 'basico',
  INTERMEDIARIO = 'intermediario',
  AVANCADO = 'avancado'
}

export enum LessonTheme {
  APRESENTACAO = 'apresentacao',
  AMIZADE = 'amizade',
  HOBBIES = 'hobbies',
  PAQUERA = 'paquera',
  DESCONTRAIDO = 'descontraido',
  FOFOCA = 'fofoca'
}

export enum ExpressionType {
  IDIOM = 'idiom',
  SLANG = 'slang',
  PROVERB = 'proverb'
}

export interface Expression {
  text: string;
  type: ExpressionType;
  translation: string;
  examples: string[];
  audioUrl?: string;
}

export interface Story {
  id: string;
  title: string;
  level: LessonLevel;
  theme: LessonTheme;
  content: string;
  paragraphs?: string[];
  expressions: Expression[];
  imageUrl?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option
  explanation: string;
}

export interface WritingExercise {
  id: string;
  type: 'fill-blank' | 'reconstruction' | 'free-writing' | 'translation' | 'dictation';
  prompt: string;
  expectedAnswer?: string;
  evaluationMode?: 'exact' | 'keywords' | 'free';
  keywords?: string[];
  wordCountTarget?: number;
  modelAnswer?: string;
  hints?: string[];
  audioUrl?: string; // for dictation
}

export interface PronunciationExercise {
  id: string;
  text: string;
  referenceAudioUrl: string;
  difficulty: LessonLevel;
}

export interface Lesson {
  id: string;
  title: string;
  level: LessonLevel;
  theme: LessonTheme;
  story: Story;
  quizQuestions: QuizQuestion[];
  writingExercises: WritingExercise[];
  pronunciationExercises: PronunciationExercise[];
  completedAt?: number;
}

export interface DictionaryEntry {
  word: string;
  translation: string;
  phonetic?: string;
  examples: string[];
  audioUrl?: string;
  partOfSpeech?: string; // noun, verb, adjective, etc.
}

export interface LessonProgress {
  lessonId: string;
  quizScore: number;
  writingScore: number;
  pronunciationScore: number;
  completedAt?: number;
  attemptsCount: number;
}

export interface PronunciationResult {
  overallScore: number;
  transcription: string;
  textAccuracy: number;
  pitchScore: number;
  fluencyScore: number;
  qualityScore: number;
  detailedFeedback: string;
  userMetrics: PronunciationMetrics;
  referenceMetrics: PronunciationMetrics;
}

export interface PronunciationMetrics {
  pitch_mean: number;
  pitch_variation: number;
  loudness: number;
  jitter: number;
  shimmer: number;
  voice_quality: number;
  duration: number;
}
