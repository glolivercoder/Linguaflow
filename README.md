<div align="center">
<img width="1200" height="475" alt="LinguaFlow" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# LinguaFlow – Ambiente Local Completo

Este repositório consolida o frontend e todos os serviços backend necessários para rodar o LinguaFlow com suporte tanto online quanto offline:

- Proxy Node (Gemini/Pixabay)
- Backend de pronúncia (FastAPI + Piper TTS)
- Tradução offline (Argos)
- Serviço de conversação offline (Vosk STT + OpenRouter LLM + Piper TTS)
- Aplicação React

---

## Pré-requisitos

- Node.js 20+
- Python 3.11+
- Pip disponível (via `python -m pip`)
- Ambiente Windows (script `.bat`)

---

## Variáveis de ambiente

1. Copie `.env` para `.env.local` (ou ajuste diretamente).
2. Preencha:
   - `GEMINI_API_KEY`
   - `PIXABAY_API_KEY` (opcional)
   - `VOSK_MODEL_PATH` (ex.: `backend/vosk-models/vosk-model-small-pt-br-0.3`)
   - `OPENROUTER_API_KEY`
   - `OPENROUTER_BASE_URL` (default `https://openrouter.ai/api/v1`)
3. Opcional: configure `OPENROUTER_DEFAULT_MODEL`, `VITE_PROXY_URL`, `VITE_VOSK_URL`, etc.

---

## Instalação de dependências

```
npm install                                 # Frontend e proxy
python -m venv backend/anki_import/venv
backend/anki_import/venv/Scripts/pip install -r backend/anki_import/requirements.txt
backend/pronunciation/setup_piper_venv.bat
python -m pip install -r backend/vosk_service/requirements.txt
```

Baixe o modelo Vosk desejado, extraia para `VOSK_MODEL_PATH` e confirme o caminho.

---

## Inicialização automática

Execute `INICIAR_LINGUAFLOW.bat`. O script iniciará:

1. Proxy (porta 3100)
2. Pronúncia (porta 8000)
3. Vosk STT/LLM (porta 8200)
4. Argos (porta 8100)
5. Frontend (porta 3001)

O navegador será aberto automaticamente em `http://localhost:3001`.

---

## Inicialização manual

```
# Proxy
cd backend/proxy
npm run dev

# Pronúncia
cd backend/pronunciation
venv\Scripts\activate
python -m uvicorn main:app --host 0.0.0.0 --port 8000

# Vosk STT + OpenRouter
python -m uvicorn vosk_service.main:app --host 0.0.0.0 --port 8200

# Argos
cd backend/anki_import
venv\Scripts\activate
python -m uvicorn main:app --host 0.0.0.0 --port 8100

# Frontend
npm run dev
```

---

## Recursos úteis

- Documentação Vosk/OpenRouter: [STT_VOSK.md](STT_VOSK.md)
- Script de inicialização: [INICIAR_LINGUAFLOW.bat](INICIAR_LINGUAFLOW.bat)
- Docs do serviço Vosk: `http://localhost:8200/docs`

### Checklist manual – Painel de modelos OpenRouter

1. Abra o app e vá em **Configurações ▸ Voz de Conversa Offline (Vosk + OpenRouter)**.
2. Ative o switch do Vosk e confirme que o painel de busca é exibido.
3. Clique em **Atualizar** e verifique se a lista é carregada ou apresenta mensagem de erro amigável.
4. Use o campo de busca para filtrar por termo (ex.: `openrouter`). Confirme que os resultados mudam conforme o texto digitado.
5. Desmarque **Gratuitos** e depois **Pagos** para garantir que os filtros aplicam e a lista fica vazia quando ambos estão desativados.
6. Selecione um modelo diferente e confira se a etiqueta "Modelo selecionado" é atualizada e o botão mantém o destaque.
7. Reabra a página e valide se o modelo escolhido e os filtros persistem nas configurações locais.

---

## Troubleshooting

- Garanta que `.env`/.env.local tenha todas as chaves.
- Confirme a instalação dos modelos (Vosk, Piper, Argos).
- Se o Vosk não iniciar, reinstale as dependências (`python -m pip install -r backend/vosk_service/requirements.txt`) e revise `VOSK_MODEL_PATH`.
- Verifique os logs nas janelas abertas ou na pasta `logs/`.
