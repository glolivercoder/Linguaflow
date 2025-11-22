import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

import { useAppStore } from "@store/appStore";
import { useImportStore } from "@store/importStore";
import { MediaPreviewComponent } from "@components/MediaPreview";

export function Review() {
  const { deckId } = useParams();
  const deck = useAppStore((state) => (deckId ? state.getDeckById(deckId) : undefined));
  const schedulerState = useAppStore((state) => state.schedulerState);
  const reviewCard = useAppStore((state) => state.reviewCard);
  const getCardById = useAppStore((state) => state.getCardById);
  const autoPlayAudio = useAppStore((state) => state.autoPlayAudio);
  const mediaAssets = useImportStore((state) => state.mediaAssets);

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  // Função simplificada para encontrar ativos de mídia
  const getMediaAsset = (filename: string) => {
    if (!filename) return null;

    // Remove qualquer diretório do caminho do arquivo
    const cleanFilename = filename.split(/[\\/]/).pop() || "";

    // Tenta encontrar uma correspondência exata ou por terminação
    const asset = mediaAssets.find((asset) => {
      const assetName = asset.name.split(/[\\/]/).pop() || "";
      return (
        assetName === cleanFilename ||
        assetName.endsWith(cleanFilename) ||
        cleanFilename.endsWith(assetName)
      );
    });

    if (!asset) {
      console.warn("Nenhum ativo de mídia encontrado para:", cleanFilename);
      console.log(
        "Ativos de mídia disponíveis:",
        mediaAssets.map((a) => a.name)
      );
    } else {
      console.log("Ativo de mídia encontrado:", asset.name, "Tipo:", asset.blob?.type);
    }

    return asset || null;
  };

  const renderCardContent = (content?: string, mediaRefs: string[] = []) => {
    if (!content) return "Sem conteúdo";

    let processedContent = content;
    const audioElements: React.ReactElement[] = [];

    // Processa as referências de mídia
    mediaRefs.forEach((ref, index) => {
      const asset = getMediaAsset(ref);
      if (!asset) return;

      // Para áudios, adiciona um player personalizado
      if (asset.blob.type.startsWith("audio/")) {
        const audioId = `audio-${Date.now()}-${index}`;

        // Substitui a referência [sound:...] por um marcador único
        processedContent = processedContent.replace(
          new RegExp(`\\[sound:${ref.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\]`, "g"),
          `[AUDIO:${audioId}]`
        );

        // Adiciona o player de áudio personalizado
        audioElements.push(
          <div key={audioId} className="audio-player">
            <audio
              id={audioId}
              controls
              preload="metadata"
              onError={(e) => console.error("Erro ao carregar áudio:", e)}
              style={{ width: "100%" }}
            >
              <source src={asset.url} type={asset.blob.type} />
              Seu navegador não suporta o elemento de áudio.
            </audio>
            <div className="audio-label">🔊 {ref}</div>
          </div>
        );
      }
    });

    // Processa o conteúdo para substituir os marcadores de áudio
    const parts = processedContent.split(/(\[AUDIO:[^\]]+\])/);

    const contentWithAudio = parts.map((part, i) => {
      const match = part.match(/^\[AUDIO:(.+)\]$/);
      if (match) {
        const audioId = match[1];
        return (
          <div key={`audio-${i}`} className="audio-container">
            {audioElements.find((el) => el.key === audioId) || null}
          </div>
        );
      }
      return <div key={`text-${i}`} dangerouslySetInnerHTML={{ __html: part }} />;
    });

    // Adiciona mídias não processadas (imagens, vídeos, etc.)
    const otherMedia = mediaRefs
      .map((ref) => getMediaAsset(ref))
      .filter((asset) => asset && !asset?.blob.type.startsWith("audio/"))
      .map((asset, i) => (
        <MediaPreviewComponent
          key={`media-${i}`}
          asset={asset!}
          onError={(error) => console.error("Media error:", error)}
        />
      ));

    return (
      <div className="card-content">
        <div className="card-text">{contentWithAudio}</div>
        {otherMedia.length > 0 && <div className="card-media">{otherMedia}</div>}
      </div>
    );
  };

  // Resto do componente...
  return (
    <div className="review-container">
      {/* Cabeçalho e navegação */}
      <header className="section-header">
        <div>
          <h2>Revisão: {deck?.name || "Carregando..."}</h2>
          <p>
            Cartão {currentCardIndex + 1} de {deck?.cards.length || 0}
          </p>
        </div>
        <Link to="/">← Voltar</Link>
      </header>

      {/* Conteúdo do cartão */}
      {deck?.cards[currentCardIndex] && (
        <div className="review-card">
          <div className="card-front">
            <h3>Frente</h3>
            {renderCardContent(deck.cards[currentCardIndex].front, [])}
          </div>

          {showAnswer && (
            <div className="card-back">
              <h3>Verso</h3>
              {renderCardContent(deck.cards[currentCardIndex].back, [])}
            </div>
          )}

          <div className="review-actions">
            {!showAnswer ? (
              <button type="button" className="show-answer-btn" onClick={() => setShowAnswer(true)}>
                Mostrar Resposta
              </button>
            ) : (
              <div className="quality-buttons">
                <p>Como foi esta revisão?</p>
                <div className="button-group">
                  {[0, 1, 2, 3, 4, 5].map((quality) => (
                    <button
                      key={quality}
                      type="button"
                      className={`quality-btn quality-${quality}`}
                      onClick={() => {
                        reviewCard(deck.cards[currentCardIndex].id, quality);
                        setShowAnswer(false);
                        setCurrentCardIndex((prev) => (prev + 1) % deck.cards.length);
                      }}
                    >
                      {quality} -{" "}
                      {
                        ["Erro grave", "Erro", "Dificuldade", "Bom", "Fácil", "Muito fácil"][
                          quality
                        ]
                      }
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
