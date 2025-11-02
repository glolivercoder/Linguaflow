


import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob as GenaiBlob, LiveSession } from "@google/genai";
// FIX: Import the 'decode' function to handle audio data from the server.
import { encode, decodeAudioData, decode } from '../services/geminiService';
import { Settings, Flashcard } from '../types';
import { SUPPORTED_LANGUAGES, VOICE_CONFIG } from '../constants';
import * as Icons from './icons';
import { getPhonetics, translateText, getPronunciationCorrection, getGroundedAnswer } from '../services/geminiService';

const API_KEY = process.env.API_KEY;
if (!API_KEY) throw new Error("API_KEY not set");

const ai = new GoogleGenAI({ apiKey: API_KEY });

interface ConversationViewProps {
  settings: Settings;
  addFlashcard: (card: Omit<Flashcard, 'id'>) => void;
}

const ConversationView: React.FC<ConversationViewProps> = ({ settings, addFlashcard }) => {
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [status, setStatus] = useState('Pronto para começar');
    const [userTranscript, setUserTranscript] = useState('');
    const [modelTranscript, setModelTranscript] = useState('');
    const [lastTurn, setLastTurn] = useState<{ user: string; model: string } | null>(null);

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    // FIX: Initialize useRef with null to prevent TypeScript errors.
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    // FIX: Initialize useRef with null to prevent TypeScript errors.
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    // FIX: Initialize useRef with null to prevent TypeScript errors.
    const mediaStreamRef = useRef<MediaStream | null>(null);
    // FIX: Initialize useRef with null to prevent TypeScript errors.
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const nextStartTimeRef = useRef(0);
    const audioSourcesRef = useRef(new Set<AudioBufferSourceNode>());

     const stopConversation = useCallback(() => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(s => s.close()).catch(e => console.error("Failed to close session gracefully", e));
            sessionPromiseRef.current = null;
        }
        
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;

        try {
            scriptProcessorRef.current?.disconnect();
        } catch(e) {
            // The context might already be closed, which can cause an error here. Ignore it.
        }
        scriptProcessorRef.current = null;

        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close();
        }
        inputAudioContextRef.current = null;
        
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close();
        }
        outputAudioContextRef.current = null;
        
        audioSourcesRef.current.forEach(s => {
            try { s.stop(); } catch(e) { /* already stopped */ }
        });
        audioSourcesRef.current.clear();
        
        setIsSessionActive(false);
        setStatus('Pronto para começar');
    }, []);

    const startConversation = useCallback(async () => {
        setStatus('Iniciando...');
        if (isSessionActive) {
            stopConversation();
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('Seu navegador não suporta acesso ao microfone.');
            return;
        }

        try {
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            const nativeLang = SUPPORTED_LANGUAGES.find(l => l.code === settings.nativeLanguage)?.name || 'Português';
            const learningLang = SUPPORTED_LANGUAGES.find(l => l.code === settings.learningLanguage)?.name || 'Inglês';
            
            // Safely access voice configuration to prevent crashes from invalid settings
            const voiceLanguageConfig = VOICE_CONFIG[settings.learningLanguage];
            const voiceName = (voiceLanguageConfig && voiceLanguageConfig[settings.voiceGender]) || 'Kore';


            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: `Você é um parceiro de conversação bilíngue. O usuário fala ${nativeLang} e você responde em ${learningLang}. Mantenha as respostas curtas e conversacionais.`,
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName } },
                    },
                },
                callbacks: {
                    onopen: () => {
                        if (!inputAudioContextRef.current || !mediaStreamRef.current) return;
                        const source = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                        scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current.onaudioprocess = (event) => {
                            const inputData = event.inputBuffer.getChannelData(0);
                            const pcmBlob: GenaiBlob = {
                                data: encode(new Uint8Array(new Int16Array(inputData.map(v => v * 32768)).buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionPromiseRef.current?.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
                        };
                        source.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                        setIsSessionActive(true);
                        setStatus('Conectado. Pode falar!');
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            setUserTranscript(prev => prev + message.serverContent!.inputTranscription.text);
                        }
                        if (message.serverContent?.outputTranscription) {
                            setModelTranscript(prev => prev + message.serverContent!.outputTranscription.text);
                        }
                        if (message.serverContent?.turnComplete) {
                            setLastTurn({ user: userTranscript, model: modelTranscript });
                            setUserTranscript('');
                            setModelTranscript('');
                        }
                        const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData && outputAudioContextRef.current) {
                            const outputAudioContext = outputAudioContextRef.current;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
                            const audioBuffer = await decodeAudioData(decode(audioData), outputAudioContext, 24000, 1);
                            const source = outputAudioContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputAudioContext.destination);
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            audioSourcesRef.current.add(source);
                            source.onended = () => audioSourcesRef.current.delete(source);
                        }
                        if (message.serverContent?.interrupted) {
                            audioSourcesRef.current.forEach(s => s.stop());
                            audioSourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Session error:', e);
                        setStatus(`Erro: ${e.message}. Tente novamente.`);
                        stopConversation();
                    },
                    onclose: () => {
                        stopConversation();
                    }
                }
            });
        } catch (error) {
            console.error('Failed to start conversation:', error);
            setStatus('Falha ao iniciar. Verifique as permissões.');
        }
    }, [settings, stopConversation, isSessionActive, userTranscript, modelTranscript]);

    useEffect(() => {
        return () => { stopConversation(); };
    }, [stopConversation]);

    const handleAddFlashcard = async () => {
        if (!lastTurn) return;
        setStatus('Criando flashcard...');
        const nativeLangName = SUPPORTED_LANGUAGES.find(l => l.code === settings.nativeLanguage)?.name || settings.nativeLanguage;
        const learningLangName = SUPPORTED_LANGUAGES.find(l => l.code === settings.learningLanguage)?.name || settings.learningLanguage;

        // The user speaks in native, model replies in learning.
        const originalText = lastTurn.user;
        const translatedText = lastTurn.model;
        
        const phoneticText = await getPhonetics(translatedText, learningLangName, nativeLangName);

        addFlashcard({
            originalText,
            translatedText,
            phoneticText,
            originalLang: settings.nativeLanguage,
            translatedLang: settings.learningLanguage
        });
        setLastTurn(null);
        setStatus('Flashcard adicionado!');
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            <div className="flex-grow flex flex-col items-center justify-center space-y-4">
                <div className="w-full max-w-2xl bg-gray-800 p-6 rounded-lg shadow-lg">
                    <p className="text-center text-cyan-400 mb-4">{status}</p>
                    <div className="text-center mb-6">
                        <button
                            onClick={isSessionActive ? stopConversation : startConversation}
                            className={`p-4 rounded-full transition-all duration-300 ${isSessionActive ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-green-600 hover:bg-green-700'}`}
                        >
                            {isSessionActive ? <Icons.StopIcon className="w-8 h-8 text-white" /> : <Icons.MicIcon className="w-8 h-8 text-white" />}
                        </button>
                    </div>
                    <div className="space-y-4 min-h-[120px]">
                        <div>
                            <p className="text-sm text-gray-400">Você:</p>
                            <p className="text-lg min-h-[28px]">{userTranscript}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">IA:</p>
                            <p className="text-lg min-h-[28px]">{modelTranscript}</p>
                        </div>
                    </div>
                     {lastTurn && (
                        <div className="mt-4 text-center">
                            <button onClick={handleAddFlashcard} className="text-cyan-400 hover:text-cyan-300 flex items-center justify-center gap-2 mx-auto">
                                <Icons.PlusCircleIcon className="w-5 h-5" />
                                Adicionar ao Flashcards
                            </button>
                        </div>
                    )}
                </div>
                <PronunciationPractice settings={settings}/>
                <GroundedSearch/>
            </div>
        </div>
    );
};

