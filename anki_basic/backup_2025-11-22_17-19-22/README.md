# Backup Anki Basic - 22/11/2025 17:19:22

## Data e Hora do Backup
22 de Novembro de 2025 - 17:19:22

## Arquivos Incluídos

### Páginas (Components)
- `Review.tsx` - Página principal de revisão com TTS e autoplay corrigidos
- `Dashboard.tsx` - Página principal do aplicativo
- `DeckDetail.tsx` - Página de detalhes do baralho

### Componentes
- `MediaPreview.tsx` - Componente de preview de mídia
- `App.tsx` - Componente principal da aplicação

### Store (Estado)
- `appStore.ts` - Store principal com estado TTS e autoplay
- `importStore.ts` - Store para importação de arquivos

### Lógica de Negócio
- `sm2.ts` - Algoritmo SM-2 para repetição espaçada
- `app.ts` - Tipos da aplicação

### Configuração
- `package.json` - Dependências e scripts do projeto
- `tsconfig.json` - Configuração TypeScript
- `App.css` - Estilos CSS incluindo TTS e header controls

## Contexto das Mudanças

Este backup foi criado após as seguintes implementações importantes:

### 1. **Implementação de TTS (Text-to-Speech)**
- Substituída biblioteca gtts (problemática) por Web Speech API nativa
- Adicionado botão de toggle TTS no header (🎙️)
- Configurado para ler texto em inglês (en-US)
- Implementada apenas para frente do cartão (evita spoilers)

### 2. **Correção do Autoplay de Áudio**
- Implementado efeito useEffect para autoplay automático
- Adicionado delay de 100ms para garantir renderização dos elementos
- Corrigidos erros de TypeScript

### 3. **Melhorias na Interface**
- Header reorganizado com controles agrupados
- Botão TTS ao lado do botão voltar
- Estilos CSS para header-controls e back-link
- Formatação Prettier aplicada

### 4. **Resolução de Problemas**
- Removida dependência gtts que causava erros de polyfills
- Eliminados todos os erros de TypeScript
- Compilação limpa sem warnings

## Funcionalidades Ativas

✅ **TTS**: Botão 🎙️ no header para síntese de voz em inglês
✅ **Autoplay**: Áudios tocam automaticamente quando ativado
✅ **Sem erros**: TypeScript e ESLint limpos
✅ **Interface**: Header organizado e responsivo

## Como Restaurar

Para restaurar os arquivos deste backup:

```bash
# Copiar todos os arquivos TypeScript/TSX
cp backup_2025-11-22_17-19-22/*.tsx src/
cp backup_2025-11-22_17-19-22/*.ts src/

# Copiar arquivos de configuração
cp backup_2025-11-22_17-19-22/package.json .
cp backup_2025-11-22_17-19-22/tsconfig.json .
cp backup_2025-11-22_17-19-22/App.css src/

# Reinstalar dependências
npm install
```

## Observações Técnicas

- **TTS**: Usa Web Speech API (navegadores modernos)
- **Compatibilidade**: Funciona offline, sem dependências externas
- **Performance**: Mais leve que gtts, melhor UX
- **Idioma**: Configurado para inglês americano (en-US)

## Estado da Aplicação

- **Servidor**: Rodando em http://localhost:3000
- **Compilação**: Sem erros
- **Funcionalidades**: Todas implementadas e testadas
- **Backup**: Completo e funcional
