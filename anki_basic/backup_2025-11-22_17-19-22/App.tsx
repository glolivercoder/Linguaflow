import { ChangeEvent, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./App.css";

import { importAnkiPackage } from "@services/anki/importService";
import { useImportStore } from "@store/importStore";
import { useAppStore } from "@store/appStore";
import { Dashboard, DeckDetail, Review } from "@pages/index";

function App() {
  const { mediaAssets, setPayload, reset } = useImportStore();
  const hydrateFromImport = useAppStore((state) => state.hydrateFromImport);
  const clearAppState = useAppStore((state) => state.clear);
  const stats = useAppStore((state) => state.stats);
  const deckCount = useAppStore((state) => state.decks.length);
  const autoPlayAudio = useAppStore((state) => state.autoPlayAudio);
  const toggleAutoPlayAudio = useAppStore((state) => state.toggleAutoPlayAudio);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Hard Reset: Clear everything before starting a new import
    reset();
    clearAppState();
    setError(null);
    setIsLoading(true);

    try {
      const payload = await importAnkiPackage({ file });
      setPayload(payload);
      hydrateFromImport(payload.decks);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Falha ao importar deck");
      // Ensure we don't leave partial state if import fails
      reset();
      clearAppState();
    } finally {
      setIsLoading(false);
      // Reset file input value to allow selecting the same file again if needed
      event.target.value = "";
    }
  };

  const handleReset = () => {
    reset();
    clearAppState();
    setError(null);
  };

  return (
    <BrowserRouter>
      <div className="App">
        <header>
          <h1>Anki Basic</h1>
          <p>Importe decks `.apkg` e navegue pelos cartões.</p>

          <div className="stats">
            <span>Decks: {deckCount}</span>
            <span>Cartões: {stats.totalCards}</span>
            {stats.lastImportAt && (
              <span>Última importação: {new Date(stats.lastImportAt).toLocaleString()}</span>
            )}
          </div>

          <div className="controls">
            <label className="toggle-switch" title="Tocar áudio automaticamente ao abrir o cartão">
              <input type="checkbox" checked={autoPlayAudio} onChange={toggleAutoPlayAudio} />
              <span className="slider"></span>
              <span className="label-text">🔊 Auto-play</span>
            </label>
          </div>

          <label className="file-input">
            <span>Selecionar arquivo .apkg</span>
            <input type="file" accept=".apkg" onChange={handleFileChange} disabled={isLoading} />
          </label>
          {deckCount > 0 && (
            <button type="button" onClick={handleReset} className="reset-button">
              Limpar importação
            </button>
          )}

          {isLoading && <p>Importando arquivo, aguarde...</p>}
          {error && <p className="error">{error}</p>}
        </header>

        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/decks/:deckId" element={<DeckDetail />} />
            <Route path="/review/:deckId" element={<Review />} />
          </Routes>

          <section className="results">
            <h2>Mídias importadas</h2>
            {mediaAssets.length === 0 && <p>Nenhuma mídia importada.</p>}
            {mediaAssets.map((asset) => (
              <article key={asset.name} className="deck-card">
                <p>{asset.name}</p>
                <small>{(asset.size / 1024).toFixed(1)} KB</small>
              </article>
            ))}
          </section>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
