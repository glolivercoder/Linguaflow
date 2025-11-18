# Integração LinguaFlow com Anki Games

Este documento descreve como integrar o Anki Games ao LinguaFlow, permitindo que os usuários joguem com seus baralhos do Anki diretamente do aplicativo.

## Visão Geral

O Anki Games é uma extensão que adiciona jogos educativos ao LinguaFlow, utilizando os mesmos baralhos do Anki para fornecer uma experiência de aprendizado mais interativa e divertida.

## Requisitos

- Python 3.9+
- Node.js 16+
- Anki instalado (para acesso aos baralhos locais)
- Dependências do projeto (instaladas via Poetry)

## Estrutura de Arquivos

```
LinguaFlow/
├── backend/
│   └── anki_games/       # Novo serviço para os jogos
│       ├── __init__.py
│       ├── main.py       # API FastAPI
│       └── games/        # Lógica dos jogos
└── src/
    └── services/
        └── ankiGamesService.ts  # Cliente para a API de jogos
```

## Configuração

1. **Backend (FastAPI)**

Crie um novo serviço em `backend/anki_games/main.py`:

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import subprocess
import os

app = FastAPI()

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/launch")
async def launch_games(deck_id: str = None):
    try:
        games_path = os.path.join("F:", "Projetos2025BKP", "Anki_Games", "anki_games.py")
        cmd = ["python", games_path]
        
        if deck_id:
            cmd.extend(["--deck", deck_id])
            
        subprocess.Popen(cmd, shell=True)
        return {"status": "success", "message": "Anki Games iniciado"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8004)
```

2. **Frontend (React/TypeScript)**

Crie o serviço em `src/services/ankiGamesService.ts`:

```typescript
import { proxyPost } from './api';

export const launchAnkiGames = async (deckId?: string) => {
  try {
    const response = await proxyPost('/anki-games/launch', { 
      deckId,
      timestamp: new Date().toISOString()
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao iniciar Anki Games:', error);
    throw error;
  }
};

export const getAvailableGames = async () => {
  return [
    { id: 'memory', name: 'Jogo da Memória' },
    { id: 'typing', name: 'Teste de Digitação' },
    { id: 'speaking', name: 'Teste de Pronúncia' }
  ];
};
```

## Integração com a Interface

Adicione um botão de jogos no componente `FlashcardsView.tsx`:

```tsx
import { Gamepad2 } from 'lucide-react';
import { launchAnkiGames } from '../services/ankiGamesService';

// Dentro do seu componente
const FlashcardsView: React.FC = () => {
  // ...outro código...
  
  const handlePlayGames = async () => {
    try {
      await launchAnkiGames(currentDeckId);
      toast.success('Iniciando Anki Games...');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Não foi possível iniciar os jogos');
    }
  };

  return (
    <div className="flashcards-container">
      {/* Botão de jogos */}
      <button
        onClick={handlePlayGames}
        className="game-button"
        title="Jogar com este baralho"
      >
        <Gamepad2 size={20} />
        <span>Jogar</span>
      </button>
      
      {/* Resto do seu componente */}
    </div>
  );
};
```

## Estilos CSS

Adicione estilos em seu arquivo CSS principal:

```css
/* Estilo do botão de jogos */
.game-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.game-button:hover {
  background-color: #4338ca;
}

.game-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

## Configuração do Proxy

Atualize o arquivo de configuração do proxy para incluir as rotas do Anki Games:

```javascript
// vite.config.ts ou similar
export default defineConfig({
  // ...outras configurações...
  server: {
    proxy: {
      '/anki-games': {
        target: 'http://localhost:8004',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/anki-games/, '')
      }
    }
  }
});
```

## Inicialização do Serviço

Adicione um script ao seu `package.json` para iniciar o serviço de jogos:

```json
{
  "scripts": {
    "dev:games": "python -m backend.anki_games.main",
    "dev:all": "concurrently \"npm run dev\" \"npm run dev:games\""
  }
}
```

## Fluxo de Uso

1. O usuário seleciona um baralho no LinguaFlow
2. Clica no botão "Jogar"
3. O frontend faz uma requisição para o backend
4. O backend inicia o Anki Games com o baralho selecionado
5. O jogo é aberto em uma nova janela
6. O progresso do jogo é salvo e sincronizado com o Anki

## Próximos Passos

1. Implementar a lógica dos jogos individuais
2. Adicionar suporte a diferentes tipos de mídia (áudio, imagens)
3. Desenvolver sistema de pontuação e conquistas
4. Criar relatórios de progresso

## Solução de Problemas

### Erro: "Falha ao conectar ao serviço de jogos"
- Verifique se o serviço está rodando na porta 8004
- Confirme se o CORS está configurado corretamente
- Verifique os logs do servidor para mensagens de erro

### O jogo não inicia
- Verifique se o caminho para o executável do jogo está correto
- Confira as permissões de arquivo
- Verifique se todas as dependências estão instaladas

## Contribuição

Para contribuir com o desenvolvimento do Anki Games, consulte o guia de contribuição no repositório do projeto.
