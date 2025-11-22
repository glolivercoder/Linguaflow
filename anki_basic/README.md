# Anki_Basic

Importador e visualizador básico de decks Anki, compatível com o pipeline `anki-reader`, pensado para integração futura ao scheduler e ao proxy de mídia da plataforma LinguaFlow.

## Pré-requisitos

- Node 18+
- npm 9+

## Variáveis de ambiente (`.env`)

Crie um arquivo `.env` na raiz com os valores do proxy/API:

```env
REACT_APP_PROXY_BASE_URL=https://proxy.local
REACT_APP_MEDIA_BASE_URL=https://proxy.local/media
```

Todos os valores expostos ao bundle devem usar o prefixo `REACT_APP_`.

## Scripts disponíveis

| Script                 | Descrição                                                          |
| ---------------------- | ------------------------------------------------------------------ |
| `npm start`            | Dev server (CRACO) em http://localhost:3000                        |
| `npm run build`        | Build de produção com CRA                                          |
| `npm test`             | Jest em modo watch, com aliases configurados via `craco.config.js` |
| `npm run lint`         | ESLint (`src/**/*.ts,tsx`) integrado ao Prettier                   |
| `npm run format`       | Prettier `--write` em todo o projeto                               |
| `npm run format:check` | Prettier `--check`                                                 |

## Estrutura atual

```
src/
  api/config.ts            # leitura das variáveis do proxy
  services/anki/importService.ts
  store/importStore.ts     # Zustand para decks/mídia importados
  pages/                   # Dashboard e detalhe do deck
  App.tsx                  # fluxo de upload + roteamento
```

## Testes

- `src/services/anki/importService.test.ts`: garante o mapeamento de decks/mídias e a resolução da URL do proxy.
- `src/store/importStore.test.ts`: cobre `setPayload`/`reset` e revogação de blobs.

Execute `npm run test -- --runTestsByPath <arquivo>` para rodar suites específicas.

## Roadmap imediato

1. Expandir UI/rotas para preview de mídia e páginas do scheduler.
2. Persistir decks/mídia além da sessão (ex.: IndexedDB).
3. Pipeline de CI (`.github/workflows/ci.yml`) com lint + test + build.
4. Monitorar releases do CRA/react-scripts para aplicar patches de segurança e reduzir alertas do `npm audit`.

Para detalhes históricos e checkpoints completos, consulte `ANKI_BASIC.md`.
