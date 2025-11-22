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
    console.log(
      "MediaPreview: Criando preview para o ativo:",
      asset.name,
      "Tipo:",
      asset.blob?.type
    );

    try {
      const mediaPreview = createMediaPreview(asset);
      console.log("MediaPreview: Preview criado com sucesso:", mediaPreview);
      setPreview(mediaPreview);
    } catch (error) {
      console.error("MediaPreview: Erro ao criar preview:", error);
      onError?.(error instanceof Error ? error : new Error("Erro ao processar mídia"));
    }

    return () => {
      // Clean up audio element on unmount
      if (audioRef.current) {
        console.log("MediaPreview: Limpando recurso de áudio");
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [asset, onError]);

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
    console.log("MediaPreview: Nenhum preview disponível para o ativo:", asset.name);
    return (
      <div className={`media-preview loading ${className || ""}`}>
        <span>Carregando mídia: {asset.name}</span>
      </div>
    );
  }

  const renderContent = () => {
    console.log("MediaPreview: Renderizando conteúdo do tipo:", preview.type, "URL:", preview.url);

    switch (preview.type) {
      case "image":
        console.log("MediaPreview: Renderizando imagem:", preview.name);
        return (
          <div className="media-preview image">
            <div className="image-container">
              <img
                src={preview.url}
                alt={preview.name}
                onLoad={() => console.log("Imagem carregada com sucesso:", preview.name)}
                onError={(e) => {
                  console.error("Falha ao carregar imagem:", preview.name, "URL:", preview.url);
                  const error = new Error(`Falha ao carregar imagem: ${preview.name}`);
                  onError?.(error);

                  // Tenta carregar a URL diretamente como fallback
                  const img = e.target as HTMLImageElement;
                  if (preview.url.startsWith("blob:")) {
                    console.log("Tentando carregar a imagem diretamente do blob");
                    const directUrl = URL.createObjectURL(asset.blob);
                    img.onerror = null; // Evita loops infinitos
                    img.src = directUrl;
                  }
                }}
                style={{
                  maxWidth: "100%",
                  maxHeight: "300px",
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  display: "block",
                  margin: "0 auto",
                }}
              />
            </div>
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
