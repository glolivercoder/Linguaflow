import { test, expect } from "@playwright/test";

test.describe("Import Flow", () => {
  test("should import .apkg file and display decks", async ({ page }) => {
    // Navigate to the app
    await page.goto("/");

    // Verify initial state
    await expect(page.locator("text=Nenhum deck importado")).toBeVisible();

    // Create a mock .apkg file for testing
    const mockFile = new File(["mock apkg content"], "test-deck.apkg", { type: "application/zip" });

    // Upload the file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(mockFile);

    // Wait for import to complete (mock implementation)
    await expect(page.locator("text=Importando arquivo, aguarde...")).toBeVisible();

    // Verify deck appears in dashboard
    await expect(page.locator("text=Decks importados")).toBeVisible();
    await expect(page.locator("article.deck-card")).toHaveCount.greaterThan(0);
  });

  test("should handle import errors gracefully", async ({ page }) => {
    await page.goto("/");

    // Create an invalid file
    const invalidFile = new File(["invalid content"], "invalid.txt", { type: "text/plain" });

    // Upload the invalid file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(invalidFile);

    // Verify error message appears
    await expect(page.locator(".error")).toBeVisible();
    await expect(page.locator("text=Arquivo .apkg não informado")).toBeVisible();
  });

  test("should reset data successfully", async ({ page }) => {
    await page.goto("/");

    // First import a file
    const mockFile = new File(["mock apkg content"], "test-deck.apkg", { type: "application/zip" });
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(mockFile);

    // Wait for import
    await expect(page.locator("article.deck-card")).toHaveCount.greaterThan(0);

    // Click reset button
    await page.locator('button:has-text("Resetar Dados")').click();

    // Verify data is cleared
    await expect(page.locator("text=Nenhum deck importado")).toBeVisible();
    await expect(page.locator("article.deck-card")).toHaveCount(0);
  });
});
