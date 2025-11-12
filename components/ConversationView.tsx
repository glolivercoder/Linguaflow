


import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
// FIX: Import the 'decode' function to handle audio data from the server.
import { encode, decodeAudioData, decode } from '../services/geminiService';
import { Settings, Flashcard, LanguageCode } from '../types';
import { SUPPORTED_LANGUAGES, VOICE_CONFIG } from '../constants';
import * as Icons from './icons';
import { getPhonetics, translateText, getPronunciationCorrection, getGroundedAnswer } from '../services/geminiService';
import { PROXY_WS_URL } from '../services/proxyClient';

type CategoryKey = 'immigration' | 'hospital' | 'supermarket' | 'restaurant';

interface QAItem {
    question: string;
    answer: string;
}

interface QASection {
    type: 'qa';
    heading: string;
    items: QAItem[];
}

interface PhraseSection {
    type: 'phrases';
    heading: string;
    items: string[];
}

type CategorySection = QASection | PhraseSection;

interface CategoryDefinition {
    key: CategoryKey;
    title: string;
    description: string;
    roleInstruction: string;
    kickoffPrompt: string;
    sections: CategorySection[];
}

type TranslatedCategories = Record<CategoryKey, CategoryDefinition>;

const CATEGORY_DEFINITIONS: Record<CategoryKey, CategoryDefinition> = {
    immigration: {
        key: 'immigration',
        title: 'Entrevista na imigração',
        description: 'Pratique responder perguntas comuns durante a inspeção de imigração ao chegar em um novo país.',
        roleInstruction: 'Aja como um agente de imigração cordial, porém atento, conduzindo a entrevista inicial com o viajante.',
        kickoffPrompt: 'Vamos praticar uma entrevista de imigração. Eu serei o agente e você é o viajante chegando agora.',
        sections: [
            {
                type: 'qa',
                heading: 'Perguntas essenciais',
                items: [
                    { question: 'Qual é o motivo da sua viagem?', answer: 'Estou aqui a turismo por duas semanas.' },
                    { question: 'Onde você ficará hospedado?', answer: 'Ficarei no Hotel Central, no centro da cidade.' },
                    { question: 'Quanto tempo pretende ficar no país?', answer: 'Permanecerei 14 dias e retorno no dia 20 de julho.' },
                    { question: 'Você tem passagem de retorno?', answer: 'Sim, meu voo de volta está reservado para 20 de julho.' },
                    { question: 'Quanto dinheiro você está trazendo?', answer: 'Tenho 1.500 dólares em espécie e cartões de crédito.' },
                    { question: 'Você já visitou nosso país antes?', answer: 'Esta é a minha primeira visita.' },
                    { question: 'Você tem familiares ou amigos aqui?', answer: 'Não, estou viajando sozinho.' },
                    { question: 'Qual é a sua profissão?', answer: 'Sou analista de sistemas no Brasil.' },
                    { question: 'Você trouxe alimentos ou produtos proibidos?', answer: 'Não, apenas itens pessoais e roupas.' },
                    { question: 'Qual é o endereço da sua hospedagem?', answer: 'Rua Principal, 123, Hotel Central.' },
                    { question: 'Você possui seguro viagem?', answer: 'Sim, tenho cobertura internacional pelo plano TravelCare.' },
                    { question: 'Qual é o seu itinerário durante a estadia?', answer: 'Pretendo visitar museus, parques e os principais pontos turísticos.' },
                ],
            },
        ],
    },
    hospital: {
        key: 'hospital',
        title: 'Hospital',
        description: 'Use frases úteis para explicar sintomas, pedir ajuda e responder perguntas em um pronto atendimento.',
        roleInstruction: 'Comporte-se como um profissional de triagem em um hospital, ajudando o paciente a descrever sintomas e oferecendo orientações.',
        kickoffPrompt: 'Estamos em um hospital. Eu serei o profissional de triagem e vou ajudá-lo a explicar seus sintomas.',
        sections: [
            {
                type: 'qa',
                heading: 'Perguntas de triagem',
                items: [
                    { question: 'Qual é o problema principal hoje?', answer: 'Estou sentindo dores fortes no estômago desde ontem.' },
                    { question: 'Quando os sintomas começaram?', answer: 'Começaram há cerca de doze horas.' },
                    { question: 'Você tem alergia a algum medicamento?', answer: 'Não tenho alergias conhecidas.' },
                    { question: 'Você está tomando algum remédio agora?', answer: 'Estou tomando apenas um analgésico leve.' },
                    { question: 'Você tem febre ou calafrios?', answer: 'Sim, tive febre durante a noite.' },
                    { question: 'Como você avaliaria sua dor de zero a dez?', answer: 'Diria que a dor está em oito.' },
                    { question: 'Você já passou por alguma cirurgia recente?', answer: 'Não, nunca fiz cirurgia.' },
                    { question: 'Você tem alguma condição médica crônica?', answer: 'Tenho pressão alta controlada com medicamentos.' },
                ],
            },
            {
                type: 'phrases',
                heading: 'Sintomas para mencionar',
                items: [
                    'Estou com tontura e visão turva.',
                    'Tenho dificuldade para respirar.',
                    'Sinto dormência no braço esquerdo.',
                    'Estou com náusea e falta de apetite.',
                    'Tenho tosse seca há vários dias.',
                    'Meu joelho está inchado e quente.',
                ],
            },
        ],
    },
    supermarket: {
        key: 'supermarket',
        title: 'Supermercado',
        description: 'Aprenda como pedir ajuda para encontrar itens comuns no mercado e praticar vocabulário de compras.',
        roleInstruction: 'Finja ser um atendente prestativo de supermercado, oferecendo opções e recomendações de produtos.',
        kickoffPrompt: 'Estamos em um supermercado. Vou ajudá-lo a encontrar os itens da sua lista.',
        sections: [
            {
                type: 'phrases',
                heading: 'Pedidos úteis',
                items: [
                    'Você pode me mostrar onde ficam as frutas frescas?',
                    'Preciso encontrar verduras para fazer uma salada.',
                    'Onde estão os biscoitos mais populares?',
                    'Vocês têm refrigerantes sem açúcar?',
                    'Pode me ajudar a localizar a seção de sardinhas enlatadas?',
                    'Estou procurando frango fresco para o jantar.',
                    'Tem alguma promoção em frutas da estação?',
                    'Qual é a diferença entre essas marcas de biscoito?',
                    'Pode pesar um quilo de bananas para mim?',
                    'Vocês têm opções de verduras orgânicas?',
                    'Qual refrigerante você recomenda para acompanhar um churrasco?',
                    'Onde posso encontrar temperos para o frango?',
                ],
            },
        ],
    },
    restaurant: {
        key: 'restaurant',
        title: 'Restaurante',
        description: 'Simule pedidos no restaurante e pratique como solicitar pratos e esclarecer preferências.',
        roleInstruction: 'Aja como um garçom atencioso, sugerindo combinações e confirmando pedidos com o cliente.',
        kickoffPrompt: 'Estamos em um restaurante. Sou o garçom e vou ajudá-lo a escolher o prato ideal.',
        sections: [
            {
                type: 'phrases',
                heading: 'Pedidos comuns',
                items: [
                    'Eu gostaria de pedir batatas fritas crocantes, por favor.',
                    'Pode trazer um bife acebolado ao ponto médio?',
                    'Quero uma porção de arroz branco.',
                    'Você pode adicionar um purê de batata cremoso?',
                    'Gostaria de um prato de peixe grelhado com limão.',
                    'Tem alguma sugestão de acompanhamento para o bife?',
                    'Pode servir as batatas fritas sem sal?',
                    'O purê contém leite ou creme?',
                    'Qual peixe está mais fresco hoje?',
                    'Poderia trocar o arroz por legumes cozidos?',
                    'Pode trazer molho extra para o frango?',
                    'Gostaria de uma recomendação de bebida que combine com o peixe.',
                ],
            },
        ],
    },
};

