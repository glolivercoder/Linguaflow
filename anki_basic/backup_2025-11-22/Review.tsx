import React, { useState, JSX } from "react";
import { useParams, Link } from "react-router-dom";
import { useAppStore } from "@store/appStore";
import { useImportStore } from "@store/importStore";
import { getMediaType } from "@services/media/mediaService";

export function Review() {
  const { deckId } = useParams();
  const deck = useAppStore((state) => (deckId ? state.getDeckById(deckId) : undefined));
  const reviewCard = useAppStore((state) => state.reviewCard);
  const mediaAssets = useImportStore((state) => state.mediaAssets);

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);

  /**
   * Lida com a revisão de um cartão e navega para o próximo ou retorna à lista de baralhos
   * @param quality - A qualidade da revisão (0 a 5)
   */
  const handleReviewCard = (quality: number) => {
    if (!deck?.cards?.[currentCardIndex]) return;

    // Registra a revisão do cartão
    reviewCard(deck.cards[currentCardIndex].id, quality);

    // Verifica se ainda há mais cartões para revisar
    if (currentCardIndex < deck.cards.length - 1) {
      // Vai para o próximo cartão
      setCurrentCardIndex(currentCardIndex + 1);
      setShowBack(false);
    } else {
      // Redireciona de volta para a lista de baralhos
      window.location.href = "/";
    }
  };

  // Opções de qualidade para revisão
  const QUALITY_OPTIONS = ["Erro grave", "Erro", "Dificuldade", "Bom", "Fácil", "Muito fácil"];

  // Função simplificada para encontrar ativos de mídia
  const getMediaAsset = (filename: string) => {
    if (!filename) return null;

    // Remove qualquer diretório do caminho do arquivo
    const cleanFilename = filename.split(/[\\/]/).pop() || "";

    // Tenta encontrar uma correspondência exata ou por terminação
    return mediaAssets?.find((a) => a.name === cleanFilename) || null;
  };

  /**
   * Extrai referências de mídia (áudio e imagens) do conteúdo do cartão
   * @param content - O conteúdo do cartão que pode conter referências de mídia
   * @returns Um array de strings com os nomes dos arquivos de mídia
   */
  const extractMediaReferences = (content?: string): string[] => {
    if (!content) return [];

    const mediaRefs: string[] = [];
    let match;

    // Extrai referências do formato [sound:...]
    const soundRegex = /\[sound:([^\]]+)\]/g;
    while ((match = soundRegex.exec(content)) !== null) {
      if (match[1]) {
        mediaRefs.push(match[1]);
      }
    }

    // Extrai referências de imagens (formato <img src="...">)
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/g;
    while ((match = imgRegex.exec(content)) !== null) {
      if (match[1]) {
        mediaRefs.push(match[1]);
      }
    }

    // Remove duplicatas
    return mediaRefs.filter((ref, index, self) => self.indexOf(ref) === index);
  };

  /**
   * Renderiza o conteúdo do cartão, processando referências de mídia e substituindo-as
   * por elementos React apropriados.
   *
   * @param content - O conteúdo HTML do cartão
   * @param mediaRefs - Lista opcional de referências de mídia já extraídas
   * @returns Elemento React contendo o conteúdo renderizado
   */
  const renderCardContent = (content: string, mediaRefs: string[] = []): JSX.Element => {
    if (!content) return <div>Sem conteúdo</div>;

    // Se não houver mídias, retornamos o conteúdo como está
    if (mediaRefs.length === 0) {
      mediaRefs = extractMediaReferences(content);
    }

    let processedContent = content;
    const mediaElements: JSX.Element[] = [];

    // Primeiro, extraímos todas as referências de mídia
    mediaRefs.forEach((ref, index) => {
      const asset = getMediaAsset(ref);
      if (!asset) return;

      const mediaType = getMediaType(asset.name);
      const mediaKey = `media-${ref}-${Date.now()}-${index}`;

      // Para áudios, adiciona um player personalizado
      if (mediaType === "audio" && asset.blob) {
        // Substitui a referência [sound:...] por um marcador único
        processedContent = processedContent.replace(
          new RegExp(`\\[sound:${ref.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\]`, "gi"),
          `[MEDIA:${mediaKey}]`
        );

        // Adiciona o player de áudio personalizado
        mediaElements.push(
          <div key={mediaKey} className="media-container">
            <audio
              id={mediaKey}
              controls
              preload="metadata"
              onError={(e) => console.error("Erro ao carregar áudio:", e)}
              style={{ width: "100%" }}
            >
              <source src={asset.url} type={asset.blob.type} />
              Seu navegador não suporta o elemento de áudio.
            </audio>
            <div className="media-label">Áudio: {ref.split(/[\\/]/).pop()}</div>
          </div>
        );
      } else if (mediaType === "image" && asset.blob) {
        // Remove a tag img original para evitar duplicação
        processedContent = processedContent.replace(
          new RegExp(
            `<img[^>]+src=["']${ref.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*>`,
            "gi"
          ),
          `[MEDIA:${mediaKey}]`
        );

        // Adiciona a imagem com tratamento de erro
        mediaElements.push(
          <div key={mediaKey} className="media-preview image">
            <img
              src={asset.url}
              alt={ref.split(/[\\/]/).pop() || "Imagem do cartão"}
              style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "8px" }}
              onError={(e) => {
                console.error("Erro ao carregar imagem:", ref);
                const img = e.target as HTMLImageElement;
                img.alt = `Falha ao carregar: ${ref.split(/[\\/]/).pop()}`;
                img.style.border = "1px solid #ff6b6b";
              }}
            />
          </div>
        );
      }
    });

    // Processa o conteúdo para substituir as referências de mídia
    const parts = processedContent.split(/(\[MEDIA:[^\]]+\])/);

    const contentWithMedia = parts.map((part, i) => {
      const match = part.match(/^\[MEDIA:(.+)\]$/);
      if (match) {
        const mediaId = match[1];
        return (
          <div key={`media-container-${i}`} className="media-container">
            {mediaElements.find((el) => el.key === mediaId) || null}
          </div>
        );
      }
      return <div key={`text-${i}`} dangerouslySetInnerHTML={{ __html: part }} />;
    });

    return (
      <div className="card-content">
        <div className="card-text">{contentWithMedia}</div>
      </div>
    );
  };

  if (!deck?.cards?.[currentCardIndex]) {
    return (
      <div className="review-container">
        <div>Nenhum cartão encontrado</div>
        <Link to="/">Voltar</Link>
      </div>
    );
  }

  const currentCard = deck.cards[currentCardIndex];

  return (
    <div className="review-container">
      <header className="section-header">
        <div>
          <h2>Revisão: {deck?.name || "Carregando..."}</h2>
          <p>
            Cartão {currentCardIndex + 1} de {deck?.cards.length || 0}
          </p>
        </div>
        <Link to="/">← Voltar</Link>
      </header>

      <div className="review-card">
        <div className="card-front">
          <h3>Frente</h3>
          {renderCardContent(currentCard.front || "")}
        </div>

        {showBack && (
          <div className="card-back">
            <h3>Verso</h3>
            {renderCardContent(currentCard.back || "")}
          </div>
        )}

        <div className="review-actions">
          {!showBack ? (
            <button type="button" className="show-answer-btn" onClick={() => setShowBack(true)}>
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
                    onClick={() => handleReviewCard(quality)}
                  >
                    {quality} - {QUALITY_OPTIONS[quality]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Review;
