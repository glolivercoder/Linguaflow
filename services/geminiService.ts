

import { GoogleGenAI, Modality } from "@google/genai";
import { VoiceGender, LanguageCode } from '../types';
import { VOICE_CONFIG } from '../constants';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Audio Decoding/Encoding Utilities
// FIX: Export the `decode` function so it can be imported and used in other files.
// FIX: Exported the 'decode' function to make it accessible to other modules.
export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


// --- API Functions ---

export const generateTTS = async (text: string, lang: LanguageCode, gender: VoiceGender): Promise<string | null> => {
  try {
    const voiceName = VOICE_CONFIG[lang][gender] || VOICE_CONFIG[lang]['female'];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    // FIX: Use the recommended .text property to extract the response, which for audio is a base64 string.
    // The previous access path was incorrect for the generateContent response structure.
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data ?? null;
  } catch (error) {
    console.error("Error generating TTS:", error);
    return null;
  }
};


export const getPhonetics = async (text: string, targetLangName: string, nativeLangName: string): Promise<string> => {
    try {
        const prompt = `Gere uma transcrição fonética simplificada para a frase "${text}" em ${targetLangName}. A transcrição deve ser fácil de entender para um falante nativo de ${nativeLangName}. Use uma notação simples e intuitiva. Responda apenas com a transcrição fonética.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error generating phonetics:", error);
        return "Não foi possível gerar a fonética.";
    }
}

export const getIPA = async (text: string, langName: string): Promise<string> => {
    try {
        const prompt = `Forneça a transcrição do Alfabeto Fonético Internacional (AFI) para a palavra ou frase curta "${text}" no idioma ${langName}. Responda apenas com a transcrição AFI, por exemplo: /tɹænskrɪpʃən/.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error fetching IPA:", error);
        return "AFI indisponível";
    }
};

export const translateText = async (text: string, fromLangName: string, toLangName: string): Promise<string> => {
    try {
        const prompt = `Traduza o seguinte texto de ${fromLangName} para ${toLangName}: "${text}". Responda apenas com a tradução.`;
        const response = await ai.models.generateContent({
            // FIX: Use the recommended model name for 'gemini lite' or 'flash lite'.
            model: 'gemini-flash-lite-latest',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error translating text:", error);
        return "Erro na tradução.";
    }
};


export const getPronunciationCorrection = async (
    phraseToPractice: string,
    userTranscription: string,
    learningLangName: string,
    nativeLangName: string
): Promise<string> => {
    try {
        const prompt = `Um estudante, falante nativo de ${nativeLangName}, está aprendendo ${learningLangName}.
        A frase que ele deveria dizer era: "${phraseToPractice}".
        A transcrição do que ele disse é: "${userTranscription}".

        Analise a pronúncia e a gramática. Forneça um feedback construtivo e claro em ${nativeLangName}.
        Se a pronúncia estiver boa, elogie.
        Se houver erros, aponte-os de forma amigável e explique como corrigir.
        Seja conciso e direto ao ponto.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error getting pronunciation correction:", error);
        return "Desculpe, não consegui analisar sua pronúncia. Tente novamente.";
    }
};

export const getGroundedAnswer = async (query: string): Promise<{text: string, sources: any[]}> => {
    try {
        const useMaps = /perto|onde|restaurante|café|loja|endereço/i.test(query);
        const tools = useMaps ? [{googleMaps: {}}] : [{googleSearch: {}}];

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: query,
            config: {
                tools: tools,
            },
        });

        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
        return { text: response.text, sources };

    } catch (error) {
        console.error("Error with grounded search:", error);
        return { text: "Desculpe, não consegui encontrar uma resposta.", sources: [] };
    }
};