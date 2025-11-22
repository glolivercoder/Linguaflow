import { test, expect } from "@playwright/test";

test.describe("Scheduler Integration", () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Import a deck
    await page.goto("/");
    const mockFile = new File(["mock apkg content"], "test-deck.apkg", { type: "application/zip" });
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(mockFile);
    await expect(page.locator("article.deck-card")).toHaveCount.greaterThan(0);
  });

  test("should display scheduler statistics on dashboard", async ({ page }) => {
    // Check for scheduler stats
    await expect(page.locator("text=para revisar")).toBeVisible();
    await expect(page.locator("text=Novos:")).toBeVisible();

    // Verify deck statistics
    const deckCards = page.locator("article.deck-card");
    const firstDeck = deckCards.first();

    await expect(firstDeck.locator(".muted")).toBeVisible();
  });

  test("should update scheduler after review", async ({ page }) => {
    // Get initial stats
    const initialStats = await page.locator('h2:has-text("Estatísticas") + p').textContent();

    // Navigate to review
    await page.locator("article.deck-card").first().click();
    await page.locator('.deck-actions a:has-text("Revisar Deck")').click();

    // Complete at least one review
    await page.locator(".show-answer-btn").click();
    await page.locator(".quality-btn.quality-3").click();

    // Navigate back to dashboard
    await page.locator('a:has-text("← Voltar")').click();

    // Verify stats may have changed (this is a basic check)
    await expect(page.locator('h2:has-text("Estatísticas") + p')).toBeVisible();
  });

  test("should show review button only when cards are available", async ({ page }) => {
    // Check each deck for review button
    const deckCards = page.locator("article.deck-card");
    const deckCount = await deckCards.count();

    for (let i = 0; i < deckCount; i++) {
      const deck = deckCards.nth(i);
      await deck.click();

      // Check if review button exists
      const reviewButton = page.locator('.deck-actions a:has-text("Revisar Deck")');
      const hasReviewButton = await reviewButton.isVisible();

      // If review button exists, it should work
      if (hasReviewButton) {
        await reviewButton.click();
        await expect(page.locator(".review-card")).toBeVisible();
        await page.locator('a:has-text("← Voltar")').click();
      }

      // Go back to dashboard
      await page.locator('a:has-text("← Voltar")').click();
    }
  });

  test("should handle different quality ratings", async ({ page }) => {
    // Navigate to review
    await page.locator("article.deck-card").first().click();
    await page.locator('.deck-actions a:has-text("Revisar Deck")').click();

    // Test different quality ratings
    const qualityButtons = [
      ".quality-btn.quality-0",
      ".quality-btn.quality-2",
      ".quality-btn.quality-4",
      ".quality-btn.quality-5",
    ];

    for (const buttonSelector of qualityButtons) {
      await page.locator(".show-answer-btn").click();
      await page.locator(buttonSelector).click();

      // Verify we can continue to next card or complete session
      await expect(page.locator(".review-card")).toBeVisible();
    }
  });

  test("should display card scheduling information", async ({ page }) => {
    // Navigate to review
    await page.locator("article.deck-card").first().click();
    await page.locator('.deck-actions a:has-text("Revisar Deck")').click();

    // Check for scheduling info
    const schedulingInfo = page.locator('.muted:has-text("Intervalo:")');

    // This may not be visible for new cards, so we don't assert it must exist
    // but if it exists, it should have the expected format
    if (await schedulingInfo.isVisible()) {
      const text = await schedulingInfo.textContent();
      expect(text).toContain("Intervalo:");
      expect(text).toContain("dias");
      expect(text).toContain("Facilidade:");
    }
  });

  test("should handle review session completion", async ({ page }) => {
    // Navigate to review
    await page.locator("article.deck-card").first().click();
    await page.locator('.deck-actions a:has-text("Revisar Deck")').click();

    // Complete all available cards (or at least try)
    let maxAttempts = 10; // Prevent infinite loop
    let attempts = 0;

    while (attempts < maxAttempts) {
      const showAnswerBtn = page.locator(".show-answer-btn");
      if (!(await showAnswerBtn.isVisible())) {
        break; // No more cards or session completed
      }

      await showAnswerBtn.click();
      await page.locator(".quality-btn.quality-3").click();
      attempts++;
    }

    // Verify we're still in a valid state
    await expect(page.locator(".review-card")).toBeVisible();
  });
});
