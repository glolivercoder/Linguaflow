import { test, expect } from "@playwright/test";

test.describe("Complete Application Flow", () => {
  test("should handle complete user journey from import to review", async ({ page }) => {
    // Step 1: Start with empty app
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Anki_Basic");
    await expect(page.locator("text=Nenhum deck importado")).toBeVisible();

    // Step 2: Import a deck
    const mockFile = new File(["mock apkg with media and cards"], "complete-test.apkg", {
      type: "application/zip",
    });
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(mockFile);

    // Wait for import completion
    await expect(page.locator("text=Importando arquivo, aguarde...")).toBeVisible();
    await expect(page.locator("article.deck-card")).toHaveCount.greaterThan(0);

    // Step 3: Verify dashboard shows imported data
    await expect(page.locator("text=Decks importados")).toBeVisible();
    await expect(page.locator("text=para revisar")).toBeVisible();
    await expect(page.locator("text=Mídias importadas")).toBeVisible();

    // Step 4: Navigate to deck detail
    const firstDeck = page.locator("article.deck-card").first();
    const deckName = await firstDeck.locator("h3").textContent();
    await firstDeck.click();

    await expect(page.locator("h2")).toContainText(deckName || "");
    await expect(page.locator(".deck-actions")).toBeVisible();

    // Step 5: Start review session
    await page.locator('.deck-actions a:has-text("Revisar Deck")').click();

    // Step 6: Complete multiple reviews with different ratings
    const reviewRounds = 3;
    for (let i = 0; i < reviewRounds; i++) {
      // Show answer
      await expect(page.locator(".show-answer-btn")).toBeVisible();
      await page.locator(".show-answer-btn").click();
      await expect(page.locator(".card-back")).toBeVisible();

      // Rate card with different quality based on round
      const qualityRating = i % 4; // Cycle through 0,1,2,3
      await page.locator(`.quality-btn.quality-${qualityRating}`).click();

      // Brief pause to allow state updates
      await page.waitForTimeout(100);
    }

    // Step 7: Navigate back to dashboard
    await page.locator('a:has-text("← Voltar")').click();
    await expect(page.locator("text=Decks importados")).toBeVisible();

    // Step 8: Verify data persistence
    await expect(page.locator("article.deck-card")).toHaveCount.greaterThan(0);

    // Step 9: Test reset functionality
    await page.locator('button:has-text("Resetar Dados")').click();
    await expect(page.locator("text=Nenhum deck importado")).toBeVisible();
    await expect(page.locator("article.deck-card")).toHaveCount(0);
  });

  test("should handle error scenarios gracefully", async ({ page }) => {
    await page.goto("/");

    // Test invalid file import
    const invalidFile = new File(["invalid content"], "invalid.txt", { type: "text/plain" });
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(invalidFile);

    await expect(page.locator(".error")).toBeVisible();

    // Clear error and try again
    await page.reload();
    await expect(page.locator("h1")).toContainText("Anki_Basic");

    // Import valid file
    const validFile = new File(["mock apkg content"], "valid.apkg", { type: "application/zip" });
    await fileInput.setInputFiles(validFile);
    await expect(page.locator("article.deck-card")).toHaveCount.greaterThan(0);
  });

  test("should maintain responsive design across viewports", async ({ page }) => {
    // Import deck first
    await page.goto("/");
    const mockFile = new File(["mock apkg content"], "responsive-test.apkg", {
      type: "application/zip",
    });
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(mockFile);
    await expect(page.locator("article.deck-card")).toHaveCount.greaterThan(0);

    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080 }, // Desktop
      { width: 768, height: 1024 }, // Tablet
      { width: 375, height: 667 }, // Mobile
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);

      // Verify dashboard is usable
      await expect(page.locator("h1")).toContainText("Anki_Basic");
      await expect(page.locator("article.deck-card")).toBeVisible();

      // Navigate to review
      await page.locator("article.deck-card").first().click();
      await expect(page.locator(".deck-actions")).toBeVisible();

      if (await page.locator('.deck-actions a:has-text("Revisar Deck")').isVisible()) {
        await page.locator('.deck-actions a:has-text("Revisar Deck")').click();
        await expect(page.locator(".review-card")).toBeVisible();
        await expect(page.locator(".show-answer-btn")).toBeVisible();
        await page.locator('a:has-text("← Voltar")').click();
      }

      await page.locator('a:has-text("← Voltar")').click();
    }
  });

  test("should handle keyboard navigation", async ({ page }) => {
    // Import deck
    await page.goto("/");
    const mockFile = new File(["mock apkg content"], "keyboard-test.apkg", {
      type: "application/zip",
    });
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(mockFile);
    await expect(page.locator("article.deck-card")).toHaveCount.greaterThan(0);

    // Navigate to review
    await page.locator("article.deck-card").first().click();
    await page.locator('.deck-actions a:has-text("Revisar Deck")').click();

    // Test keyboard navigation in review
    await page.keyboard.press("Space"); // Should trigger show answer or similar
    await page.waitForTimeout(500);

    // Try number keys for quality rating
    await page.keyboard.press("3"); // Should rate as "Good"
    await page.waitForTimeout(500);

    // Verify we can still navigate
    await expect(page.locator(".review-card")).toBeVisible();
  });

  test("should handle concurrent operations", async ({ page }) => {
    await page.goto("/");

    // Try multiple rapid operations
    const mockFile = new File(["mock apkg content"], "concurrent-test.apkg", {
      type: "application/zip",
    });
    const fileInput = page.locator('input[type="file"]');

    // Rapid file uploads (should handle gracefully)
    await fileInput.setInputFiles(mockFile);
    await page.waitForTimeout(100);

    // Try to navigate while importing
    const deckCards = page.locator("article.deck-card");
    if ((await deckCards.count()) > 0) {
      await deckCards.first().click();
      await page.waitForTimeout(100);
      await page.locator('a:has-text("← Voltar")').click();
    }

    // Verify app is still functional
    await expect(page.locator("h1")).toContainText("Anki_Basic");
  });
});
