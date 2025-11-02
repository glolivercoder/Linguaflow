
import React from 'react';
import { Settings, VoiceGender } from '../types';
import { SUPPORTED_LANGUAGES } from '../constants';

interface SettingsViewProps {
  settings: Settings;
  onSettingsChange: (newSettings: Settings) => void;
  onBack: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSettingsChange, onBack }) => {
  
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
      
      <div className="space-y-6 max-w-md">
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