import { test as setup, expect } from "@playwright/test";

setup("prepare test environment", async ({ page }) => {
  // Navigate to the app
  await page.goto("/");

  // Wait for the app to load
  await expect(page.locator("h1")).toContainText("Anki_Basic");

  // Clear any existing data by clicking reset if present
  const resetButton = page.locator('button:has-text("Resetar Dados")');
  if (await resetButton.isVisible()) {
    await resetButton.click();
    await expect(page.locator("text=Nenhum deck importado")).toBeVisible();
  }

  console.log("✅ Test environment prepared");
});
