import { Link, useParams } from "react-router-dom";

import { useAppStore } from "@store/appStore";

export function DeckDetail() {
  const { deckId } = useParams();
  const deck = useAppStore((state) => (deckId ? state.getDeckById(deckId) : undefined));

  if (!deck) {
    return (
      <section className="results">
        <p>
          Deck não encontrado. Volte para o <Link to="/">dashboard</Link> e selecione outro arquivo.
        </p>
      </section>
    );
  }

  return (
    <section className="results">
      <header className="section-header">
        <div>
          <h2>{deck.name}</h2>
          {deck.description && <p>{deck.description}</p>}
          <p className="muted">{deck.cards.length} cartão(ões)</p>
        </div>
        <div className="deck-actions">
          <Link to={`/review/${deckId}`} className="review-btn">
            Revisar Deck
          </Link>
          <Link to="/">← Voltar</Link>
        </div>
      </header>

      <div className="card-list">
        {deck.cards.length === 0 && <p>Nenhum cartão disponível.</p>}
        {deck.cards.map((card) => (
          <article key={card.id} className="deck-card">
            <div className="card-front">
              <strong>Frente:</strong>
              <div
                dangerouslySetInnerHTML={{
                  __html: card.front ?? "Frente não disponível",
                }}
              />
            </div>
            <div className="card-back">
              <strong>Verso:</strong>
              <div
                dangerouslySetInnerHTML={{
                  __html: card.back ?? "Verso não disponível",
                }}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
