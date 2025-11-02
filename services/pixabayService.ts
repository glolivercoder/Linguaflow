import { addPixabayLog } from './pixabayLogger';

const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;

interface PixabayImage {
  webformatURL: string;
}

interface PixabayResponse {
  hits: PixabayImage[];
}

const fetchJson = async (url: string): Promise<PixabayResponse | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorInfo = `${response.status} ${response.statusText}`;
      console.error('Pixabay API error:', errorInfo);
      addPixabayLog('error', 'Pixabay API response not OK', { url, status: response.status, statusText: response.statusText });
      return null;
    }
    const json = await response.json();
    addPixabayLog('info', 'Pixabay API request succeeded', { url, hits: json?.hits?.length ?? 0 });
    return json;
  } catch (error) {
    console.error('Error fetching JSON from Pixabay:', error);
    addPixabayLog('error', 'Pixabay API request failed', { url, error: String(error) });
    return null;
  }
};

export const searchImages = async (query: string): Promise<string[]> => {
  if (!PIXABAY_API_KEY) {
    console.warn('Pixabay API key not configured. Returning no images.');
    addPixabayLog('warn', 'Pixabay API key missing when searching images', { query });
    return [];
  }

  const buildUrl = (term: string) =>
    `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(term)}&image_type=photo&per_page=4&safesearch=true`;

  const primary = await fetchJson(buildUrl(query));
  let hits = primary?.hits?.length ? primary.hits : [];

  if (!hits.length) {
    addPixabayLog('warn', 'No hits from primary Pixabay query, using fallback', { query });
    const fallback = await fetchJson(buildUrl('language'));
    hits = fallback?.hits ?? [];
  }

  const urls = hits
    .filter(hit => !!hit.webformatURL)
    .map(hit => hit.webformatURL);

  addPixabayLog('info', 'Returning Pixabay image URLs', { query, urlCount: urls.length });

  return urls;
};