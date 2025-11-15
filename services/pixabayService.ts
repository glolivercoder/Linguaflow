import { addPixabayLog } from './pixabayLogger';
import { proxyGet } from './proxyClient';

interface ProxyPixabayImage {
  url: string;
  preview?: string;
  tags?: string;
}

interface ProxyPixabayResponse {
  total: number;
  totalHits: number;
  images: ProxyPixabayImage[];
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // 1 second

/**
 * Search for images on Pixabay with retry logic and error handling
 * @param query Search term for images
 * @param retryCount Internal counter for retry attempts
 * @returns Array of image URLs
 */
export const searchImages = async (query: string, retryCount: number = 0): Promise<string[]> => {
  const logContext = { query, attempt: retryCount + 1 };
  
  if (!query.trim()) {
    addPixabayLog('warn', 'Pixabay search with empty query', logContext);
    return [];
  }

  try {
    addPixabayLog('info', 'Searching Pixabay', { ...logContext });
    
    const params = new URLSearchParams({ 
      q: query.trim(),
      image_type: 'photo',
      per_page: '8',
      safesearch: 'true'
    });
    
    const response = await proxyGet<ProxyPixabayResponse>(`/pixabay/search?${params.toString()}`);
    
    if (!response?.images) {
      throw new Error('Invalid response format from Pixabay API');
    }
    
    const urls = (response.images || [])
      .filter((image): image is { url: string } => Boolean(image?.url))
      .map(image => image.url);
    
    addPixabayLog('info', 'Pixabay search successful', { 
      ...logContext, 
      resultCount: urls.length,
      totalAvailable: response.totalHits
    });
    
    return urls;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Log the error with detailed context
    addPixabayLog('error', 'Pixabay search failed', { 
      ...logContext, 
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Implement retry logic for transient errors
    if (retryCount < MAX_RETRIES - 1) {
      const nextRetry = retryCount + 1;
      const delay = RETRY_DELAY_MS * Math.pow(2, retryCount); // Exponential backoff
      
      addPixabayLog('info', `Retrying Pixabay search (${nextRetry + 1}/${MAX_RETRIES})`, {
        ...logContext,
        nextRetryInMs: delay
      });
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      return searchImages(query, nextRetry);
    }
    
    console.error('Pixabay search failed after retries:', error);
    return [];
  }
};