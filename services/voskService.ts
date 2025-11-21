// services/voskService.ts
import { PROXY_BASE_URL } from './proxyClient';
import { OpenRouterModelSummary } from '../types';

export interface VoskResponse {
  transcription: string;
  llm_response?: string;
  audio_base64?: string;
}

export interface VoskRequest {
  model: string;
  audioBase64: string;
  systemPrompt: string;
  language: string;
}

/**
 * Sends audio data to the Vosk service for transcription and processing
 */
export async function chatWithAudio({
  model,
  audioBase64,
  systemPrompt,
  language = 'pt-BR'
}: {
  model: string;
  audioBase64: string;
  systemPrompt: string;
  language?: string;
}): Promise<VoskResponse> {
  try {
    const response = await fetch(`${PROXY_BASE_URL}/vosk/chat/audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        audio_base64: audioBase64,
        system_prompt: systemPrompt,
        language,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `Error ${response.status}: ${response.statusText}` 
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error in chatWithAudio:', error);
    throw error;
  }
}

/**
 * Encodes Int16Array audio data to base64 WAV format
 */
export function encodeInt16ToWavBase64(
  int16Data: Int16Array,
  sampleRate = 16000
): string {
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataLength = int16Data.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  let offset = 0;
  const writeString = (text: string) => {
    for (let i = 0; i < text.length; i++) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
    offset += text.length;
  };

  // RIFF header
  writeString('RIFF');
  view.setUint32(offset, 36 + dataLength, true);
  offset += 4;
  writeString('WAVE');

  // fmt subchunk
  writeString('fmt ');
  view.setUint32(offset, 16, true); // Subchunk1Size for PCM
  offset += 4;
  view.setUint16(offset, 1, true);  // AudioFormat PCM
  offset += 2;
  view.setUint16(offset, numChannels, true);
  offset += 2;
  view.setUint32(offset, sampleRate, true);
  offset += 4;
  view.setUint32(offset, byteRate, true);
  offset += 4;
  view.setUint16(offset, blockAlign, true);
  offset += 2;
  view.setUint16(offset, bitsPerSample, true);
  offset += 2;

  // data subchunk
  writeString('data');
  view.setUint32(offset, dataLength, true);
  offset += 4;

  // Write audio data
  for (let i = 0; i < int16Data.length; i++, offset += 2) {
    view.setInt16(offset, int16Data[i], true);
  }

  // Convert to base64
  const wavBytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < wavBytes.byteLength; i++) {
    binary += String.fromCharCode(wavBytes[i]);
  }

  return btoa(binary);
}

/**
 * Checks if audio is silent based on RMS value
 */
export function isAudioSilent(samples: Int16Array, threshold = 0.002): boolean {
  if (samples.length === 0) return true;
  
  let sumSquares = 0;
  for (let i = 0; i < samples.length; i++) {
    const normalized = samples[i] / 32768; // Normalize to [-1, 1]
    sumSquares += normalized * normalized;
  }
  
  const rms = Math.sqrt(sumSquares / samples.length);
  return rms < threshold;
}

/**
 * Merges multiple Int16Array chunks into one
 */
export function mergeInt16Chunks(chunks: Int16Array[]): Int16Array {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Int16Array(totalLength);
  let offset = 0;
  
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  
  return result;
}

export default {
  chatWithAudio,
  encodeInt16ToWavBase64,
  isAudioSilent,
  mergeInt16Chunks,
};

/**
 * Fetches available models from OpenRouter API
 */
export async function fetchOpenRouterModels({
  search,
  includeFree,
  includePaid,
}: {
  search: string;
  includeFree: boolean;
  includePaid: boolean;
}): Promise<OpenRouterModelSummary[]> {
  try {
    const response = await fetch(`${PROXY_BASE_URL}/openrouter/models`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `Error ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    const all = data.data.map((model: any) => ({
      id: model.id,
      name: model.name,
      description: model.description || '',
      context_length: model.context_length || 0,
      pricing: model.pricing || null,
      tags: model.tags || null,
    })) as OpenRouterModelSummary[];

    const q = (search || '').toLowerCase();
    const filtered = all.filter((m) => {
      const nameMatch = m.name?.toLowerCase().includes(q) || m.id.toLowerCase().includes(q);
      const isFree = m.pricing && (m.pricing as any).request === '0' && (m.pricing as any).prompt === '0' && (m.pricing as any).completion === '0';
      const passPrice = (includeFree || !isFree) && (includePaid || isFree);
      return nameMatch && passPrice;
    });

    return filtered;
  } catch (error) {
    console.error('Error fetching OpenRouter models:', error);
    throw error;
  }
}
