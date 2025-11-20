# 📋 Conversor de Baralhos Anki para LinguaFlow

## 🎯 Avaliação de Viabilidade Técnica

### ✅ **VIÁVEL** - Complexidade: Média

A criação do conversor em lote é **tecnicamente viável** com a infraestrutura existente. O sistema já possui todos os componentes necessários:

#### Componentes Disponíveis
1. ✅ **Anki Parser** (`services/ankiParser.ts`) - Extrai front/back/imagens/áudio de arquivos `.apkg`
2. ✅ **LLM Models** - Gemini e OpenRouter já integrados
3. ✅ **Tradução** - `translateText()` via Gemini proxy
4. ✅ **Pixabay Integration** - Importação automática de imagens
5. ✅ **TTS/Piper** - Geração de áudio já implementada
6. ✅ **Database Layer** - IndexedDB com suporte a flashcards Anki

#### Estrutura dos Flashcards LinguaFlow
```typescript
interface Flashcard {
  id: string;
  originalText: string;      // Língua nativa (pt-BR)
  translatedText: string;    // Língua de aprendizado (en-US)
  phoneticText: string;      // Fonética gerada por LLM
  originalLang: LanguageCode;
  translatedLang: LanguageCode;
  imageUrl?: string;         // URL do Pixabay ou base64 do Anki
  sourceType?: 'manual' | 'anki';
  ankiDeckId?: string;
  ankiDeckName?: string;
  ankiNoteId?: number;
}
```

#### Estrutura dos Cards Anki (já extraída)
```typescript
interface AnkiCard {
  id: number;
  front: string;  // Texto extraído
  back: string;   // Tradução extraída
  image?: string; // Base64 data URI
  audio?: string; // Base64 data URI
  tags: string[];
  deckId?: string;
  deckName?: string;
}
```

---

## 🔄 Fluxo de Conversão Proposto

### Etapa 1: Detecção de Idioma (LLM)
- Usar LLM para detectar idioma de `front` e `back`
- Determinar qual é nativo e qual é aprendizado

### Etapa 2: Enriquecimento (Batch Processing)
Para cada card:
1. **Fonética**: Gerar com `getPhonetics()` via Gemini
2. **Imagem**: 
   - Manter imagem do Anki se existir
   - Caso contrário, buscar no Pixabay usando palavra-chave do card
3. **OCR** (Opcional): Se `front`/`back` estiverem vazios mas houver imagem, usar Gemini Vision para extrair texto

### Etapa 3: Validação e Salvamento
- Validar dados convertidos
- Salvar em IndexedDB via `db.bulkAddFlashcards()`

---

## 📊 Checklist de Desenvolvimento

### Progresso Geral: 0% (0/18 tarefas concluídas)

---

### 🎨 **1. Interface - Botão "Converter Cards"** (10%)
**Progresso: 0% (0/2)**

- [ ] **1.1** Adicionar botão "Converter Cards" no canto superior direito da aba Anki
  - Arquivo: `components/AnkiView.tsx`
  - Posição: Junto ao título "Baralhos do Anki" (linha ~91)
  - Design: Botão destacado com ícone de conversão
  
- [ ] **1.2** Criar modal de configuração de conversão
  - Opções: Idioma nativo, idioma de aprendizado
  - Preferências: Usar imagens Anki ou buscar no Pixabay
  - Ativar/desativar OCR para cards com imagens

---

### 🧠 **2. Serviço de Detecção de Idioma** (15%)
**Progresso: 0% (0/3)**

- [ ] **2.1** Criar `services/languageDetector.ts`
  - Função: `detectLanguagesLLM(front: string, back: string)`
  - Usar Gemini para identificar idiomas
  - Retornar: `{ frontLang: LanguageCode, backLang: LanguageCode }`

- [ ] **2.2** Adicionar fallback heurístico
  - Detectar caracteres especiais (ãõç = PT, θφ = Grego, 日本 = Japonês)
  - Usar score de confiança

- [ ] **2.3** Testes unitários de detecção
  - Testar pares EN-PT, EN-ES, EN-JP
  - Validar fallback para idiomas raros

---

### 🔄 **3. Conversor Principal** (25%)
**Progresso: 0% (0/5)**

- [ ] **3.1** Criar `services/ankiConverter.ts`
  - Função principal: `convertAnkiToLinguaFlow(ankiCards: AnkiCard[], config: ConversionConfig)`
  - Interface de configuração com opções de conversão

- [ ] **3.2** Implementar processamento em lote
  - Processar 10 cards por vez (evitar throttling da API)
  - Barra de progresso com % e status atual
  - Callback para UI: `onProgress(current, total, status)`

- [ ] **3.3** Lógica de mapeamento Front/Back
  - Detectar idiomas com LLM
  - Mapear corretamente para originalText/translatedText
  - Inverter se necessário (PT→EN vs EN→PT)

- [ ] **3.4** Geração de fonética em lote
  - Usar `getPhonetics()` para cada card
  - Cache de resultados já processados
  - Retry com backoff exponencial em caso de erro

