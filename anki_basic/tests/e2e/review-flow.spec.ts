import { test, expect } from "@playwright/test";

test.describe("Review Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Import a deck first
    await page.goto("/");
    const mockFile = new File(["mock apkg content"], "test-deck.apkg", { type: "application/zip" });
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(mockFile);
    await expect(page.locator("article.deck-card")).toHaveCount.greaterThan(0);
  });

  test("should navigate to deck detail and review", async ({ page }) => {
    // Click on first deck
    await page.locator("article.deck-card").first().click();

    // Verify deck detail page
    await expect(page.locator("h2")).toContainText("Deck:");
    await expect(page.locator('.deck-actions a:has-text("Revisar Deck")')).toBeVisible();

    // Click review button
    await page.locator('.deck-actions a:has-text("Revisar Deck")').click();

    // Verify review page loads
    await expect(page.locator("h2")).toContainText("Revisão:");
    await expect(page.locator(".review-card")).toBeVisible();
    await expect(page.locator(".card-front")).toBeVisible();
  });

  test("should complete a review session", async ({ page }) => {
    // Navigate to review
    await page.locator("article.deck-card").first().click();
    await page.locator('.deck-actions a:has-text("Revisar Deck")').click();

    // Show answer
    await page.locator(".show-answer-btn").click();
    await expect(page.locator(".card-back")).toBeVisible();

    // Rate the card
    await page.locator(".quality-btn.quality-3").click();

    // Verify next card or completion
    const currentCardText = await page.locator(".card-front").textContent();
    expect(currentCardText).toBeTruthy();
  });

  test("should handle empty deck gracefully", async ({ page }) => {
    // Navigate to a deck (assuming first deck might be empty in some test scenarios)
    await page.locator("article.deck-card").first().click();

    // If review button is not available, deck might be empty
    const reviewButton = page.locator('.deck-actions a:has-text("Revisar Deck")');
    if (!(await reviewButton.isVisible())) {
      // Navigate directly to review URL to test empty case
      const deckId = "test-deck-id"; // This would need to match actual deck ID
      await page.goto(`/review/${deckId}`);

      // Verify empty deck message
      await expect(page.locator("text=Nenhum cartão para revisar no momento")).toBeVisible();
    }
  });

  test("should navigate back to dashboard", async ({ page }) => {
    // Navigate to review
    await page.locator("article.deck-card").first().click();
    await page.locator('.deck-actions a:has-text("Revisar Deck")').click();

    // Click back button
    await page.locator('a:has-text("← Voltar")').click();

    // Verify back on dashboard
    await expect(page.locator("h1")).toContainText("Anki_Basic");
    await expect(page.locator("text=Decks importados")).toBeVisible();
  });
});
