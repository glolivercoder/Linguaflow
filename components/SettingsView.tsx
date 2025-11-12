
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Settings, VoiceGender, AnkiDeckSummary, VoiceModelInfo } from '../types';
import { SUPPORTED_LANGUAGES } from '../constants';
import { generateReferenceAudio, listVoiceModels } from '../services/pronunciationService';

interface SettingsViewProps {
  settings: Settings;
  ankiDecks: AnkiDeckSummary[];
  onSettingsChange: (newSettings: Settings) => void;
  onRemoveAnkiDeck: (deckId: string) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => Promise<void>;
  onBack: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, ankiDecks, onSettingsChange, onRemoveAnkiDeck, onExportBackup, onImportBackup, onBack }) => {
  
  const [voiceModels, setVoiceModels] = useState<VoiceModelInfo[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [testText, setTestText] = useState('Hello everyone! Welcome to LinguaFlow.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [generatedModel, setGeneratedModel] = useState<string | null>(null);
  const backupFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const loadVoiceModels = async () => {
      try {
        setIsLoadingModels(true);
        setModelsError(null);
        const models = await listVoiceModels();
        setVoiceModels(models);
      } catch (error) {
        console.error('Failed to load Piper voice models:', error);
        setModelsError('Não foi possível carregar os modelos de voz do Piper.');
      } finally {
        setIsLoadingModels(false);
      }
    };

    loadVoiceModels();
  }, []);

  const handleModelChange = (value: string) => {
    onSettingsChange({
      ...settings,
      piperVoiceModel: value || undefined,
    });
  };

  const selectedVoiceLabel = useMemo(() => {
    if (!settings.piperVoiceModel) {
      return 'Padrão (en_US-lessac-medium)';
    }
    const info = voiceModels.find(model => model.key === settings.piperVoiceModel);
    if (!info) {
      return settings.piperVoiceModel;
    }
    const languageLabel = info.language?.toUpperCase() ?? 'Idioma desconhecido';
    const qualityLabel = info.quality ? info.quality.toUpperCase() : 'Qualidade indefinida';
    return `${info.key} • ${languageLabel} • ${qualityLabel}`;
  }, [settings.piperVoiceModel, voiceModels]);

  const handleGenerateTestAudio = async () => {
    try {
      setIsGenerating(true);
      setGeneratedUrl(null);
      setGeneratedModel(null);
      const response = await generateReferenceAudio(testText, settings.piperVoiceModel ? settings.piperVoiceModel : undefined);
      if (response.audio_url) {
        setGeneratedUrl(response.audio_url);
        setGeneratedModel(response.voice_model ?? settings.piperVoiceModel ?? 'default');
      }
    } catch (error) {
      console.error('Failed to generate test audio:', error);
      window.alert(error instanceof Error ? error.message : 'Falha ao gerar áudio de teste.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    onSettingsChange({
      ...settings,
      [name]: value,
    });
  };

  const handleBackupImportClick = () => {
    backupFileInputRef.current?.click();
  };

  const handleBackupFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await onImportBackup(file);
    } catch (error) {
      console.error('Falha ao importar backup:', error);
      window.alert('Falha ao importar backup. Verifique se o arquivo é válido.');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col animate-fade-in">
      <h2 className="text-2xl font-bold mb-6 text-cyan-400">Configurações</h2>
      
      <div className="space-y-6 max-w-2xl">
        <div className="p-4 bg-gray-800 rounded-lg space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-200">Backup e Restauração</h3>
            <p className="text-xs text-gray-400 mt-1">
              Salve todas as configurações, flashcards, imagens sobrescritas, traduções e dados do Anki em um único arquivo.
              Ao exportar, o navegador abrirá a caixa de "Salvar como" para você escolher a pasta.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onExportBackup}
              className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-md transition-colors"
            >
              Exportar backup
            </button>
            <button
              onClick={handleBackupImportClick}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-md transition-colors"
            >
              Restaurar de arquivo
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Recomenda-se guardar o arquivo em um diretório seguro e manter cópias de versões anteriores.
          </p>
          <input
            ref={backupFileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleBackupFileChange}
          />
        </div>

        <div>
          <label htmlFor="nativeLanguage" className="block text-sm font-medium text-gray-300 mb-2">
            Minha língua nativa
          </label>
          <select
            id="nativeLanguage"
            name="nativeLanguage"
            value={settings.nativeLanguage}
            onChange={handleSelectChange}
            className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="learningLanguage" className="block text-sm font-medium text-gray-300 mb-2">
            Quero aprender
          </label>
          <select
            id="learningLanguage"
            name="learningLanguage"
            value={settings.learningLanguage}
            onChange={handleSelectChange}
            className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Gênero da Voz (TTS)
          </label>
          <div className="flex space-x-4">
            {(['female', 'male', 'neutral'] as VoiceGender[]).map((gender) => (
              <button
                key={gender}
                onClick={() => onSettingsChange({ ...settings, voiceGender: gender })}
                className={`px-4 py-2 rounded-md transition-colors ${
                  settings.voiceGender === gender
                    ? 'bg-cyan-600 text-white font-semibold'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {gender === 'female' ? 'Feminina' : gender === 'male' ? 'Masculina' : 'Neutra'}
              </button>
            ))}
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-gray-800 rounded-lg text-sm">
          <h4 className="font-semibold text-gray-300 mb-2">Configuração das Chaves de API</h4>
          <p className="text-xs text-gray-400">
            Sua chave de API do Google Gemini e do Pixabay são configuradas de forma segura através de variáveis de ambiente e não precisam ser inseridas aqui.
          </p>
        </div>

        <div className="space-y-4 p-4 bg-gray-800 rounded-lg">
          <div>
            <h3 className="text-lg font-semibold text-gray-200 mb-2">Piper TTS</h3>
            <p className="text-xs text-gray-400">
              Ajuste o modelo de voz do Piper e teste a síntese de voz diretamente do navegador. As alterações são salvas automaticamente nas configurações da conta local.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="piperVoiceModel" className="block text-sm font-medium text-gray-300">
              Modelo de voz
            </label>
            <select
              id="piperVoiceModel"
              name="piperVoiceModel"
              value={settings.piperVoiceModel ?? ''}
              onChange={event => handleModelChange(event.target.value)}
              className="w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              disabled={isLoadingModels}
            >
              <option value="">Padrão (en_US-lessac-medium)</option>
              {voiceModels.map(model => (
                <option key={model.key} value={model.key}>
                  {model.key} • {model.language?.toUpperCase()} {model.quality ? `• ${model.quality}` : ''}
                </option>
              ))}
            </select>
            {isLoadingModels && (
              <p className="text-xs text-gray-400">Carregando modelos disponíveis...</p>
            )}
            {modelsError && (
              <p className="text-xs text-rose-400">{modelsError}</p>
            )}
            {!isLoadingModels && !modelsError && voiceModels.length === 0 && (
              <p className="text-xs text-gray-500">Nenhum modelo adicional encontrado. Certifique-se de que os arquivos .onnx estão na pasta <code className="bg-gray-900 px-1 rounded">backend/pronunciation/models</code>.</p>
            )}
            <p className="text-xs text-gray-400">Modelo selecionado: {selectedVoiceLabel}</p>
          </div>

          <div className="space-y-3">
            <label htmlFor="piperTestText" className="block text-sm font-medium text-gray-300">
              Texto para teste
            </label>
            <textarea
              id="piperTestText"
              value={testText}
              onChange={event => setTestText(event.target.value)}
              rows={3}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Digite um texto para sintetizar..."
            />

            <div className="flex items-center gap-3">
              <button
                onClick={handleGenerateTestAudio}
                disabled={isGenerating || !testText.trim()}
                className="inline-flex items-center gap-2 rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-60"
              >
                {isGenerating ? 'Gerando...' : 'Gerar áudio de teste'}
              </button>
              {generatedUrl && (
                <a
                  href={generatedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-cyan-400 hover:text-cyan-300"
                >
                  Abrir áudio gerado ({generatedModel})
                </a>
              )}
            </div>

            {generatedUrl && (
              <div className="rounded-md border border-gray-700 bg-gray-900 p-3 text-xs text-gray-300">
                <p>Áudio gerado com sucesso!</p>
                <p className="mt-1 break-all">URL: {generatedUrl}</p>
                <p className="mt-1">Modelo utilizado: {generatedModel ?? 'desconhecido'}</p>
                <audio controls className="mt-2 w-full">
                  <source src={generatedUrl} type="audio/wav" />
                  Seu navegador não suporta reprodução de áudio.
                </audio>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-800 rounded-lg">
          <h4 className="font-semibold text-gray-300 mb-3">Baralhos importados do Anki</h4>
          {ankiDecks.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum baralho do Anki importado até o momento.</p>
          ) : (
            <ul className="space-y-3">
              {ankiDecks.map(deck => (
                <li key={deck.id} className="flex items-start justify-between gap-4 bg-gray-900/60 border border-gray-700 rounded-lg p-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{deck.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{deck.cardCount} cards importados</p>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm(`Remover o baralho "${deck.name}" e todos os cards associados?`)) {
                        onRemoveAnkiDeck(deck.id);
                      }
                    }}
                    className="px-3 py-1 text-sm bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors"
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-gray-500 mt-3">
            A remoção exclui todos os cards importados desse baralho, bem como imagens sobrescritas ou dados de pronúncia em cache relacionados.
          </p>
        </div>

      </div>
      
      <div className="mt-auto pt-6">
        <button
          onClick={onBack}
          className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-colors"
        >
          Voltar
        </button>
      </div>
    </div>
  );
};

export default SettingsView;