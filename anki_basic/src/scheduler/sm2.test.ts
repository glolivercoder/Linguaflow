import {
  createSM2Card,
  calculateNextReview,
  getDueCards,
  getNewCards,
  getSchedulerState,
  calculateCardStats,
} from "./sm2";

describe("SM-2 Scheduler", () => {
  const testCardId = "card-123";
  const testDeckId = "deck-456";

  describe("createSM2Card", () => {
    it("should create a card with default values", () => {
      const card = createSM2Card(testCardId, testDeckId);

      expect(card.id).toBe(testCardId);
      expect(card.deckId).toBe(testDeckId);
      expect(card.easeFactor).toBe(2.5);
      expect(card.interval).toBe(0);
      expect(card.repetitions).toBe(0);
      expect(card.nextReview).toBeNull();
      expect(card.lastReview).toBeNull();
      expect(card.quality).toBeNull();
    });
  });

  describe("calculateNextReview", () => {
    it("should handle first successful review (quality >= 3)", () => {
      const card = createSM2Card(testCardId, testDeckId);
      const reviewTime = new Date("2024-01-01T10:00:00Z");

      const result = calculateNextReview(card, 5, reviewTime);

      expect(result.cardId).toBe(testCardId);
      expect(result.quality).toBe(5);
      expect(result.updatedCard.repetitions).toBe(1);
      expect(result.updatedCard.interval).toBe(1);
      expect(result.updatedCard.easeFactor).toBeCloseTo(2.6);
      expect(result.nextReview).toEqual(new Date("2024-01-02T10:00:00Z"));
    });

    it("should handle second successful review", () => {
      const card = {
        ...createSM2Card(testCardId, testDeckId),
        repetitions: 1,
        interval: 1,
        easeFactor: 2.6,
      };
      const reviewTime = new Date("2024-01-02T10:00:00Z");

      const result = calculateNextReview(card, 4, reviewTime);

      expect(result.updatedCard.repetitions).toBe(2);
      expect(result.updatedCard.interval).toBe(6);
      expect(result.nextReview).toEqual(new Date("2024-01-08T10:00:00Z"));
    });

    it("should handle third+ successful review with ease factor", () => {
      const card = {
        ...createSM2Card(testCardId, testDeckId),
        repetitions: 2,
        interval: 6,
        easeFactor: 2.6,
      };
      const reviewTime = new Date("2024-01-08T10:00:00Z");

      const result = calculateNextReview(card, 3, reviewTime);

      expect(result.updatedCard.repetitions).toBe(3);
      expect(result.updatedCard.interval).toBe(Math.round(6 * 2.5)); // 15 days
      expect(result.nextReview).toEqual(new Date("2024-01-23T10:00:00Z"));
    });

    it("should reset interval on failed review (quality < 3)", () => {
      const card = {
        ...createSM2Card(testCardId, testDeckId),
        repetitions: 3,
        interval: 15,
        easeFactor: 2.6,
      };
      const reviewTime = new Date("2024-01-23T10:00:00Z");

      const result = calculateNextReview(card, 2, reviewTime);

      expect(result.updatedCard.repetitions).toBe(0);
      expect(result.updatedCard.interval).toBe(1);
      expect(result.updatedCard.easeFactor).toBeLessThan(2.6); // Ease factor decreases
      expect(result.nextReview).toEqual(new Date("2024-01-24T10:00:00Z"));
    });

    it("should not allow ease factor below minimum", () => {
      const card = {
        ...createSM2Card(testCardId, testDeckId),
        repetitions: 1,
        interval: 1,
        easeFactor: 1.4,
      };
      const reviewTime = new Date("2024-01-02T10:00:00Z");

      const result = calculateNextReview(card, 0, reviewTime);

      expect(result.updatedCard.easeFactor).toBeGreaterThanOrEqual(1.3);
    });
  });

  describe("getDueCards", () => {
    it("should return cards that are due for review", () => {
      const now = new Date("2024-01-10T10:00:00Z");
      const cards = {
        "card-1": {
          ...createSM2Card("card-1", testDeckId),
          nextReview: new Date("2024-01-09T10:00:00Z"), // Past
        },
        "card-2": {
          ...createSM2Card("card-2", testDeckId),
          nextReview: new Date("2024-01-10T10:00:00Z"), // Now
        },
        "card-3": {
          ...createSM2Card("card-3", testDeckId),
          nextReview: new Date("2024-01-11T10:00:00Z"), // Future
        },
        "card-4": {
          ...createSM2Card("card-4", testDeckId),
          nextReview: null, // New card
        },
      };

      const dueCards = getDueCards(cards, now);

      expect(dueCards).toEqual(["card-1", "card-2"]);
    });
  });

  describe("getNewCards", () => {
    it("should return cards that have never been reviewed", () => {
      const cards = {
        "card-1": {
          ...createSM2Card("card-1", testDeckId),
          nextReview: new Date("2024-01-09T10:00:00Z"),
          lastReview: new Date("2024-01-08T10:00:00Z"),
        },
        "card-2": {
          ...createSM2Card("card-2", testDeckId),
          nextReview: null,
          lastReview: null,
        },
        "card-3": {
          ...createSM2Card("card-3", testDeckId),
          nextReview: null,
          lastReview: new Date("2024-01-07T10:00:00Z"), // Reviewed but no next review
        },
      };

      const newCards = getNewCards(cards);

      expect(newCards).toEqual(["card-2"]);
    });
  });

  describe("getSchedulerState", () => {
    it("should return complete scheduler state", () => {
      const now = new Date("2024-01-10T10:00:00Z");
      const cards = {
        "card-1": {
          ...createSM2Card("card-1", testDeckId),
          nextReview: new Date("2024-01-09T10:00:00Z"),
        },
        "card-2": {
          ...createSM2Card("card-2", testDeckId),
          nextReview: null,
          lastReview: null,
        },
        "card-3": {
          ...createSM2Card("card-3", testDeckId),
          nextReview: new Date("2024-01-11T10:00:00Z"),
          interval: 2, // Learning card
        },
      };

      const state = getSchedulerState(cards, now);

      expect(state.dueCards).toEqual(["card-1"]);
      expect(state.newCards).toEqual(["card-2"]);
      expect(state.learningCards).toEqual(["card-3"]);
      expect(state.cards).toEqual(cards);
    });
  });

  describe("calculateCardStats", () => {
    it("should calculate statistics correctly", () => {
      const cards = {
        "card-1": {
          ...createSM2Card("card-1", testDeckId),
          easeFactor: 2.8,
        },
        "card-2": {
          ...createSM2Card("card-2", testDeckId),
          easeFactor: 2.4,
        },
        "card-3": {
          ...createSM2Card("card-3", testDeckId),
          easeFactor: 2.6,
        },
      };

      const stats = calculateCardStats(cards);

      expect(stats.totalCards).toBe(3);
      expect(stats.averageEaseFactor).toBeCloseTo(2.6);
    });

    it("should handle empty cards list", () => {
      const stats = calculateCardStats({});

      expect(stats.totalCards).toBe(0);
      expect(stats.averageEaseFactor).toBe(0);
    });
  });
});
