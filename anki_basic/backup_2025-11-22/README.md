# Backup Anki Basic - 22/11/2025

## Data do Backup
22 de Novembro de 2025

## Arquivos Incluídos

### Páginas (Components)
- `Review.tsx` - Página principal de revisão (com correções de duplicação de imagens)
- `Dashboard.tsx` - Página principal do aplicativo
- `DeckDetail.tsx` - Página de detalhes do baralho

### Componentes
- `MediaPreview.tsx` - Componente de preview de mídia
- `App.tsx` - Componente principal da aplicação

### Store (Estado)
- `appStore.ts` - Store principal do aplicativo
- `importStore.ts` - Store para importação de arquivos

### Lógica de Negócio
- `sm2.ts` - Algoritmo SM-2 para repetição espaçada
- `app.ts` - Tipos da aplicação

### Configuração
- `package.json` - Dependências e scripts do projeto

## Contexto das Mudanças

Este backup foi criado após as seguintes correções importantes:

1. **Correção de duplicação de imagens**: Resolvido o problema onde as imagens eram renderizadas duas vezes nos flashcards
2. **Limpeza de código**: Removidas importações e variáveis não utilizadas
3. **Formatação**: Aplicada formatação Prettier em todo o código
4. **Remoção de erros**: Eliminados erros de TypeScript e ESLint

## Como Restaurar

Para restaurar os arquivos deste backup:

```bash
# Copiar todos os arquivos do backup para o diretório src
cp backup_2025-11-22/*.tsx src/
cp backup_2025-11-22/*.ts src/
cp backup_2025-11-22/package.json .
```

## Observações

- Este backup contém apenas os arquivos principais do código-fonte
- Para uma restauração completa, também pode ser necessário restaurar:
  - Arquivos de configuração (tsconfig.json, craco.config.js)
  - Arquivos de estilos CSS
  - Arquivos de testes
  - Diretórios como public/ e node_modules/ (reinstalar com npm install)