const CATEGORY_KEYS: CategoryKey[] = ['immigration', 'hospital', 'supermarket', 'restaurant'];

const BASE_CATEGORY_LANGUAGE_NAME = 'Português (BR)';

const LANGUAGE_FLAG_MAP: Record<LanguageCode, string> = {
    'pt-BR': '🇧🇷',
    'en-US': '🇺🇸',
    'es-ES': '🇪🇸',
    'zh-CN': '🇨🇳',
    'ja-JP': '🇯🇵',
    'ru-RU': '🇷🇺',
    'fr-FR': '🇫🇷',
    'it-IT': '🇮🇹',
    'eo': '🏳️',
};

const getFlagEmoji = (code: LanguageCode): string => LANGUAGE_FLAG_MAP[code] ?? '🌐';

const getLanguageDisplayName = (code: LanguageCode): string =>
    SUPPORTED_LANGUAGES.find((l) => l.code === code)?.name || code;

const cloneCategoryDefinitions = (source: Record<CategoryKey, CategoryDefinition>): TranslatedCategories => {
    const clone: Partial<TranslatedCategories> = {};
    CATEGORY_KEYS.forEach((key) => {
        const definition = source[key];
        clone[key] = {
            ...definition,
            sections: definition.sections.map((section) =>
                section.type === 'qa'
                    ? {
                        ...section,
                        items: section.items.map((item) => ({ ...item })),
                    }
                    : {
                        ...section,
                        items: [...section.items],
                    }
            ),
        };
    });
    return clone as TranslatedCategories;
};

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
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [selectedCategoryKey, setSelectedCategoryKey] = useState<CategoryKey | null>(null);
    const [categoryPanelVisible, setCategoryPanelVisible] = useState(false);
    const [useTranslatedCategories, setUseTranslatedCategories] = useState(() => settings.learningLanguage !== 'pt-BR');
    const [translatedCategories, setTranslatedCategories] = useState<TranslatedCategories>(() => cloneCategoryDefinitions(CATEGORY_DEFINITIONS));
    const [isTranslatingCategories, setIsTranslatingCategories] = useState(false);

    const socketRef = useRef<WebSocket | null>(null);
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
    const translationCacheRef = useRef<Record<string, string>>({});
    const translatedByLangRef = useRef<Record<LanguageCode, TranslatedCategories>>({});
    const userTranscriptRef = useRef('');
    const modelTranscriptRef = useRef('');

    const learningLanguageName = useMemo(
        () => SUPPORTED_LANGUAGES.find((l) => l.code === settings.learningLanguage)?.name || settings.learningLanguage,
        [settings.learningLanguage]
    );

    const nativeLangName = useMemo(
        () => SUPPORTED_LANGUAGES.find((l) => l.code === settings.nativeLanguage)?.name || settings.nativeLanguage,
        [settings.nativeLanguage]
    );

    const ensureCategoryTranslations = useCallback(async (targetLangCode: LanguageCode, targetLangName: string) => {
        if (targetLangCode === 'pt-BR') {
            setTranslatedCategories((prev) => prev);
            setIsTranslatingCategories(false);
            return;
        }

        if (translatedByLangRef.current[targetLangCode]) {
            setTranslatedCategories(translatedByLangRef.current[targetLangCode]);
            setIsTranslatingCategories(false);
            return;
        }

        setIsTranslatingCategories(true);
        const translated: Partial<TranslatedCategories> = {};

        const translateValue = async (text: string) => {
            if (!text.trim()) return text;
            const cacheKey = `${targetLangCode}::${text}`;
            if (translationCacheRef.current[cacheKey]) {
                return translationCacheRef.current[cacheKey];
            }
            try {
                const translatedText = await translateText(text, BASE_CATEGORY_LANGUAGE_NAME, targetLangName);
                const sanitized = translatedText && translatedText !== 'Erro na tradução.' ? translatedText : text;
                translationCacheRef.current[cacheKey] = sanitized;
                return sanitized;
            } catch (error) {
                console.error('Erro ao traduzir texto da categoria:', error);
                return text;
            }
        };

        for (const key of CATEGORY_KEYS) {
            const definition = CATEGORY_DEFINITIONS[key];
            const sections = await Promise.all(
                definition.sections.map(async (section): Promise<CategorySection> => {
                    if (section.type === 'qa') {
                        const translatedItems = await Promise.all(
                            section.items.map(async (item) => ({
                                question: await translateValue(item.question),
                                answer: await translateValue(item.answer),
                            }))
                        );
                        return {
                            ...section,
                            heading: await translateValue(section.heading),
                            items: translatedItems,
                        } as QASection;
                    }
                    const translatedItems = await Promise.all(section.items.map(translateValue));
                    return {
                        ...section,
                        heading: await translateValue(section.heading),
                        items: translatedItems,
                    } as PhraseSection;
                })
            );

            translated[key] = {
                ...definition,
                title: await translateValue(definition.title),
                description: await translateValue(definition.description),
                roleInstruction: await translateValue(definition.roleInstruction),
                kickoffPrompt: await translateValue(definition.kickoffPrompt),
                sections,
            };
        }

        translatedByLangRef.current[targetLangCode] = translated as TranslatedCategories;
        setTranslatedCategories(translated as TranslatedCategories);
        setIsTranslatingCategories(false);
    }, []);

    useEffect(() => {
        if (!useTranslatedCategories || !learningLanguageName) {
            setIsTranslatingCategories(false);
            return;
        }

        ensureCategoryTranslations(settings.learningLanguage, learningLanguageName).catch((error) => {
            console.error('Falha ao preparar traduções de categorias:', error);
            setIsTranslatingCategories(false);
        });
    }, [ensureCategoryTranslations, learningLanguageName, settings.learningLanguage, useTranslatedCategories]);

    const activeCategoryDefinition = selectedCategoryKey ? CATEGORY_DEFINITIONS[selectedCategoryKey] : null;
    const activeTranslatedCategory = selectedCategoryKey ? translatedCategories[selectedCategoryKey] : null;

    const stopConversation = useCallback(() => {
        socketRef.current?.close();
        socketRef.current = null;

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
        userTranscriptRef.current = '';
        modelTranscriptRef.current = '';
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
            
            const nativeLang = nativeLangName;
            const learningLang = learningLanguageName;

            // Safely access voice configuration to prevent crashes from invalid settings
            const voiceLanguageConfig = VOICE_CONFIG[settings.learningLanguage] || VOICE_CONFIG['en-US'];
            const voiceName = voiceLanguageConfig[settings.voiceGender] || voiceLanguageConfig.female || 'Kore';


            const ws = new WebSocket(PROXY_WS_URL);
            socketRef.current = ws;

            ws.onopen = () => {
                if (!inputAudioContextRef.current || !mediaStreamRef.current) {
                    return;
                }

                const setupPayload = {
                    type: 'setup',
                    payload: {
                        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                        config: {
                            responseModalities: ['AUDIO'],
                            inputAudioTranscription: {},
                            outputAudioTranscription: {},
                            systemInstruction: `Você é um parceiro de conversação bilíngue. O usuário fala ${nativeLang} e você responde em ${learningLang}. Mantenha as respostas curtas e conversacionais.${activeCategoryDefinition ? ` Contexto da simulação: ${activeCategoryDefinition.roleInstruction} Use perguntas e respostas condizentes com este cenário e encoraje o usuário a praticar o vocabulário correspondente.` : ''}`,
                            speechConfig: {
                                voiceConfig: { prebuiltVoiceConfig: { voiceName } },
                            },
                        },
                    },
                };
                ws.send(JSON.stringify(setupPayload));

                const source = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                scriptProcessorRef.current.onaudioprocess = (event) => {
                    const inputData = event.inputBuffer.getChannelData(0);
                    const audioBuffer = new Int16Array(inputData.map((v) => v * 32768));
                    ws.send(
                        JSON.stringify({
                            type: 'audio',
                            data: encode(new Uint8Array(audioBuffer.buffer)),
                        }),
                    );
                };
                source.connect(scriptProcessorRef.current);
                scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);

                setIsSessionActive(true);
                setStatus(activeTranslatedCategory ? `Cenário "${activeTranslatedCategory.title}" ativo. Pode falar!` : 'Conectado. Pode falar!');

                if (activeCategoryDefinition) {
                    ws.send(
                        JSON.stringify({
                            type: 'client-content',
                            text: activeCategoryDefinition.kickoffPrompt,
                        }),
                    );
                }
            };

            ws.onmessage = async (event) => {
                try {
                    const message = JSON.parse(event.data as string);

                    if (message?.serverContent?.inputTranscription?.text) {
                        const text = message.serverContent.inputTranscription.text;
                        setUserTranscript((prev) => {
                            const next = prev + text;
                            userTranscriptRef.current = next;
                            return next;
                        });
                    }

                    if (message?.serverContent?.outputTranscription?.text) {
                        const text = message.serverContent.outputTranscription.text;
                        setModelTranscript((prev) => {
                            const next = prev + text;
                            modelTranscriptRef.current = next;
                            return next;
                        });
                    }

                    if (message?.serverContent?.turnComplete) {
                        setLastTurn({
                            user: userTranscriptRef.current,
                            model: modelTranscriptRef.current,
                        });
                        setUserTranscript('');
                        setModelTranscript('');
                        userTranscriptRef.current = '';
                        modelTranscriptRef.current = '';
                    }

                    const audioData = message?.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (audioData && outputAudioContextRef.current) {
                        const outputAudioContext = outputAudioContextRef.current;
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
                        const buffer = await decodeAudioData(decode(audioData), outputAudioContext, 24000, 1);
                        const source = outputAudioContext.createBufferSource();
                        source.buffer = buffer;
                        source.connect(outputAudioContext.destination);
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += buffer.duration;
                        audioSourcesRef.current.add(source);
                        source.onended = () => audioSourcesRef.current.delete(source);
                    }

                    if (message?.serverContent?.interrupted) {
                        audioSourcesRef.current.forEach((source) => source.stop());
                        audioSourcesRef.current.clear();
                        nextStartTimeRef.current = 0;
                    }
                } catch (error) {
                    console.error('Erro ao processar mensagem do proxy Gemini:', error);
                }
            };

            ws.onerror = (event) => {
                console.error('Erro no WebSocket de conversação:', event);
                setStatus('Erro na sessão de conversa. Tente novamente.');
                stopConversation();
            };

            ws.onclose = () => {
                stopConversation();
            };
        } catch (error) {
            console.error('Failed to start conversation:', error);
            setStatus('Falha ao iniciar. Verifique as permissões.');
        }
    }, [activeCategoryDefinition, activeTranslatedCategory, isSessionActive, learningLanguageName, nativeLangName, settings, stopConversation]);

    useEffect(() => {
        return () => { stopConversation(); };
    }, [stopConversation]);

    const handleAddFlashcard = async () => {
        if (!lastTurn) return;
        setStatus('Criando flashcard...');
        // The user speaks in native, model replies in learning.
        const originalText = lastTurn.user;
        const translatedText = lastTurn.model;

        const phoneticText = await getPhonetics(translatedText, learningLanguageName, nativeLangName);

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

    const handleSelectCategory = useCallback((categoryKey: CategoryKey) => {
        setSelectedCategoryKey(categoryKey);
        setIsCategoryModalOpen(false);
        setCategoryPanelVisible(true);
        const translated = translatedCategories[categoryKey];
        setStatus(`Categoria "${translated?.title || CATEGORY_DEFINITIONS[categoryKey].title}" selecionada. Inicie ou continue a conversa dentro desse cenário.`);

        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            const message = translated?.kickoffPrompt || CATEGORY_DEFINITIONS[categoryKey].kickoffPrompt;
            socketRef.current.send(JSON.stringify({ type: 'client-content', text: message }));
        }
    }, [translatedCategories]);

    const translationButtonLabel = useMemo(() => {
        const flag = getFlagEmoji(settings.nativeLanguage);
        return useTranslatedCategories ? `${flag} Ver em Português` : `${flag} Traduzir`;
    }, [useTranslatedCategories, settings.nativeLanguage]);

    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            <div className="flex flex-col lg:flex-row gap-6 flex-grow">
                {categoryPanelVisible && activeCategoryDefinition && (
                    <aside className="lg:w-80 xl:w-96 flex-shrink-0 bg-gray-800 border border-gray-700 rounded-xl p-4 flex flex-col gap-4 h-full max-h-[calc(100vh-6rem)]">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-white">
                                    {(useTranslatedCategories ? activeTranslatedCategory?.title : activeCategoryDefinition.title) || activeCategoryDefinition.title}
                                </h2>
                                <p className="text-sm text-gray-300">
                                    {(useTranslatedCategories ? activeTranslatedCategory?.description : activeCategoryDefinition.description) || activeCategoryDefinition.description}
                                </p>
                            </div>
                            <button
                                onClick={() => setCategoryPanelVisible(false)}
                                className="text-gray-400 hover:text-gray-200"
                                title="Ocultar painel"
                            >
                                <Icons.XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs uppercase tracking-wide text-gray-400">Referência visual</span>
                            <button
                                onClick={() => setUseTranslatedCategories((prev) => !prev)}
                                className={`px-3 py-1 text-sm rounded-md border ${useTranslatedCategories ? 'border-cyan-500 text-cyan-300 bg-cyan-900/30' : 'border-gray-600 text-gray-200 bg-gray-700/40'}`}
                                title={useTranslatedCategories ? 'Mostrar conteúdo em português' : `Traduzir para ${getLanguageDisplayName(settings.learningLanguage)}`}
                            >
                                {translationButtonLabel}
                            </button>
                        </div>
                        {isTranslatingCategories && useTranslatedCategories && (
                            <p className="text-xs text-cyan-300">Traduzindo conteúdo...</p>
                        )}
                        <div className="space-y-4 overflow-y-auto pr-2">
                            {activeCategoryDefinition.sections.map((section, index) => {
                                const translatedSection = activeTranslatedCategory?.sections[index];
                                const heading = useTranslatedCategories ? translatedSection?.heading : section.heading;
                                const items = useTranslatedCategories ? translatedSection?.items ?? section.items : section.items;
                                return (
                                    <div key={index} className="bg-gray-900/60 border border-gray-700 rounded-lg p-3 space-y-2">
                                        <h3 className="text-sm font-semibold text-cyan-300">{heading}</h3>
                                        {section.type === 'qa' ? (
                                            <ul className="space-y-2 text-sm text-gray-200">
                                                {(items as QAItem[]).map((item, itemIndex) => (
                                                    <li key={itemIndex} className="border border-gray-700 rounded-md p-2 bg-gray-900/40">
                                                        <p className="font-medium text-white">{item.question}</p>
                                                        <p className="text-gray-300">{item.answer}</p>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <ul className="space-y-1 text-sm text-gray-200 list-disc list-inside">
                                                {(items as string[]).map((item, itemIndex) => (
                                                    <li key={itemIndex}>{item}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </aside>
                )}

                <div className="flex flex-col gap-4 flex-1">
                    <div className="w-full max-w-2xl mx-auto lg:mx-0 bg-gray-800 p-6 rounded-lg shadow-lg">
                        <p className="text-center text-cyan-400 mb-4">{status}</p>
                        <div className="text-center mb-6 flex flex-col items-center gap-4">
                            <button
                                onClick={isSessionActive ? stopConversation : startConversation}
                                className={`p-4 rounded-full transition-all duration-300 ${isSessionActive ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-green-600 hover:bg-green-700'}`}
                            >
                                {isSessionActive ? <Icons.StopIcon className="w-8 h-8 text-white" /> : <Icons.MicIcon className="w-8 h-8 text-white" />}
                            </button>
                            <div className="flex flex-wrap justify-center gap-2">
                                <button
                                    onClick={() => setIsCategoryModalOpen(true)}
                                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-md"
                                >
                                    Categorias
                                </button>
                                {selectedCategoryKey && (
                                    <>
                                        <button
                                            onClick={() => setCategoryPanelVisible((prev) => !prev)}
                                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-md"
                                        >
                                            {categoryPanelVisible ? 'Ocultar guia' : 'Mostrar guia'}
                                        </button>
                                        <span className="text-sm text-gray-300 border border-cyan-600/40 rounded-full px-3 py-1">
                                            Cenário: {translatedCategories[selectedCategoryKey]?.title || CATEGORY_DEFINITIONS[selectedCategoryKey].title}
                                        </span>
                                    </>
                                )}
                            </div>
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
                    <div className="flex flex-col gap-4">
                        <PronunciationPractice settings={settings}/>
                        <GroundedSearch/>
                    </div>
                </div>
            </div>

            {isCategoryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
                    <div className="w-full max-w-4xl max-h-[85vh] overflow-y-auto bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-semibold text-cyan-400">Categorias de conversa</h2>
                            <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400 hover:text-gray-200">
                                <Icons.XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        {isTranslatingCategories && (
                            <p className="text-sm text-gray-300">Traduzindo conteúdo para {learningLanguageName}...</p>
                        )}
                        <div className="grid gap-4 md:grid-cols-2">
                            {CATEGORY_KEYS.map((key) => {
                                const baseDefinition = CATEGORY_DEFINITIONS[key];
                                const translated = translatedCategories[key];
                                return (
                                    <div key={key} className={`rounded-lg border ${selectedCategoryKey === key ? 'border-cyan-500' : 'border-gray-700'} bg-gray-800 p-4 flex flex-col gap-3`}>
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">{translated?.title || baseDefinition.title}</h3>
                                            <p className="text-sm text-gray-300">{translated?.description || baseDefinition.description}</p>
                                        </div>
                                        <div className="space-y-3">
                                            {baseDefinition.sections.map((section, index) => {
                                                const translatedSection = translated?.sections[index];
                                                return (
                                                    <div key={index} className="bg-gray-900/60 border border-gray-700 rounded-md p-3 space-y-2">
                                                        <h4 className="text-sm font-semibold text-cyan-300">
                                                            {translatedSection?.heading || section.heading}
                                                        </h4>
                                                        {section.type === 'qa' ? (
                                                            <ul className="space-y-2 text-sm text-gray-200">
                                                                {(translatedSection?.items || section.items).map((item, itemIndex) => (
                                                                    <li key={itemIndex} className="border border-gray-700 rounded-md p-2 bg-gray-900/40">
                                                                        <p className="font-medium text-white">{(item as QAItem).question}</p>
                                                                        <p className="text-gray-300">{(item as QAItem).answer}</p>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <ul className="space-y-1 text-sm text-gray-200 list-disc list-inside">
                                                                {(translatedSection?.items || section.items).map((item, itemIndex) => (
                                                                    <li key={itemIndex}>{item as string}</li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <button
                                            onClick={() => handleSelectCategory(key)}
                                            className="mt-auto w-full py-2 px-4 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-md"
                                        >
                                            Praticar esta categoria
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
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