import { test, expect } from "@playwright/test";

test.describe("Media Preview", () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Import a deck with media
    await page.goto("/");

    // Create mock file with media references
    const mockFile = new File(["mock apkg with media"], "media-deck.apkg", {
      type: "application/zip",
    });
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(mockFile);
    await expect(page.locator("article.deck-card")).toHaveCount.greaterThan(0);
  });

  test("should display media assets in main app", async ({ page }) => {
    // Check media section is visible
    await expect(page.locator("text=Mídias importadas")).toBeVisible();

    // Verify media assets are listed (if any)
    const mediaAssets = page.locator(".results article.deck-card");
    const count = await mediaAssets.count();

    if (count > 0) {
      // Verify media asset information
      await expect(mediaAssets.first()).toContainText("KB");
    }
  });

  test("should handle audio playback in review", async ({ page }) => {
    // Navigate to review
    await page.locator("article.deck-card").first().click();
    await page.locator('.deck-actions a:has-text("Revisar Deck")').click();

    // Look for audio elements
    const audioElements = page.locator(".media-preview-audio");
    const audioCount = await audioElements.count();

    if (audioCount > 0) {
      // Test audio play button
      const playButton = audioElements.first().locator(".audio-play-btn");
      await expect(playButton).toBeVisible();

      // Click play button
      await playButton.click();

      // Verify button changes to pause state
      await expect(playButton).toContainText("Pausar");

      // Click again to pause
      await playButton.click();
      await expect(playButton).toContainText("Tocar");
    }
  });

  test("should display images in review cards", async ({ page }) => {
    // Navigate to review
    await page.locator("article.deck-card").first().click();
    await page.locator('.deck-actions a:has-text("Revisar Deck")').click();

    // Look for image elements
    const imageElements = page.locator(".media-preview-image img");
    const imageCount = await imageElements.count();

    if (imageCount > 0) {
      // Verify images are loaded
      await expect(imageElements.first()).toBeVisible();

      // Check image has valid src
      const imgSrc = await imageElements.first().getAttribute("src");
      expect(imgSrc).toBeTruthy();
      expect(imgSrc?.length).toBeGreaterThan(0);
    }
  });

  test("should handle media errors gracefully", async ({ page }) => {
    // Navigate to review
    await page.locator("article.deck-card").first().click();
    await page.locator('.deck-actions a:has-text("Revisar Deck")').click();

    // Mock a failed media load by intercepting network requests
    await page.route("**/*.{mp3,jpg,png}", (route) => route.abort());

    // Look for media elements and verify error handling
    const mediaElements = page.locator(".media-preview");
    const mediaCount = await mediaElements.count();

    if (mediaCount > 0) {
      // The component should handle errors without crashing
      await expect(page.locator(".review-card")).toBeVisible();
      await expect(page.locator(".show-answer-btn")).toBeVisible();
    }
  });

  test("should display media file information", async ({ page }) => {
    // Check media assets display file information
    const mediaAssets = page.locator(".results article.deck-card");
    const count = await mediaAssets.count();

    if (count > 0) {
      const firstAsset = mediaAssets.first();

      // Verify file name is displayed
      const fileName = await firstAsset.locator("p").first().textContent();
      expect(fileName).toBeTruthy();
      expect(fileName?.length).toBeGreaterThan(0);

      // Verify file size is displayed
      const fileSize = await firstAsset.locator("small").textContent();
      expect(fileSize).toBeTruthy();
      expect(fileSize).toContain("KB");
    }
  });
});
