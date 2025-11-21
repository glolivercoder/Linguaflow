import { proxyPost } from './proxyClient';
import { RawCard, LanguageCode } from '../types';

export interface GenerateCategoryRequest {
    theme: string; // Ex: "Compras no Supermercado"
    type: 'phrases' | 'objects';
    itemCount: number; // Quantos itens gerar (5-20)
    nativeLanguage: LanguageCode;
    targetLanguage: LanguageCode;
}

export interface GeneratedItem {
    pt: string;
    en: string;
    phonetic: string;
}

export interface GenerateCategoryResponse {
    items: GeneratedItem[];
}

/**
 * Generate a category of flashcards using Gemini AI
 */
export const generateCategory = async (
    request: GenerateCategoryRequest
): Promise<RawCard[]> => {
    console.log('[CategoryGenerator] Generating category:', request);

    const prompt = buildPrompt(request);

    try {
        const response = await proxyPost<{ translation: string }>('/gemini/translate', {
            text: prompt,
            fromLangName: 'Portuguese',
            toLangName: 'English'
        });

        console.log('[CategoryGenerator] Raw response:', response.translation);

        // Parse JSON response
        const parsed = parseGeminiResponse(response.translation);

        console.log('[CategoryGenerator] Parsed items:', parsed.items.length);

        // Convert to RawCard format
        const cards: RawCard[] = parsed.items.map((item, index) => ({
            id: `custom-${Date.now()}-${index}`,
            texts: {
                'pt-BR': item.pt,
                'en-US': item.en
            },
            phoneticTexts: {
                'en-US': item.phonetic
            },
            imageUrl: request.type === 'objects' ? 'pixabay:auto' : undefined
        }));

        return cards;
    } catch (error) {
        console.error('[CategoryGenerator] Error:', error);
        throw new Error('Falha ao gerar categoria. Tente novamente.');
    }
};

/**
 * Build the prompt for Gemini AI
 */
const buildPrompt = (request: GenerateCategoryRequest): string => {
    const typeText = request.type === 'phrases' ? 'frases úteis' : 'objetos/palavras';
    const exampleType = request.type === 'phrases'
        ? 'frases completas e naturais'
        : 'substantivos simples (objetos, animais, alimentos, etc.)';

    return `Você é um especialista em ensino de idiomas. Gere EXATAMENTE ${request.itemCount} ${typeText} sobre o tema "${request.theme}".

IMPORTANTE: Gere ${exampleType}.

Para cada item, forneça:
- "pt": Texto em português brasileiro (pt-BR)
- "en": Tradução em inglês americano (en-US)
- "phonetic": Transcrição fonética IPA do inglês (entre barras, ex: /həˈloʊ/)

Formato de resposta (JSON VÁLIDO):
{
  "items": [
    {"pt": "exemplo em português", "en": "example in english", "phonetic": "/ɪɡˈzæm.pəl/"},
    {"pt": "outro exemplo", "en": "another example", "phonetic": "/əˈnʌð.ər ɪɡˈzæm.pəl/"}
  ]
}

REGRAS CRÍTICAS:
1. Retorne APENAS o JSON, sem texto adicional antes ou depois
2. Use aspas duplas (") no JSON
3. Gere EXATAMENTE ${request.itemCount} itens
4. ${request.type === 'phrases' ? 'Cada frase deve ser útil e natural' : 'Cada palavra deve ser um substantivo simples'}
5. A fonética deve estar no formato IPA entre barras /.../ 

Tema: "${request.theme}"
Tipo: ${typeText}
Quantidade: ${request.itemCount}`;
};

/**
 * Parse Gemini response and extract JSON
 */
const parseGeminiResponse = (text: string): GenerateCategoryResponse => {
    // Try to find JSON in the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
        console.error('[CategoryGenerator] No JSON found in response:', text);
        throw new Error('Resposta inválida da IA - JSON não encontrado');
    }

    try {
        const parsed = JSON.parse(jsonMatch[0]);

        if (!parsed.items || !Array.isArray(parsed.items)) {
            throw new Error('Formato inválido - "items" não encontrado ou não é array');
        }

        // Validate each item
        for (const item of parsed.items) {
            if (!item.pt || !item.en || !item.phonetic) {
                throw new Error('Item inválido - faltando campos obrigatórios (pt, en, phonetic)');
            }
        }

        return parsed;
    } catch (error) {
        console.error('[CategoryGenerator] Parse error:', error);
        throw new Error('Falha ao processar resposta da IA');
    }
};

/**
 * Validate a category name
 */
export const validateCategoryName = (name: string): { valid: boolean; error?: string } => {
    if (!name || name.trim().length === 0) {
        return { valid: false, error: 'Nome da categoria não pode estar vazio' };
    }

    if (name.trim().length < 3) {
        return { valid: false, error: 'Nome deve ter pelo menos 3 caracteres' };
    }

    if (name.trim().length > 50) {
        return { valid: false, error: 'Nome deve ter no máximo 50 caracteres' };
    }

    return { valid: true };
};

/**
 * Validate a card
 */
export const validateCard = (card: Partial<RawCard>): { valid: boolean; error?: string } => {
    if (!card.texts || !card.texts['pt-BR'] || !card.texts['en-US']) {
        return { valid: false, error: 'Card deve ter texto em português e inglês' };
    }

    if (card.texts['pt-BR'].trim().length === 0) {
        return { valid: false, error: 'Texto em português não pode estar vazio' };
    }

    if (card.texts['en-US'].trim().length === 0) {
        return { valid: false, error: 'Texto em inglês não pode estar vazio' };
    }

    return { valid: true };
};
