# Projeto Anki_Basic

> Status geral: **0% concluído** (planejamento e setup pendentes)

Este documento acompanha o desenvolvimento do Anki_Basic, uma implementação compatível com o projeto LinguaFlow, porém isolada e sem uso do Vite para evitar conflitos com bibliotecas como `anki-reader`.

## Objetivos principais

1. Reproduzir os recursos essenciais do Anki (decks completos, múltiplos campos, mídia, áudio nativo, links embutidos).
2. Implementar importação/exportação de decks `.apkg` usando `anki-reader` (e avaliar `apkg-reader`/`node-anki-apkg` para recursos adicionais).
3. Oferecer scheduler SM-2 completo, com métricas, estatísticas e histórico.
4. Integrar com o proxy/API atual (reutilizando `PROXY_BASE_URL`), mantendo o app isolado em `Anki_Basic`.
5. Preparar terreno para migração futura para o projeto principal caso os testes sejam bem-sucedidos.

## Plano de desenvolvimento (checklist)

1. [ ] Criar app React com **Create React App + TypeScript** (sem Vite)
2. [ ] Configurar aliases, ESLint/Prettier, paths compatíveis com o proxy atual
3. [ ] Implementar serviço de importação `.apkg` (`anki-reader`) e pipeline de mídia
4. [ ] Modelar store global (Zustand ou Redux Toolkit) para decks/cartões/estatísticas
5. [ ] Construir UI inicial: dashboard, lista de decks, navegador de cartões
6. [ ] Implementar scheduler SM-2 + histórico de reviews + gráficos
7. [ ] Integrar com proxy existente (busca de imagens/áudios, sincronização)
8. [ ] Testes end-to-end e migração opcional para o projeto principal

## Procedimentos definidos

1. **Stack**: React + CRA (TypeScript). Webpack nativo do CRA evita conflitos com `anki-reader`.
2. **Estrutura** prevista:
   ```
   Anki_Basic/
     README.md
     ANKI_BASIC.md (este arquivo)
     package.json
     src/
       api/
       services/anki/
       scheduler/
       store/
       components/
       pages/
   ```
3. **Bibliotecas chave**:
   - `anki-reader` para leitura `.apkg` (preferencial).
   - Avaliar `apkg-reader` + `sql.js` para casos especiais e `node-anki-apkg` para exportação.
4. **Scheduler**: implementar SM-2 com parâmetros customizáveis (ease factor, intervalos, lapses) e persistência no store.
5. **Mídia**: armazenar temporariamente assets importados, permitir preview e reprodução de áudio nativo.
6. **Integração**: consumir proxy atual (`PROXY_BASE_URL`) para recursos compartilhados (ex.: TTS, imagens externas), mantendo a aplicação separada para evitar interferências.

## Próximos passos imediatos

1. Inicializar CRA com TypeScript (`npx create-react-app . --template typescript`).
2. Configurar path aliases e `.env` apontando para o proxy.
3. Adicionar dependências essenciais (`anki-reader`, `zustand` ou `@reduxjs/toolkit`, `react-router-dom`).
4. Documentar scripts de desenvolvimento e integração contínua.

_Última atualização: 2025-11-21_
