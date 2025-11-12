import { addPixabayLog } from './pixabayLogger';
import { proxyGet } from './proxyClient';

interface ProxyPixabayImage {
  url: string;
}

interface ProxyPixabayResponse {
  total: number;
  totalHits: number;
  images: ProxyPixabayImage[];
}

export const searchImages = async (query: string): Promise<string[]> => {
  if (!query.trim()) {
    addPixabayLog('warn', 'Pixabay search with empty query', { query });
    return [];
  }

  try {
    const params = new URLSearchParams({ q: query });
    const { images } = await proxyGet<ProxyPixabayResponse>(`/pixabay/search?${params.toString()}`);
    const urls = (images ?? []).map((image) => image.url).filter(Boolean);
    addPixabayLog('info', 'Returning Pixabay image URLs via proxy', { query, urlCount: urls.length });
    return urls;
  } catch (error) {
    console.error('Error fetching images via proxy:', error);
    addPixabayLog('error', 'Error fetching images via proxy', { query, error: String(error) });
    return [];
  }
};