- [ ] **3.5** Tratamento de erros e logging
  - Log detalhado de cada etapa
  - Relatório final: X convertidos, Y falharam
  - Permitir reprocessamento de cards falhados

---

### 🖼️ **4. Enriquecimento de Imagens** (20%)
**Progresso: 0% (0/4)**

- [ ] **4.1** Criar `services/imageEnricher.ts`
  - Função: `enrichCardImage(card: AnkiCard, usePixabay: boolean)`
  - Prioridade: Imagem Anki → Pixabay → sem imagem

- [ ] **4.2** Integração com Pixabay
  - Reutilizar `services/pixabayService.ts` existente
  - Extrair palavra-chave principal do card (usar LLM se necessário)
  - Buscar imagem relevante automaticamente

- [ ] **4.3** OCR com Gemini Vision (opcional)
  - Apenas se `front` ou `back` estiverem vazios
  - Extrair texto de imagens usando Gemini Vision API
  - Adicionar ao proxy: `/gemini/vision-ocr`

- [ ] **4.4** Otimização de base64
  - Converter imagens grandes para Pixabay URLs quando possível
  - Reduzir tamanho do banco de dados

---

### 🔗 **5. Integração com App Principal** (15%)
**Progresso: 0% (0/3)**

- [ ] **5.1** Adicionar handler em `App.tsx`
  - Função: `handleConvertAnkiCards(deckId: string, config: ConversionConfig)`
  - Chamar conversor e atualizar state

- [ ] **5.2** Atualizar `AnkiView.tsx`
  - Conectar botão ao handler
  - Exibir modal de progresso durante conversão
  - Mostrar relatório de sucesso/erros ao final

- [ ] **5.3** Atualizar tipos em `types.ts`
  - Adicionar `ConversionConfig` interface
  - Estender `AnkiCard` se necessário

---

### 🧪 **6. Testes e Validação** (15%)
**Progresso: 0% (0/1)**

- [ ] **6.1** Teste completo end-to-end
  - Usar baralho de exemplo: `Anki_Flashcards/3000_Essential_English_Words_with_examples_sound_and_images.apkg`
  - Converter deck completo em lote
  - Validar:
    - ✅ Todos os cards convertidos
    - ✅ Imagens preservadas/enriquecidas
    - ✅ Fonética gerada para todos
    - ✅ Idiomas detectados corretamente
    - ✅ Cards visíveis na aba Flashcards
    - ✅ TTS funciona para cards convertidos
    - ✅ Cartões utilizáveis em jogos/treinamentos

---

## 🎮 Verificação Final - Uso em Jogos

Após conversão, validar que os flashcards convertidos podem ser usados em:

- [ ] **Smart Learn** - Sistema de aprendizado adaptativo
- [ ] **Lições** - Módulos de treinamento
- [ ] **Jogos Interativos** - AnkiGames integration (conforme `INTEGRAÇÃO_LINGUAFLOW_ANKIGAMES.md`)

---

## 🚀 Arquivos a Criar/Modificar

### Novos Arquivos (3)
1. `services/languageDetector.ts` - Detecção de idioma via LLM
2. `services/ankiConverter.ts` - Lógica principal de conversão
3. `services/imageEnricher.ts` - Enriquecimento de imagens

### Arquivos a Modificar (4)
1. `components/AnkiView.tsx` - Adicionar botão e modal de conversão
2. `App.tsx` - Handler de conversão
3. `types.ts` - Novos tipos (`ConversionConfig`)
4. `backend/proxy/index.js` (opcional) - Endpoint `/gemini/vision-ocr` para OCR

---

## 📝 Notas Técnicas

### Rate Limiting
- **Gemini API**: ~15 requests/min (via proxy)
- **Pixabay API**: 5000 requests/hour
- **Solução**: Batch de 10 cards com delay de 1s entre batches

### Armazenamento
- Cards Anki com imagens base64 podem ser grandes (10KB-1MB por imagem)
- IndexedDB suporta bem, mas considerar migrar para Pixabay URLs quando possível

### Fallbacks
- Se LLM falhar na detecção: usar idiomas das configurações do usuário
- Se Pixabay falhar: manter imagem Anki ou deixar sem imagem
- Se fonética falhar: deixar campo vazio (não bloquear conversão)

---

## 🎯 Entregáveis

1. ✅ Botão "Converter Cards" funcional na aba Anki
2. ✅ Conversão em lote com barra de progresso
3. ✅ Detecção automática de idiomas via LLM
4. ✅ Geração de fonética para todos os cards
5. ✅ Enriquecimento de imagens (Anki + Pixabay)
6. ✅ OCR opcional para cards com imagens
7. ✅ Relatório detalhado de conversão
8. ✅ Cards convertidos utilizáveis em jogos/treinamentos

---

**Data de Criação**: 2025-11-19  
**Última Atualização**: 2025-11-19  
**Status**: 🟡 Planejamento Concluído - Aguardando Aprovação para Implementação
