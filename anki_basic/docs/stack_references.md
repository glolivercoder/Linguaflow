# Referências Oficiais do Stack Anki_Basic

Este resumo reúne os principais recursos oficiais citados no plano `ANKI_BASIC.md`, com links diretos e comandos essenciais extraídos da documentação oficial (Context7 ou repositórios originais).

## Linguagem & Runtime

### React (UI Library)

- **Fonte:** [react.dev](https://react.dev) (Context7)
- **Uso chave:** Componentização declarativa, `createRoot` para iniciar a árvore.
- **Snippet base:**
  ```bash
  npm create vite@latest  # bootstrap alternativo
  ```
  ```tsx
  import { createRoot } from "react-dom/client";
  const root = createRoot(document.getElementById("root"));
  root.render(<App />);
  ```

### TypeScript (Linguagem)

- **Fonte:** [typescriptlang.org](https://www.typescriptlang.org/docs/) (Context7)
- **Instalação:** `npm install -g typescript`
- **Dependências de projeto:** `npm install --save-dev typescript gulp@4.0.0 gulp-typescript`

## Ferramenta de Bootstrap

### Create React App (CRA)

- **Fonte:** [facebook/create-react-app](https://github.com/facebook/create-react-app) (Context7)
- **Comandos principais:**
  ```bash
  npx create-react-app my-app --template typescript
  cd my-app
  npm start
  ```

## Estado Global & Roteamento

### Zustand

- **Fonte:** [zustand.docs.pmnd.rs](https://zustand.docs.pmnd.rs) (Context7)
- **Instalação:** `npm install zustand`
- **Padrão de uso:** `const useStore = create((set) => ({ ... }))`

### Redux Toolkit

- **Fonte:** [reduxjs/redux-toolkit](https://redux-toolkit.js.org/) (Context7)
- **Instalação:**
  ```bash
  npm install @reduxjs/toolkit
  npm install react-redux
  ```
- **Setup típico:**
  ```ts
  const store = configureStore({ reducer: rootReducer });
  ```

### React Router

- **Fonte:** [remix-run/react-router](https://reactrouter.com/) (Context7)
- **Instalação manual (Node/Vite):**
  ```bash
  npm i react-router @react-router/node @react-router/serve isbot react react-dom
  npm i -D @react-router/dev vite
  ```
- **Uso básico:**
  ```tsx
  const router = createBrowserRouter([{ path: "/", element: <Home /> }]);
  <RouterProvider router={router} />;
  ```

## Bibliotecas de leitura/escrita `.apkg`

### anki-reader

- **Fonte:** [ewei068/anki-reader](https://github.com/ewei068/anki-reader) (README oficial)
- **Instalação:** `npm install anki-reader`
- **Uso:** `const { collection, media } = await readAnkiPackage(file)`
- **Nota:** Em navegadores, configurar `sql.js`/WASM (`locateFile`).

### apkg-reader.js

- **Fonte:** [alemayhu/apkg-reader.js](https://github.com/alemayhu/apkg-reader.js) (README)
- **Uso mínimo:**
  ```ts
  import { readDatabaseFrom, ZipHandler } from "apkg-reader.js";
  const db = await readDatabaseFrom(new ZipHandler("deck.apkg"));
  ```

### anki-apkg-parser

- **Fonte:** [74Genesis/anki-apkg-parser](https://github.com/74Genesis/anki-apkg-parser) (README)
- **Fluxo:**
  ```ts
  const unpack = new Unpack();
  await unpack.unpack("deck.apkg", "./deck-folder");
  const deck = new Deck("./deck-folder");
  const db = await deck.dbOpen();
  await db.getNotes();
  ```
- **Detalhe:** expõe arquivos `collection.anki2/21/21b`, mídia e metadados após `unpack`.

## Variáveis de ambiente (`.env`)

- **Formato:** create CRA exige prefixo `REACT_APP_` para expor valores no bundle.
- **Template sugerido:**
  ```env
  REACT_APP_PROXY_BASE_URL=https://proxy.local
  REACT_APP_MEDIA_BASE_URL=https://proxy.local/media
  ```
- **Uso:** centraliza endpoints do proxy/API e caminhos de mídia consumidos pelos serviços em `src/api`.

---

Para cada item, mantenha estes links como referência rápida durante o setup inicial e a implementação dos módulos definidos no roteiro `ANKI_BASIC.md`.
