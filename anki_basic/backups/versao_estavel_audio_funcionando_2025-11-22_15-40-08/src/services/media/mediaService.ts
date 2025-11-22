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
  onError?: (error: Error) => void,
  onCanPlay?: () => void,
  onEnded?: () => void
): HTMLAudioElement {
  console.log(`Criando elemento de áudio para: ${url}`);
  
  // Cria um novo elemento de áudio
  const audio = new Audio();
  
  // Configura o preload para melhorar a experiência do usuário
  audio.preload = "metadata";
  
  // Configura a origem do áudio
  audio.src = url;

  // Configura os manipuladores de eventos
  audio.addEventListener("error", (e) => {
    console.error("Erro no elemento de áudio:", e);
    const error = new Error(`Falha ao carregar áudio: ${url}`);
    console.error(error);
    onError?.(error);
  });

  audio.addEventListener("loadstart", () => {
    console.log(`Iniciando carregamento do áudio: ${url}`);
  });

  audio.addEventListener("canplay", () => {
    console.log(`Áudio pronto para reprodução: ${url}`);
    onCanPlay?.();
  });
  
  audio.addEventListener("ended", () => {
    console.log(`Reprodução do áudio concluída: ${url}`);
    onEnded?.();
  });
  
  audio.addEventListener("stalled", () => {
    console.warn(`Reprodução do áudio parou inesperadamente: ${url}`);
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
    
    console.log(`Iniciando reprodução de áudio: ${asset.name} (${url})`);

    // Clean up existing audio element
    if (this.activeElements.has(key)) {
      console.log(`Parando reprodução anterior de: ${asset.name}`);
      const existing = this.activeElements.get(key) as HTMLAudioElement;
      existing.pause();
      this.activeElements.delete(key);
    }

    return new Promise((resolve, reject) => {
      console.log(`Criando novo elemento de áudio para: ${asset.name}`);
      
      const onCanPlay = () => {
        console.log(`Áudio pronto para reprodução: ${asset.name}`);
        this.activeElements.set(key, audio);
        audio.play().catch((error) => {
          console.error(`Erro ao reproduzir áudio ${asset.name}:`, error);
          reject(error);
        });
      };
      
      const onEnded = () => {
        console.log(`Reprodução concluída: ${asset.name}`);
        this.activeElements.delete(key);
        resolve();
      };
      
      const onError = (error: Error) => {
        console.error(`Erro no áudio ${asset.name}:`, error);
        this.activeElements.delete(key);
        reject(error);
      };

      const audio = createAudioElement(url, onError, onCanPlay, onEnded);
      
      // Configura um timeout para evitar que a promessa fique pendente para sempre
      const timeout = setTimeout(() => {
        if (!audio.readyState) { // 0 = HAVE_NOTHING
          const error = new Error(`Timeout ao carregar áudio: ${asset.name}`);
          console.error(error);
          onError(error);
        }
      }, 10000); // 10 segundos de timeout
      
      // Limpa o timeout quando o áudio for carregado
      audio.addEventListener('canplay', () => clearTimeout(timeout), { once: true });
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
