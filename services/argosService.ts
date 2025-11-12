import type { LanguageCode } from '../types';

const ARGOS_API_BASE_URL = 'http://localhost:8100';

const LANGUAGE_CODE_TO_ARGOS: Record<LanguageCode, string> = {
  'pt-BR': 'pt',
  'en-US': 'en',
  'es-ES': 'es',
  'zh-CN': 'zh',
  'ja-JP': 'ja',
  'ru-RU': 'ru',
  'fr-FR': 'fr',
  'it-IT': 'it',
  eo: 'eo',
};

const toArgosCode = (language: LanguageCode): string => {
  return LANGUAGE_CODE_TO_ARGOS[language] ?? language.slice(0, 2).toLowerCase();
};

interface ArgosTranslationResponse {
  translation: string;
  engine: string;
}

export async function translateTextOffline(
  text: string,
  sourceLanguage: LanguageCode,
  targetLanguage: LanguageCode
): Promise<string> {
  const payload = {
    text,
    source_language: toArgosCode(sourceLanguage),
    target_language: toArgosCode(targetLanguage),
  };

  try {
    const response = await fetch(`${ARGOS_API_BASE_URL}/translate/offline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Argos translate error: ${response.status} ${errorText}`);
    }

    const data: ArgosTranslationResponse = await response.json();
    return (data.translation ?? '').trim();
  } catch (error) {
    console.error('Failed to translate via Argos:', error);
    throw error;
  }
}
