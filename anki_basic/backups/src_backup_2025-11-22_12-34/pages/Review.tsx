import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

import { useAppStore } from "@store/appStore";
import { useImportStore } from "@store/importStore";
import { MediaPreviewComponent } from "@components/MediaPreview";

export function Review() {
  // ✅ All hooks called at the top level before any conditional returns
  const { deckId } = useParams();
  const deck = useAppStore((state) => (deckId ? state.getDeckById(deckId) : undefined));
  const schedulerState = useAppStore((state) => state.schedulerState);
  const reviewCard = useAppStore((state) => state.reviewCard);
  const getCardById = useAppStore((state) => state.getCardById);
  const autoPlayAudio = useAppStore((state) => state.autoPlayAudio);
  const mediaAssets = useImportStore((state) => state.mediaAssets);

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  // Auto-play effect
  useEffect(() => {
    if (autoPlayAudio) {
      const timer = setTimeout(() => {
        const audioElements = document.querySelectorAll(".review-card audio");
        audioElements.forEach((el) => {
          const audio = el as HTMLAudioElement;
          audio.play().catch((e) => console.warn("Auto-play blocked:", e));
        });
      }, 300); // Small delay to allow rendering
      return () => clearTimeout(timer);
    }
  }, [currentCardIndex, showAnswer, autoPlayAudio]);

  // Early return after all hooks are called
  if (!deck) {
    return (
      <section className="results">
        <p>
          Deck não encontrado. Volte para o <Link to="/">dashboard</Link>.
        </p>
      </section>
    );
  }

  // Filter cards for this deck that are due or new
  const deckCardIds = deck.cards.map((card) => card.id);
  const availableCards = [
    ...schedulerState.dueCards.filter((id) => deckCardIds.includes(id)),
    ...schedulerState.newCards.filter((id) => deckCardIds.includes(id)),
  ];

  if (availableCards.length === 0) {
    return (
      <section className="results">
        <header className="section-header">
          <div>
            <h2>Revisão: {deck.name}</h2>
            <p>Nenhum cartão para revisar no momento.</p>
          </div>
          <Link to="/">← Voltar</Link>
        </header>
      </section>
    );
  }

  const currentCardId = availableCards[currentCardIndex];
  const currentCard = deck.cards.find((card) => card.id === currentCardId);
  const schedulerCard = currentCardId ? getCardById(currentCardId) : undefined;

  // Extract media references from card content
  const extractMediaReferences = (content?: string): string[] => {
    if (!content) return [];

    // Match common media patterns: <img src="media_name">, [sound:media_name], etc.
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/g;
    const soundRegex = /\[sound:([^\]]+)\]/g;

    const mediaRefs: string[] = [];
    let match;

    while ((match = imgRegex.exec(content)) !== null) {
      mediaRefs.push(match[1]);
    }

    while ((match = soundRegex.exec(content)) !== null) {
      mediaRefs.push(match[1]);
    }

    return mediaRefs;
  };

  const frontMediaRefs = extractMediaReferences(currentCard?.front);
  const backMediaRefs = extractMediaReferences(currentCard?.back);

  // Find media assets for the references
  const getMediaAsset = (filename: string) => {
    return mediaAssets.find((asset) => asset.name === filename || asset.name.endsWith(filename));
  };

  const handleQualityRating = (quality: number) => {
    if (currentCardId) {
      reviewCard(currentCardId, quality);
      setShowAnswer(false);

      if (currentCardIndex < availableCards.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
      } else {
        // Review session completed
        setCurrentCardIndex(0);
      }
    }
  };

  const renderCardContent = (content?: string, mediaRefs: string[] = []) => {
    if (!content) return "Sem conteúdo";

    let processedContent = content;

    // Replace [sound:...] tags with audio player HTML
    mediaRefs.forEach((ref) => {
      const asset = getMediaAsset(ref);
      if (asset && asset.blob.type.startsWith("audio/")) {
        // Replace [sound:filename] with audio player
        processedContent = processedContent.replace(
          new RegExp(`\\[sound:${ref}\\]`, "g"),
          `<div class="audio-player">
            <audio controls src="${asset.url}">
              Seu navegador não suporta áudio.
            </audio>
            <span class="audio-label">🔊 ${ref}</span>
          </div>`
        );
      }
    });

    return (
      <div className="card-content">
        <div className="card-text" dangerouslySetInnerHTML={{ __html: processedContent }} />
        <div className="card-media">
          {mediaRefs.map((ref) => {
            const asset = getMediaAsset(ref);
            if (!asset) return null;

            // Skip audio files as they're already embedded in the content
            if (asset.blob.type.startsWith("audio/")) return null;

            return (
              <MediaPreviewComponent
                key={ref}
                asset={asset}
                onError={(error) => console.error("Media error:", error)}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <section className="results">
      <header className="section-header">
        <div>
          <h2>Revisão: {deck.name}</h2>
          <p>
            Cartão {currentCardIndex + 1} de {availableCards.length}
          </p>
          {schedulerCard && (
            <p className="muted">
              Intervalo: {schedulerCard.interval} dias | Facilidade:{" "}
              {schedulerCard.easeFactor.toFixed(2)}
            </p>
          )}
        </div>
        <Link to="/">← Voltar</Link>
      </header>

      {currentCard && (
        <div className="review-card">
          <div className="card-front">
            <h3>Frente</h3>
            {renderCardContent(currentCard.front, frontMediaRefs)}
          </div>

          {showAnswer && (
            <div className="card-back">
              <h3>Verso</h3>
              {renderCardContent(currentCard.back, backMediaRefs)}
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
                  <button
                    type="button"
                    className="quality-btn quality-0"
                    onClick={() => handleQualityRating(0)}
                  >
                    0 - Totalmente esquecido
                  </button>
                  <button
                    type="button"
                    className="quality-btn quality-1"
                    onClick={() => handleQualityRating(1)}
                  >
                    1 - Errei, mas lembrei
                  </button>
                  <button
                    type="button"
                    className="quality-btn quality-2"
                    onClick={() => handleQualityRating(2)}
                  >
                    2 - Difícil
                  </button>
                  <button
                    type="button"
                    className="quality-btn quality-3"
                    onClick={() => handleQualityRating(3)}
                  >
                    3 - Bom
                  </button>
                  <button
                    type="button"
                    className="quality-btn quality-4"
                    onClick={() => handleQualityRating(4)}
                  >
                    4 - Fácil
                  </button>
                  <button
                    type="button"
                    className="quality-btn quality-5"
                    onClick={() => handleQualityRating(5)}
                  >
                    5 - Perfeito
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
