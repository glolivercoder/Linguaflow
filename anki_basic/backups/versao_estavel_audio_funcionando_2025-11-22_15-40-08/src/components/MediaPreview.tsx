import { useState, useRef, useEffect } from "react";

import type { MediaAsset } from "@services/anki/types";
import type { MediaPreview } from "@services/media/mediaService";
import {
  createMediaPreview,
  getOptimalMediaUrl,
  createAudioElement,
} from "@services/media/mediaService";

interface MediaPreviewProps {
  asset: MediaAsset;
  className?: string;
  onError?: (error: Error) => void;
}

export function MediaPreviewComponent({ asset, className, onError }: MediaPreviewProps) {
  const [preview, setPreview] = useState<MediaPreview | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const mediaPreview = createMediaPreview(asset);
    setPreview(mediaPreview);

    return () => {
      // Clean up audio element on unmount
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [asset]);

  const handlePlayAudio = async () => {
    if (!preview || preview.type !== "audio") return;

    try {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          await audioRef.current.play();
          setIsPlaying(true);
        }
      } else {
        const url = getOptimalMediaUrl(asset);
        const audio = createAudioElement(url, onError);

        audio.addEventListener("ended", () => {
          setIsPlaying(false);
        });

        audio.addEventListener("play", () => {
          setIsPlaying(true);
        });

        audio.addEventListener("pause", () => {
          setIsPlaying(false);
        });

        audioRef.current = audio;
        await audio.play();
      }
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error("Falha ao reproduzir áudio"));
      setIsPlaying(false);
    }
  };

  if (!preview) {
    return (
      <div className={`media-preview loading ${className || ""}`}>
        <span>Carregando mídia...</span>
      </div>
    );
  }

  const renderContent = () => {
    switch (preview.type) {
      case "image":
        return (
          <div className="media-preview-image">
            <img
              src={preview.url}
              alt={preview.name}
              onError={(e) => {
                const error = new Error(`Falha ao carregar imagem: ${preview.name}`);
                onError?.(error);
              }}
              style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "8px" }}
            />
          </div>
        );

      case "audio":
        return (
          <div className="media-preview-audio">
            <div className="audio-info">
              <span className="audio-name">{preview.name}</span>
              <span className="audio-size">{(preview.size / 1024).toFixed(1)} KB</span>
            </div>
            <button
              type="button"
              className={`audio-play-btn ${isPlaying ? "playing" : ""}`}
              onClick={handlePlayAudio}
              disabled={!preview.url}
            >
              {isPlaying ? "⏸️ Pausar" : "▶️ Tocar"}
            </button>
          </div>
        );

      case "video":
        return (
          <div className="media-preview-video">
            <video
              controls
              style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "8px" }}
              onError={(e) => {
                const error = new Error(`Falha ao carregar vídeo: ${preview.name}`);
                onError?.(error);
              }}
            >
              <source src={preview.url} />
              Seu navegador não suporta reprodução de vídeo.
            </video>
          </div>
        );

      default:
        return (
          <div className="media-preview-unknown">
            <span>📄 {preview.name}</span>
            <span className="media-size">{(preview.size / 1024).toFixed(1)} KB</span>
          </div>
        );
    }
  };

  return (
    <div className={`media-preview ${preview.type} ${className || ""}`}>{renderContent()}</div>
  );
}
