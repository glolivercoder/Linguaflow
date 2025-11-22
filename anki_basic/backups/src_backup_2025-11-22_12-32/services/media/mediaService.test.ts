import {
  getMediaType,
  createMediaPreview,
  getProxyMediaUrl,
  shouldUseProxy,
  getOptimalMediaUrl,
  MediaManager,
} from "./mediaService";
import type { MediaAsset } from "@services/anki/types";

// Mock the ensureProxyConfig function
jest.mock("@api/config", () => ({
  ensureProxyConfig: jest.fn(() => ({
    baseUrl: "http://localhost:3001",
    mediaBaseUrl: "http://localhost:3001/media",
  })),
}));

describe("MediaService", () => {
  const mockAsset: MediaAsset = {
    name: "test-image.jpg",
    size: 1024,
    blob: new Blob(["test"], { type: "image/jpeg" }),
    url: "blob:test-url",
    revokeUrl: jest.fn(),
  };

  describe("getMediaType", () => {
    it("should identify image files correctly", () => {
      expect(getMediaType("test.jpg")).toBe("image");
      expect(getMediaType("photo.png")).toBe("image");
      expect(getMediaType("graphic.webp")).toBe("image");
      expect(getMediaType("vector.svg")).toBe("image");
    });

    it("should identify audio files correctly", () => {
      expect(getMediaType("sound.mp3")).toBe("audio");
      expect(getMediaType("music.wav")).toBe("audio");
      expect(getMediaType("voice.ogg")).toBe("audio");
      expect(getMediaType("track.aac")).toBe("audio");
    });

    it("should identify video files correctly", () => {
      expect(getMediaType("movie.mp4")).toBe("video");
      expect(getMediaType("clip.webm")).toBe("video");
      expect(getMediaType("video.avi")).toBe("video");
    });

    it("should return unknown for unsupported formats", () => {
      expect(getMediaType("document.pdf")).toBe("unknown");
      expect(getMediaType("file.txt")).toBe("unknown");
      expect(getMediaType("no-extension")).toBe("unknown");
    });

    it("should handle case insensitive extensions", () => {
      expect(getMediaType("PHOTO.JPG")).toBe("image");
      expect(getMediaType("SOUND.MP3")).toBe("audio");
      expect(getMediaType("VIDEO.MP4")).toBe("video");
    });
  });

  describe("createMediaPreview", () => {
    it("should create a preview with correct properties", () => {
      const preview = createMediaPreview(mockAsset);

      expect(preview.name).toBe(mockAsset.name);
      expect(preview.size).toBe(mockAsset.size);
      expect(preview.url).toBe(mockAsset.url);
      expect(preview.type).toBe("image");
    });

    it("should use blob URL when no URL is provided", () => {
      const assetWithoutUrl = {
        ...mockAsset,
        url: undefined,
      };
      global.URL.createObjectURL = jest.fn(() => "blob:new-url");

      const preview = createMediaPreview(assetWithoutUrl);

      expect(URL.createObjectURL).toHaveBeenCalledWith(mockAsset.blob);
      expect(preview.url).toBe("blob:new-url");
    });
  });

  describe("getProxyMediaUrl", () => {
    it("should construct correct proxy URL", () => {
      const config = {
        baseUrl: "http://localhost:3001",
        mediaBaseUrl: "http://localhost:3001/media",
      };

      const url = getProxyMediaUrl("test-image.jpg", config);
      expect(url).toBe("http://localhost:3001/media/media/test-image.jpg");
    });

    it("should handle base URL without trailing slash", () => {
      const config = {
        baseUrl: "http://localhost:3001",
        mediaBaseUrl: "http://localhost:3001/media",
      };

      const url = getProxyMediaUrl("test-image.jpg", config);
      expect(url).toBe("http://localhost:3001/media/media/test-image.jpg");
    });

    it("should handle filename with leading slash", () => {
      const config = {
        baseUrl: "http://localhost:3001",
        mediaBaseUrl: "http://localhost:3001/media",
      };

      const url = getProxyMediaUrl("/test-image.jpg", config);
      expect(url).toBe("http://localhost:3001/media/media/test-image.jpg");
    });

    it("should use baseUrl when mediaBaseUrl is not provided", () => {
      const config = {
        baseUrl: "http://localhost:3001",
      };

      const url = getProxyMediaUrl("test-image.jpg", config);
      expect(url).toBe("http://localhost:3001/media/test-image.jpg");
    });
  });

  describe("shouldUseProxy", () => {
    it("should return true when proxy is available", () => {
      const result = shouldUseProxy(mockAsset);
      expect(result).toBe(true);
    });
  });

  describe("getOptimalMediaUrl", () => {
    it("should return proxy URL when proxy is available", () => {
      const url = getOptimalMediaUrl(mockAsset);
      expect(url).toContain("localhost:3001/media/media/test-image.jpg");
    });

    it("should return local blob URL when proxy is not available", () => {
      // Mock ensureProxyConfig to throw
      const { ensureProxyConfig } = require("@api/config");
      ensureProxyConfig.mockImplementation(() => {
        throw new Error("No proxy configured");
      });

      const url = getOptimalMediaUrl(mockAsset);
      expect(url).toBe(mockAsset.url);
    });
  });

  describe("MediaManager", () => {
    let mediaManager: MediaManager;

    beforeEach(() => {
      mediaManager = new MediaManager();
    });

    afterEach(() => {
      mediaManager.dispose();
    });

    it("should create preview from asset", () => {
      const preview = mediaManager.getPreview(mockAsset);

      expect(preview.name).toBe(mockAsset.name);
      expect(preview.type).toBe("image");
      expect(preview.size).toBe(mockAsset.size);
    });

    it("should handle audio playback errors", async () => {
      const audioAsset = {
        ...mockAsset,
        name: "test.mp3",
        blob: new Blob(["test"], { type: "audio/mpeg" }),
      };

      // Mock HTMLAudioElement to throw error
      global.Audio = jest.fn().mockImplementation(() => ({
        addEventListener: jest.fn(),
        src: "",
        play: jest.fn().mockRejectedValue(new Error("Playback failed")),
      })) as any;

      await expect(mediaManager.playAudio(audioAsset)).rejects.toThrow("Playback failed");
    });

    it("should clean up resources on dispose", () => {
      const mockAudioElement = {
        pause: jest.fn(),
        currentTime: 0,
      };

      // Simulate an active audio element
      mediaManager["activeElements"].set("audio_test.mp3", mockAudioElement as any);

      mediaManager.dispose();

      expect(mockAudioElement.pause).toHaveBeenCalled();
      expect(mediaManager["activeElements"].size).toBe(0);
    });
  });
});
