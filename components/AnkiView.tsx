import React from 'react';
import { Settings } from '../types';

interface AnkiViewProps {
    settings: Settings;
    onBack: () => void;
}

const AnkiView: React.FC<AnkiViewProps> = ({ settings, onBack }) => {
    return (
        <div className="h-full flex flex-col bg-gray-900">
            <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-cyan-400">Anki - Gerenciador de Baralhos</h2>
                <button
                    onClick={onBack}
                    className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-colors"
                >
                    Voltar
                </button>
            </div>

            <div className="flex-1 relative">
                <iframe
                    src="http://localhost:3002"
                    className="absolute inset-0 w-full h-full border-0"
                    title="Anki Basic Application"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                />
            </div>

            <div className="p-2 bg-gray-800 border-t border-gray-700 text-center text-xs text-gray-500">
                Powered by Anki Basic - Importador de baralhos .apkg
            </div>
        </div>
    );
};

export default AnkiView;
