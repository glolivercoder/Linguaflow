# Desenvolvimento: Proxy de Integração Gemini/Pixabay

## Objetivo
Construir um backend intermediário (Proxy API + WebSocket) que assuma **todas** as comunicações com os serviços externos Google Gemini (REST e Live API) e Pixabay, eliminando chamadas diretas do frontend e removendo problemas de CORS/segurança. O proxy deve ser escalável para milhares de usuários simultâneos.

## Diagnóstico (estado atual)
- **Frontend → Gemini (REST)**: módulo `services/geminiService.ts` usa `GoogleGenAI` diretamente no navegador, expondo `process.env.API_KEY` (injetado pelo Vite) @services/geminiService.ts#7-14. Chamadas: `generateTTS`, `getPhonetics`, `getIPA`, `translateText`, `getPronunciationCorrection`, `getGroundedAnswer`.
- **Frontend → Gemini (Live/WebSocket)**: `ConversationView` usa `ai.live.connect` com o modelo `gemini-2.5-flash-native-audio-preview-09-2025`, enviando áudio PCM diretamente para `wss://generativelanguage.googleapis.com` @components/ConversationView.tsx#403-436. Falha por CORS e expõe a API key.
- **Frontend → Pixabay**: `services/pixabayService.ts` faz `fetch` direto para `https://pixabay.com/api` @services/pixabayService.ts#39-54; mesmo header CSP já libera, mas queremos centralizar no backend.
- **Backend atual (FastAPI)**: não participa das integrações Gemini/Pixabay; atende apenas pronúncia Piper.
- **Logs relevantes**: console mostra `Failed to fetch streaming request / blocked by Content Security Policy`. `pixabayLogger` guarda histórico apenas no cliente @services/pixabayLogger.ts#8-56.

## Escopo do Proxy
1. **WebSocket Live Gemini**
   - Endpoint interno `wss://<proxy>/gemini/live` (nome sugerido).
   - Recebe mensagens binárias/JSON do cliente e encaminha para `wss://generativelanguage.googleapis.com/...` usando a API key no servidor.
   - Normaliza respostas e reemite para o navegador (transcrição, áudio inlineData, eventos de controle).
   - Implementa reconexão, limites de sessão e métricas básicas.

2. **REST Gemini (HTTP)**
   - Rotas HTTP protegidas (ex.: `POST /gemini/tts`, `POST /gemini/translate`, `POST /gemini/phonetics`, `POST /gemini/ipa`, `POST /gemini/pronunciation-feedback`, `POST /gemini/grounded-answer`).
   - Cada rota chama o respectivo método do SDK/HTTP (via `@google/generative-ai` ou `fetch` nativo) com a API key no servidor.
   - Permite rate limiting e logging centralizado.

3. **REST Pixabay**
   - Rota `GET /pixabay/search?q=<term>` com parâmetros sanitizados.
   - Proxy adiciona `PIXABAY_API_KEY` do servidor e retorna apenas dados relevantes (URLs e metadados).
   - Possibilidade de cache curto para reduzir chamadas repetidas.

4. **Autenticação e Controle**
   - Manter whitelist de origens (frontend oficial) e aplicar CORS apenas para esse domínio.
   - Suporte futuro para autenticação de usuário se necessário (token/bearer).

5. **Operação e Observabilidade**
   - Logs estruturados (requisições, latência, erros) para métricas e auditoria.
   - Healthcheck HTTP (`/healthz`) retornando dependências (Gemini, Pixabay).

## Arquitetura Sugerida
- **Linguagem**: Node.js (Express + ws) para consistência com snippet inicial e ecossistema de bibliotecas WebSocket.
- **Estrutura de diretórios**: `backend/proxy/`
  - `src/server.ts` (ou `proxy-server.js`)
  - `src/routes/geminiRest.ts`, `src/routes/pixabay.ts`, `src/ws/geminiLive.ts`
  - `package.json` com scripts `start` (prod) e `dev` (nodemon/ts-node).
  - `.env` contendo `GEMINI_API_KEY`, `PIXABAY_API_KEY`, `PORT` (padrão 3100).

## Alterações Necessárias no Frontend
1. **Gemini REST**: substituir importações de `GoogleGenAI` no client por chamadas ao proxy (fetch/axios). Criação de `services/geminiProxyService.ts` consumindo o backend.
2. **Gemini Live**: refatorar `ConversationView` para usar WebSocket `ws[s]://<proxy>/gemini/live`. Implementar protocolo (setup/audio/stop) compatível com o proxy.
3. **Pixabay**: ajustar `services/pixabayService.ts` para chamar `fetch('/api/pixabay?q=...')` (URL do proxy).
4. **Configurações**: atualizar Vite para expor apenas URL do proxy, remover API keys do bundle.

## Roadmap de Implementação
1. **Setup do projeto proxy**
   - Criar pasta `backend/proxy` com `package.json`, configurar TypeScript ou JS.
   - Implementar healthcheck, leitura de `.env` e logging básico.
2. **Implementar rotas REST Gemini**
   - TTS, tradução, fonética, correção e respostas fundamentadas.
   - Definir payload e resposta padronizados.
3. **Implementar WebSocket Live**
   - Encapsular handshake com Gemini Live API.
   - Gerenciar transcodificação PCM/base64 conforme protocolo oficial.
4. **Implementar rota Pixabay**
   - Forward com API key + validação de parâmetros.
5. **Integração Frontend**
   - Atualizar serviços/Views para usar o proxy.
   - Ajustar `vite.config.ts` se necessário apenas para apontar para proxy.
6. **Script de inicialização**
   - Atualizar `INICIAR_LINGUAFLOW.bat` para iniciar proxy (npm install + start) antes do backend FastAPI e do frontend.
7. **Testes**
   - Curl/WS tests (Pixabay, Gemini REST, Live) via proxy.
   - Testes manuais no front.
8. **Observabilidade/Deploy**
   - Definir logs, métricas e checklist para implantação em ambiente gerenciado.

## Dependências e Riscos
- Requer cota suficiente na API do Gemini para volume alto (monitorar rate limit).
- WebSocket exige gestão de conexões simultâneas (provisionar autoscaling/limites).
- Necessário secure storage da API key (secret manager, etc.).
- Latência adicional: otimizar pacotes e evitar processamento pesado no proxy.

## Definições Iniciais para Implementação
- **Porta local**: 3100 (HTTP) + 3100/ws para WebSocket.
- **Variáveis**: `GEMINI_API_KEY`, `PIXABAY_API_KEY`, `PROXY_PORT=3100`, `ALLOWED_ORIGINS=http://localhost:3001`.
- **Scripts recomendados**:
  ```json
  {
    "scripts": {
      "start": "node dist/server.js",
      "dev": "nodemon --watch src --exec ts-node src/server.ts",
      "build": "tsc"
    }
  }
  ```

## Próximos Passos
1. Criar estrutura do proxy conforme descrito.
2. Implementar rotas/WS e testes locais.
3. Refatorar frontend para consumir o proxy.
4. Atualizar scripts de inicialização e documentação operacional.

---
*Documento preparado para orientar a implementação do proxy oficial Gemini/Pixabay.*
