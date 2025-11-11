import { PIXABAY_API_KEY } from '../config.js';

const buildPixabayUrl = (term) => {
  const params = new URLSearchParams({
    key: PIXABAY_API_KEY,
    q: term,
    image_type: 'photo',
    per_page: '8',
    safesearch: 'true',
  });
  return `https://pixabay.com/api/?${params.toString()}`;
};

export const registerPixabayRoutes = (app) => {
  app.get('/pixabay/search', async (req, res) => {
    if (!PIXABAY_API_KEY) {
      return res.status(500).json({ error: 'PIXABAY_API_KEY não configurada no proxy.' });
    }

    const term = (req.query.q || '').toString().trim();
    if (!term) {
      return res.status(400).json({ error: 'Parâmetro q obrigatório.' });
    }

    try {
      const response = await fetch(buildPixabayUrl(term));
      if (!response.ok) {
        return res.status(response.status).json({
          error: 'Falha ao consultar Pixabay.',
          statusText: response.statusText,
        });
      }

      const data = await response.json();
      const hits = Array.isArray(data?.hits) ? data.hits : [];
      const images = hits
        .filter((hit) => Boolean(hit?.webformatURL))
        .map((hit) => ({
          url: hit.webformatURL,
          preview: hit.previewURL,
          tags: hit.tags,
        }));

      res.json({ total: data?.total ?? 0, totalHits: data?.totalHits ?? 0, images });
    } catch (error) {
      console.error('[proxy] Erro ao consultar Pixabay:', error);
      res.status(500).json({ error: 'Erro inesperado ao consultar Pixabay.' });
    }
  });
};
