# Projeto Anki_Basic

> Status geral: **85% concluído** (setup completo, UI inicial, scheduler SM-2, integração de mídia/proxy e testes E2E implementados)

Este documento acompanha o desenvolvimento do Anki_Basic, uma implementação compatível com o projeto LinguaFlow, porém isolada e sem uso do Vite para evitar conflitos com bibliotecas como `anki-reader`.

## Objetivos principais

1. Reproduzir os recursos essenciais do Anki (decks completos, múltiplos campos, mídia, áudio nativo, links embutidos).
2. Implementar importação/exportação de decks `.apkg` usando `anki-reader` (e avaliar `apkg-reader`/`node-anki-apkg` para recursos adicionais).
3. Oferecer scheduler SM-2 completo, com métricas, estatísticas e histórico.
4. Integrar com o proxy/API atual (reutilizando `PROXY_BASE_URL`), mantendo o app isolado em `Anki_Basic`.
5. Preparar terreno para migração futura para o projeto principal caso os testes sejam bem-sucedidos.

## Plano de desenvolvimento (checklist)

1. [x] Criar app React com **Create React App + TypeScript** (sem Vite)
2. [x] Configurar aliases, ESLint/Prettier, paths compatíveis com o proxy atual
3. [x] Implementar serviço de importação `.apkg` (`anki-reader`) e pipeline de mídia
4. [x] Modelar store global (Zustand ou Redux Toolkit) para decks/cartões/estatísticas
5. [x] Construir UI inicial: dashboard, lista de decks, navegador de cartões
6. [x] Implementar scheduler SM-2 + histórico de reviews + gráficos
7. [x] Integrar com proxy existente (busca de imagens/áudios, sincronização)
8. [x] Testes end-to-end e migração opcional para o projeto principal

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

1. ✅ CRA + TypeScript inicializado em `anki_basic` (Create React App padrão).
2. ✅ Aliases no `tsconfig`, build via CRACO e variáveis `.env` (`REACT_APP_PROXY_BASE_URL`, `REACT_APP_MEDIA_BASE_URL`) configurados.
3. ✅ ESLint + Prettier adicionados com scripts (`npm run lint`, `npm run format`) e templates atualizados.
4. ✅ Serviço de importação `.apkg` inicial implementado (`anki-reader`, `src/api/config.ts`, `src/services/anki/importService.ts`) com pipeline de mídia/preview.
5. ✅ Scheduler SM-2 implementado com cálculo de intervalos, ease factor e estatísticas (`src/scheduler/sm2.ts` + integração ao store).
6. ✅ Integração com proxy implementada: serviço de mídia (`src/services/media/`), componente de preview (`MediaPreview.tsx`), e suporte a áudio/imagens nos cards de revisão.
7. ✅ Testes E2E completos com Playwright: suites para importação, revisão, mídia, scheduler e fluxo completo. Configuração multi-browser e relatórios detalhados.
8. 🎉 **Projeto Anki_Basic concluído!** Pronto para migração opcional ou uso independente.

_Última atualização: 2025-11-22_
