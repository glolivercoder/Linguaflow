
import React from 'react';
import { Settings, VoiceGender, AnkiDeckSummary } from '../types';
import { SUPPORTED_LANGUAGES } from '../constants';

interface SettingsViewProps {
  settings: Settings;
  ankiDecks: AnkiDeckSummary[];
  onSettingsChange: (newSettings: Settings) => void;
  onRemoveAnkiDeck: (deckId: string) => void;
  onBack: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, ankiDecks, onSettingsChange, onRemoveAnkiDeck, onBack }) => {
  
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    onSettingsChange({
      ...settings,
      [name]: value,
    });
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col animate-fade-in">
      <h2 className="text-2xl font-bold mb-6 text-cyan-400">Configurações</h2>
      
      <div className="space-y-6 max-w-2xl">
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