const PronunciationPractice: React.FC<{ settings: Settings }> = ({ settings }) => {
    const [textToPractice, setTextToPractice] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        if (!textToPractice.trim()) {
            setFeedback('Por favor, insira um texto para praticar.');
            return;
        }
        setFeedback('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };
            mediaRecorderRef.current.onstop = async () => {
                setIsLoading(true);
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                // For simplicity, we'll use a text-based correction model.
                // A real implementation would transcribe audio to text first.
                // Here, we simulate transcription for demonstration.
                // This is a placeholder; real audio transcription would be complex.
                const userTranscription = `(Transcrição simulada) ${textToPractice}`; 
                
                const learningLangName = SUPPORTED_LANGUAGES.find(l => l.code === settings.learningLanguage)?.name || settings.learningLanguage;
                const nativeLangName = SUPPORTED_LANGUAGES.find(l => l.code === settings.nativeLanguage)?.name || settings.nativeLanguage;

                const correction = await getPronunciationCorrection(textToPractice, userTranscription, learningLangName, nativeLangName);
                setFeedback(correction);
                setIsLoading(false);
                audioChunksRef.current = [];
                 stream.getTracks().forEach(track => track.stop());
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Error starting recording:', error);
            setFeedback('Não foi possível iniciar a gravação. Verifique as permissões do microfone.');
        }
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
    };

    return (
        <div className="w-full max-w-2xl bg-gray-800 p-6 rounded-lg shadow-lg mt-4">
            <h3 className="text-lg font-semibold text-cyan-400 mb-3">Praticar Pronúncia</h3>
            <input 
                type="text"
                value={textToPractice}
                onChange={(e) => setTextToPractice(e.target.value)}
                placeholder={`Digite uma frase em ${SUPPORTED_LANGUAGES.find(l=>l.code === settings.learningLanguage)?.name || ''}`}
                className="w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white mb-3"
            />
            <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-full py-2 px-4 rounded-md font-semibold text-white transition-colors ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-cyan-600 hover:bg-cyan-700'}`}
                disabled={isLoading}
            >
                {isLoading ? 'Analisando...' : isRecording ? 'Parar Gravação' : 'Gravar Pronúncia'}
            </button>
            {feedback && <p className="mt-4 text-gray-300 whitespace-pre-wrap">{feedback}</p>}
        </div>
    );
};

