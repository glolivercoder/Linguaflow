import { create } from "zustand";

import type { ImportedDeck } from "@services/anki/types";
import type { DeckStats } from "../types/app";
import type { SM2Card, SchedulerState } from "@scheduler/sm2";
import { createSM2Card, calculateNextReview, getSchedulerState } from "@scheduler/sm2";

const initialStats: DeckStats = {
  totalCards: 0,
  totalDecks: 0,
};

interface AppStoreState {
  decks: ImportedDeck[];
  stats: DeckStats;
  schedulerCards: Record<string, SM2Card>;
  schedulerState: SchedulerState;
  hydrateFromImport: (decks: ImportedDeck[]) => void;
  clear: () => void;
  getDeckById: (deckId: string) => ImportedDeck | undefined;
  getCardById: (cardId: string) => SM2Card | undefined;
  reviewCard: (cardId: string, quality: number) => void;
  initializeScheduler: () => void;
  autoPlayAudio: boolean;
  toggleAutoPlayAudio: () => void;
  useTTS: boolean;
  toggleTTS: () => void;
}

function calculateStats(decks: ImportedDeck[]): DeckStats {
  return {
    totalDecks: decks.length,
    totalCards: decks.reduce((sum, deck) => sum + deck.cards.length, 0),
    lastImportAt: decks.length ? new Date().toISOString() : undefined,
  };
}

function initializeSchedulerCards(decks: ImportedDeck[]): Record<string, SM2Card> {
  const cards: Record<string, SM2Card> = {};
  decks.forEach((deck) => {
    deck.cards.forEach((card) => {
      cards[card.id] = createSM2Card(card.id, deck.id);
    });
  });
  return cards;
}

export const useAppStore = create<AppStoreState>((set, get) => ({
  decks: [],
  stats: initialStats,
  schedulerCards: {},
  schedulerState: { cards: {}, dueCards: [], newCards: [], learningCards: [] },
  hydrateFromImport: (decks) => {
    const schedulerCards = initializeSchedulerCards(decks);
    const schedulerState = getSchedulerState(schedulerCards);
    set({
      decks,
      stats: calculateStats(decks),
      schedulerCards,
      schedulerState,
    });
  },
  clear: () =>
    set({
      decks: [],
      stats: initialStats,
      schedulerCards: {},
      schedulerState: { cards: {}, dueCards: [], newCards: [], learningCards: [] },
    }),
  getDeckById: (deckId) => get().decks.find((deck) => deck.id === deckId),
  getCardById: (cardId) => get().schedulerCards[cardId],
  reviewCard: (cardId, quality) => {
    const card = get().schedulerCards[cardId];
    if (!card) return;

    const result = calculateNextReview(card, quality);
    const updatedCards = {
      ...get().schedulerCards,
      [cardId]: result.updatedCard,
    };
    const schedulerState = getSchedulerState(updatedCards);

    set({
      schedulerCards: updatedCards,
      schedulerState,
    });
  },
  initializeScheduler: () => {
    const { decks } = get();
    const schedulerCards = initializeSchedulerCards(decks);
    const schedulerState = getSchedulerState(schedulerCards);
    set({
      schedulerCards,
      schedulerState,
    });
  },
  autoPlayAudio: false,
  toggleAutoPlayAudio: () => set((state) => ({ autoPlayAudio: !state.autoPlayAudio })),
  useTTS: false,
  toggleTTS: () => set((state) => ({ useTTS: !state.useTTS })),
}));
