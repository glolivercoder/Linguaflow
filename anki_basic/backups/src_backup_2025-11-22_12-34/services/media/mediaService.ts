/**
 * Media service for handling audio/image assets from Anki packages
 * Integrates with proxy for external media fetching and local blob management
 */

import { ensureProxyConfig } from "@api/config";
import type { MediaAsset } from "@services/anki/types";

export interface MediaPreview {
  url: string;
  type: "image" | "audio" | "video" | "unknown";
  size: number;
  name: string;
}

export interface MediaProxyConfig {
  baseUrl: string;
  mediaBaseUrl?: string;
}

/**
 * Determine media type from file extension
 */
export function getMediaType(filename: string): MediaPreview["type"] {
  const extension = filename.split(".").pop()?.toLowerCase();

  if (!extension) return "unknown";

  const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"];
  const audioExtensions = ["mp3", "wav", "ogg", "aac", "m4a", "flac", "webm"];
  const videoExtensions = ["mp4", "webm", "ogg", "avi", "mov"];

  if (imageExtensions.includes(extension)) return "image";
  if (audioExtensions.includes(extension)) return "audio";
  if (videoExtensions.includes(extension)) return "video";

  return "unknown";
}

/**
 * Create a media preview object from a MediaAsset
 */
export function createMediaPreview(asset: MediaAsset): MediaPreview {
  const url = asset.url || URL.createObjectURL(asset.blob);
  const type = getMediaType(asset.name);

  return {
    url,
    type,
    size: asset.size,
    name: asset.name,
  };
}

/**
 * Get proxy URL for external media fetching
 */
export function getProxyMediaUrl(filename: string, config?: MediaProxyConfig): string {
  const proxyConfig = config || ensureProxyConfig();
  const baseUrl = proxyConfig.mediaBaseUrl || proxyConfig.baseUrl;

  // Ensure URL ends with / and remove leading / from filename
  const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const cleanFilename = filename.startsWith("/") ? filename.slice(1) : filename;

  return `${cleanBaseUrl}media/${cleanFilename}`;
}

/**
 * Check if media should be fetched via proxy instead of using local blob
 */
export function shouldUseProxy(asset: MediaAsset, proxyConfig?: MediaProxyConfig): boolean {
  // If we have a local blob, NEVER use proxy
  if (asset.blob || asset.url?.startsWith("blob:")) {
    return false;
  }

  try {
    ensureProxyConfig();
    return true; // Always prefer proxy when available AND no local blob
  } catch {
    return false; // No proxy configured
  }
}

/**
 * Get optimal media URL (proxy or local blob)
 */
export function getOptimalMediaUrl(asset: MediaAsset, proxyConfig?: MediaProxyConfig): string {
  if (shouldUseProxy(asset, proxyConfig)) {
    return getProxyMediaUrl(asset.name, proxyConfig);
  }

  return asset.url || URL.createObjectURL(asset.blob);
}

/**
 * Create an audio element with proper error handling
 */
export function createAudioElement(
  url: string,
  onError?: (error: Error) => void
): HTMLAudioElement {
  const audio = new Audio(url);

  audio.addEventListener("error", (e) => {
    const error = new Error(`Failed to load audio: ${url}`);
    onError?.(error);
  });

  audio.addEventListener("loadstart", () => {
    console.log(`Loading audio: ${url}`);
  });

  audio.addEventListener("canplay", () => {
    console.log(`Audio ready to play: ${url}`);
  });

  return audio;
}

/**
 * Create an image element with proper error handling
 */
export function createImageElement(
  url: string,
  onError?: (error: Error) => void
): HTMLImageElement {
  const img = new Image();

  img.addEventListener("error", (e) => {
    const error = new Error(`Failed to load image: ${url}`);
    onError?.(error);
  });

  img.addEventListener("load", () => {
    console.log(`Image loaded: ${url}`);
  });

  img.src = url;
  return img;
}

/**
 * Media asset manager class for handling multiple assets
 */
export class MediaManager {
  private activeElements: Map<string, HTMLAudioElement | HTMLImageElement> = new Map();
  private proxyConfig?: MediaProxyConfig;

  constructor(proxyConfig?: MediaProxyConfig) {
    this.proxyConfig = proxyConfig;
  }

  /**
   * Get preview for a media asset
   */
  getPreview(asset: MediaAsset): MediaPreview {
    return createMediaPreview(asset);
  }

  /**
   * Play audio asset with error handling
   */
  async playAudio(asset: MediaAsset): Promise<void> {
    const url = getOptimalMediaUrl(asset, this.proxyConfig);
    const key = `audio_${asset.name}`;

    // Clean up existing audio element
    if (this.activeElements.has(key)) {
      const existing = this.activeElements.get(key) as HTMLAudioElement;
      existing.pause();
      this.activeElements.delete(key);
    }

    return new Promise((resolve, reject) => {
      const audio = createAudioElement(url, reject);

      audio.addEventListener("ended", () => {
        this.activeElements.delete(key);
        resolve();
      });

      audio.addEventListener("canplay", () => {
        this.activeElements.set(key, audio);
        audio.play().catch(reject);
      });

      // Set initial source
      audio.src = url;
    });
  }

  /**
   * Stop all active media elements
   */
  stopAll(): void {
    this.activeElements.forEach((element) => {
      if (element instanceof HTMLAudioElement) {
        element.pause();
        element.currentTime = 0;
      }
    });
    this.activeElements.clear();
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stopAll();
  }
}