const GroundedSearch: React.FC = () => {
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<{text: string, sources: any[]} | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!query.trim()) return;
        setIsLoading(true);
        setResult(null);
        const response = await getGroundedAnswer(query);
        setResult(response);
        setIsLoading(false);
    };

    return (
         <div className="w-full max-w-2xl bg-gray-800 p-6 rounded-lg shadow-lg mt-4">
             <h3 className="text-lg font-semibold text-cyan-400 mb-3">Pesquisa Inteligente</h3>
             <form onSubmit={handleSearch} className="flex gap-2">
                 <input
                     type="text"
                     value={query}
                     onChange={e => setQuery(e.target.value)}
                     placeholder="Pergunte sobre lugares, notícias, etc."
                     className="flex-grow bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white"
                 />
                 <button type="submit" disabled={isLoading} className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-md disabled:opacity-50">
                     {isLoading ? 'Buscando...' : 'Perguntar'}
                 </button>
             </form>
             {result && (
                 <div className="mt-4 text-gray-300">
                     <p className="whitespace-pre-wrap">{result.text}</p>
                     {result.sources.length > 0 && (
                         <div className="mt-3 pt-3 border-t border-gray-700">
                             <h4 className="font-semibold text-sm text-gray-400">Fontes:</h4>
                             <ul className="list-disc list-inside text-sm">
                                 {result.sources.map((source, index) => (
                                     <li key={index}>
                                         <a href={source.web?.uri || source.maps?.uri} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                                             {source.web?.title || source.maps?.title || 'Link'}
                                         </a>
                                     </li>
                                 ))}
                             </ul>
                         </div>
                     )}
                 </div>
             )}
         </div>
    );
}

export default ConversationView;