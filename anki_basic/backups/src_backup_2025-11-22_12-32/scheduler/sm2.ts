/**
 * SM-2 Scheduler implementation based on SuperMemo SM-2 algorithm.
 * References:
 * - https://www.supermemo.com/en/algorithms/sm-2
 * - https://docs.ankiweb.net/#/math?id=the-sm-2-algorithm
 */

export interface SM2Card {
  id: string;
  deckId: string;
  easeFactor: number; // EF: ease factor (default 2.5)
  interval: number; // interval in days
  repetitions: number; // number of repetitions
  nextReview: Date | null; // next review date
  lastReview: Date | null; // last review date
  quality: number | null; // quality of last recall (0-5)
}

export interface ReviewResult {
  cardId: string;
  quality: number; // 0-5 (0=blackout, 5=perfect)
  reviewTime: Date;
  nextReview: Date;
  updatedCard: SM2Card;
}

export interface SchedulerState {
  cards: Record<string, SM2Card>;
  dueCards: string[]; // cards due for review
  newCards: string[]; // cards never reviewed
  learningCards: string[]; // cards in learning phase
}

// Default SM-2 parameters
export const SM2_DEFAULTS = {
  easeFactor: 2.5,
  intervalModifier: 1.0,
  minimumEaseFactor: 1.3,
  initialInterval: 1,
  graduationInterval: 4,
  failingInterval: 1,
} as const;

/**
 * Calculate next review parameters based on SM-2 algorithm
 */
export function calculateNextReview(
  card: SM2Card,
  quality: number,
  reviewTime: Date = new Date()
): ReviewResult {
  let { easeFactor, interval, repetitions } = card;
  let newInterval = interval;
  let newEaseFactor = easeFactor;
  let newRepetitions = repetitions;

  // SM-2 algorithm
  if (quality >= 3) {
    // Correct response
    if (repetitions === 0) {
      newInterval = 1;
      newRepetitions = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
      newRepetitions = 2;
    } else {
      newInterval = Math.round(interval * easeFactor);
      newRepetitions += 1;
    }
  } else {
    // Incorrect response
    newInterval = 1;
    newRepetitions = 0;
  }

  // Update ease factor
  newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEaseFactor < SM2_DEFAULTS.minimumEaseFactor) {
    newEaseFactor = SM2_DEFAULTS.minimumEaseFactor;
  }

  const nextReview = new Date(reviewTime);
  nextReview.setDate(nextReview.getDate() + newInterval);

  const updatedCard: SM2Card = {
    ...card,
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReview,
    lastReview: reviewTime,
    quality,
  };

  return {
    cardId: card.id,
    quality,
    reviewTime,
    nextReview,
    updatedCard,
  };
}

/**
 * Create a new SM-2 card with default values
 */
export function createSM2Card(id: string, deckId: string): SM2Card {
  return {
    id,
    deckId,
    easeFactor: SM2_DEFAULTS.easeFactor,
    interval: 0,
    repetitions: 0,
    nextReview: null,
    lastReview: null,
    quality: null,
  };
}

/**
 * Get cards due for review
 */
export function getDueCards(cards: Record<string, SM2Card>, now: Date = new Date()): string[] {
  return Object.values(cards)
    .filter((card) => {
      if (!card.nextReview) return false; // New cards
      return card.nextReview <= now;
    })
    .map((card) => card.id);
}

/**
 * Get new cards (never reviewed)
 */
export function getNewCards(cards: Record<string, SM2Card>): string[] {
  return Object.values(cards)
    .filter((card) => card.nextReview === null && card.lastReview === null)
    .map((card) => card.id);
}

/**
 * Get learning cards (short intervals)
 */
export function getLearningCards(cards: Record<string, SM2Card>, now: Date = new Date()): string[] {
  return Object.values(cards)
    .filter((card) => {
      if (!card.nextReview) return false;
      return card.nextReview > now && card.interval < SM2_DEFAULTS.graduationInterval;
    })
    .map((card) => card.id);
}

/**
 * Get scheduler state summary
 */
export function getSchedulerState(
  cards: Record<string, SM2Card>,
  now: Date = new Date()
): SchedulerState {
  return {
    cards,
    dueCards: getDueCards(cards, now),
    newCards: getNewCards(cards),
    learningCards: getLearningCards(cards, now),
  };
}

/**
 * Calculate card statistics
 */
export function calculateCardStats(cards: Record<string, SM2Card>) {
  const totalCards = Object.keys(cards).length;
  const dueCards = getDueCards(cards).length;
  const newCards = getNewCards(cards).length;
  const learningCards = getLearningCards(cards).length;

  const averageEaseFactor =
    totalCards > 0
      ? Object.values(cards).reduce((sum, card) => sum + card.easeFactor, 0) / totalCards
      : 0;

  return {
    totalCards,
    dueCards,
    newCards,
    learningCards,
    averageEaseFactor,
  };
}
