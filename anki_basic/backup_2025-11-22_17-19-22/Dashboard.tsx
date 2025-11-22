import { Link } from "react-router-dom";

import { useAppStore } from "@store/appStore";

export function Dashboard() {
  const decks = useAppStore((state) => state.decks);
  const stats = useAppStore((state) => state.stats);
  const schedulerState = useAppStore((state) => state.schedulerState);

  return (
    <section className="results">
      <header className="section-header">
        <div>
          <h2>Decks importados</h2>
          <p>{decks.length === 0 ? "Nenhum deck importado" : `${decks.length} deck(s)`}</p>
        </div>
        <div>
          <h2>Estatísticas</h2>
          <p>
            {stats.totalCards} cartões | {schedulerState.dueCards.length} para revisar
          </p>
        </div>
      </header>

      <div className="deck-grid">
        {decks.map((deck) => {
          const deckCardIds = deck.cards.map((card) => card.id);
          const deckDueCount = schedulerState.dueCards.filter((id) =>
            deckCardIds.includes(id)
          ).length;
          const deckNewCount = schedulerState.newCards.filter((id) =>
            deckCardIds.includes(id)
          ).length;

          return (
            <article key={deck.id} className="deck-card">
              <h3>{deck.name}</h3>
              {deck.description && <p>{deck.description}</p>}
              <p>
                Cartões: <strong>{deck.cards.length}</strong>
              </p>
              <p className="muted">
                Para revisar: {deckDueCount} | Novos: {deckNewCount}
              </p>
              <div className="deck-actions">
                <Link to={`/decks/${deck.id}`}>Ver deck</Link>
                {deckDueCount > 0 || deckNewCount > 0 ? (
                  <Link to={`/review/${deck.id}`} className="review-btn">
                    Revisar
                  </Link>
                ) : null}
              </div>
            </article>
          );
        })}
        {decks.length === 0 && <p>Importe um arquivo .apkg para começar.</p>}
      </div>
    </section>
  );
}
