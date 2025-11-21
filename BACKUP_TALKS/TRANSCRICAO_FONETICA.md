# TRANSCRICAO_FONETICA.md - Sistema de Transcrição Fonética

**Data**: 2025-11-20  
**Localização**: Aba "Conversa" - Conversas Guiadas

---

## 📋 VISÃO GERAL

O sistema de transcrição fonética permite que os usuários visualizem a **pronúncia correta SIMPLIFICADA** de frases e palavras em inglês durante as conversas guiadas.

### ⚠️ IMPORTANTE - FORMATO DA TRANSCRIÇÃO

**NÃO é IPA (International Phonetic Alphabet)!**

A transcrição é **SIMPLIFICADA** usando ortografia portuguesa/latina para facilitar a leitura por brasileiros.

**Exemplos Reais** (da tela):
- "What is the main problem today?" → **"UOT IZ DA MEIN PROBLEM TUDEI?"**
- "I have been feeling severe stomach aches since yesterday" → **"ai hév bin fíling si-vír stámac êiks sins iéstardei"**
- "When did the symptoms start?" → **"UEN DI-DA SÍMTOMZ START?"**
- "They started about twelve hours ago" → **"Dei stár-ded a-báut tuelv áu-arz a-góu"**

### Recursos Principais:
- ✅ Transcrição fonética **SIMPLIFICADA** via Gemini API
- ✅ **Adaptada para brasileiros** - sem símbolos IPA complexos
- ✅ Cache persistente em IndexedDB para reduzir chamadas à API
- ✅ Suporte a 6 categorias de conversas guiadas
- ✅ Display inline de fonética no sidebar (texto verde)
- ✅ Funciona para perguntas e respostas

---

## 🎯 FORMATO DA TRANSCRIÇÃO FONÉTICA

### Como Funciona:
A Gemini API recebe um **prompt especial** que pede uma transcrição SIMPLIFICADA:

```javascript
const prompt = `Gere uma transcrição fonética simplificada para a frase "${text}" em ${targetLangName}. 
A transcrição deve ser fácil de entender para um falante nativo de ${nativeLangName}. 
Use uma notação simples e intuitiva. 
Responda apenas com a transcrição fonética.`;
```

### Características da Transcrição:
1. **Usa letras normais** (não símbolos IPA como /ə/, /θ/, /ð/)
2. **Adaptada para brasileiros** - sons aproximados em português
3. **Fácil de ler** - qualquer pessoa consegue entender
4. **Hífen para sílabas** - facilita pronúncia (ex: "a-báut")
5. **Acento agudo** - indica sílaba tônica (ex: "símtomz")

### Exemplos Comparativos:

| Frase em Inglês | ❌ IPA (Complexo) | ✅ Simplificado (Usado) |
|-----------------|-------------------|-------------------------|
| Hello | /həˈloʊ/ | "re-LÔU" |
| What is the main problem? | /wʌt ɪz ðə meɪn ˈprɑbləm/ | "UOT IZ DA MEIN PROBLEM?" |
| I have been feeling | /aɪ hæv biːn ˈfiːlɪŋ/ | "ai hév bin fíling" |
| Do you have any medication allergies? | /duː juː hæv ˈɛni ˌmɛdɪˈkeɪʃən ˈælərʤiz/ | "Djú hév é-ni mé-di-quêi-shãn é-ler-djis?" |

---

## 📦 ARQUIVOS BACKUPEADOS

Todos os arquivos foram salvos em: `BACKUP_TALKS/`

### Lista de Backups:
1. ✅ `conversationCategories.ts.backup` - 304 linhas, 15KB
2. ✅ `ConversationView.tsx.backup` - UI da aba Conversa
3. ✅ `geminiService.ts.backup` - Funções de transcrição fonética
4. ✅ `conversaCacheService.ts.backup` - Sistema de cache

---

## 🎯 CATEGORIAS DE CONVERSAS GUIADAS

### 1. Entrevista na Imigração (Immigration)
**Registro**: Formal  
**Tipo**: Q&A (Perguntas e Respostas)  
**Total de Items**: 12 perguntas essenciais

**Exemplos**:
- PT: "Qual é o motivo da sua viagem?"
- EN: "What is the purpose of your trip?"
- FONÉTICA: "UOT IZ DA PÂR-POUS ÓF IÔR TRIP?"

### 2. Hospital (Hospital)
**Registro**: Formal  
**Tipo**: Q&A + Frases

**Exemplos Reais da Tela**:
- PT: "Qual é o problema principal hoje?"
- EN: "What is the main problem today?"
- FONÉTICA: **"UOT IZ DA MEIN PROBLEM TUDEI?"** ✅

- PT: "Estou sentindo dores fortes no estômago desde ontem."
- EN: "I have been feeling severe stomach aches since yesterday."
- FONÉTICA: **"ai hév bin fíling si-vír stámac êiks sins iéstardei"** ✅

### 3. Supermercado (Supermarket)
**Total**: 46 items (Q&A + frases)

### 4. Restaurante (Restaurant)
**Total**: 23 items (Q&A + frases)

### 5. Paquera (Dating)
**Registro**: Informal  
**Total**: 7 items

### 6. Balada (Nightlife)
**Registro**: Informal  
**Total**: 4 frases

---

## 🔧 CÓDIGO - SISTEMA DE TRANSCRIÇÃO FONÉTICA

### Arquivo Backend: `backend/proxy/src/routes/gemini.js`

#### Endpoint: `/gemini/phonetics`

```javascript
app.post('/gemini/phonetics', async (req, res) => {
  const { text, targetLangName, nativeLangName } = req.body ?? {};
  
  if (!text || !targetLangName || !nativeLangName) {
    return res.status(400).json({ 
      error: 'Campos text, targetLangName e nativeLangName são obrigatórios.' 
    });
  }

  try {
    // 🎯 PROMPT ESPECIAL - Gera transcrição SIMPLIFICADA
    const prompt = `Gere uma transcrição fonética simplificada para a frase "${text}" em ${targetLangName}. 
      A transcrição deve ser fácil de entender para um falante nativo de ${nativeLangName}. 
      Use uma notação simples e intuitiva. 
      Responda apenas com a transcrição fonética.`;
    
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: buildUserContent(prompt),
    });
    
    res.json({ phonetics: response.text?.trim() ?? '' });
  } catch (error) {
    handleError(res, error);
  }
});
```

**Parâmetros**:
- `text`: Texto em inglês para gerar fonética
- `targetLangName`: Idioma alvo (ex: "English")
- `nativeLangName`: Idioma nativo (ex: "Portuguese")

**Retorno**: String com transcrição fonética SIMPLIFICADA

### Arquivo Frontend: `services/geminiService.ts`

```typescript
export const getPhonetics = async (
  text: string, 
  targetLangName: string, 
  nativeLangName: string
): Promise<string> => {
  try {
    const { phonetics } = await proxyPost<PhoneticsResponse>('/gemini/phonetics', {
      text,
      targetLangName,
      nativeLangName,
    });
    return phonetics ?? 'Não foi possível gerar a fonética.';
  } catch (error) {
    console.error('Error generating phonetics via proxy:', error);
    return 'Não foi possível gerar a fonética.';
  }
};
```

---

## 💾 SISTEMA DE CACHE

### Arquivo: `services/conversaCacheService.ts`

#### Estrutura do Cache:

```typescript
interface CachedTranslation {
  cacheKey: string;       // Chave única baseada em MD5 do texto
  originalText: string;   // Texto original em PT
  translatedText: string; // Tradução em EN
  phoneticText?: string;  // Transcrição fonética SIMPLIFICADA
  cachedAt: string;       // Timestamp ISO
}
```

---

## 🎨 INTEGRAÇÃO NA UI

### Display no Sidebar (Texto Verde)

**Na tela, você vê**:
```
┌─────────────────────────────────────┐
│ What is the main problem today?  ▶  │ (branco)
│ UOT IZ DA MEIN PROBLEM TUDEI?       │ (VERDE)
│ Qual é o problema principal hoje?   │ (cinza)
└─────────────────────────────────────┘
```

**Código no ConversationView.tsx**:
```tsx
{/* Pergunta em inglês (branco) */}
<div className="text-white font-medium">
  {question}
</div>

{/* Fonética SIMPLIFICADA (verde) */}
{phoneticText && (
  <div className="text-green-400 text-sm italic mt-1">
    {phoneticText}
  </div>
)}

{/* Tradução PT (cinza) */}
<div className="text-gray-400 text-sm mt-1">
  {portugueseText}
</div>
```

---

## 📊 ESTATÍSTICAS DO CONTEÚDO

### Total de Items por Categoria:
```
Immigration:    12 items (Q&A)
Hospital:       14 items (Q&A + frases)
Supermarket:    46 items (Q&A + frases)
Restaurant:     23 items (Q&A + frases)
Dating:          7 items (Q&A + frases)
Nightlife:       4 items (frases)
───────────────────────────────
TOTAL:         106 items únicos
```

Cada item recebe transcrição fonética SIMPLIFICADA automática!

---

## 🔄 COMO FUNCIONA O SISTEMA

### Processo Completo:

```
┌─────────────────────────────────────────────────┐
│ 1. Usuário seleciona categoria de conversa     │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 2. ConversationView carrega items da categoria │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 3. Para cada frase/resposta em inglês:         │
│    - Verifica se existe no cache (IndexedDB)   │
└────────────────┬────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
    CACHE HIT         CACHE MISS
        │                 │
        │                 ▼
        │     ┌───────────────────────────┐
        │     │ 4. Backend recebe request │
        │     │    POST /gemini/phonetics │
        │     └───────────┬───────────────┘
        │                 │
        │                 ▼
        │     ┌───────────────────────────┐
        │     │ 5. Backend cria o PROMPT: │
        │     │ "Gere uma transcrição     │
        │     │  fonética SIMPLIFICADA    │
        │     │  fácil de entender para   │
        │     │  um falante nativo de     │
        │     │  Portuguese"              │
        │     └───────────┬───────────────┘
        │                 │
        │                 ▼
        │     ┌───────────────────────────┐
        │     │ 6. Gemini processa e      │
        │     │    retorna transcrição    │
        │     │    SIMPLIFICADA           │
        │     │    Ex: "UOT IZ DA..."     │
        │     └───────────┬───────────────┘
        │                 │
        │                 ▼
        │     ┌───────────────────────────┐
        │     │ 7. Backend retorna JSON   │
        │     │    { phonetics: "..." }   │
        │     └───────────┬───────────────┘
        │                 │
        │                 ▼
        │     ┌───────────────────────────┐
        │     │ 8. Frontend salva cache   │
        │     │    (IndexedDB)            │
        │     └───────────┬───────────────┘
        │                 │
        └────────┬────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 9. Exibe fonética VERDE no sidebar da UI       │
│    Formato: UOT IZ DA MEIN PROBLEM TUDEI?      │
└─────────────────────────────────────────────────┘
```

---

## 🛠️ EXEMPLO PRÁTICO

### Cenário: Usuário pratica "Hospital"

**Passo 1**: Usuário seleciona categoria "Hospital"

**Passo 2**: Sistema carrega pergunta:
- PT: "Qual é o problema principal hoje?"
- EN: "What is the main problem today?"

**Passo 3**: Sistema verifica cache
```typescript
const cacheKey = generateCacheKey("What is the main problem today?");
const cached = await db.getConversaCacheByKey(cacheKey);
// Resultado: null (primeira vez)
```

**Passo 4**: Backend monta o PROMPT
```javascript
const prompt = `Gere uma transcrição fonética simplificada para a frase "What is the main problem today?" em English. 
A transcrição deve ser fácil de entender para um falante nativo de Portuguese. 
Use uma notação simples e intuitiva. 
Responda apenas com a transcrição fonética.`;
```

**Passo 5**: Gemini processa
```
INPUT: "What is the main problem today?"
PROMPT: "transcrição fonética simplificada... fácil de entender... falante nativo de Portuguese"
OUTPUT: "UOT IZ DA MEIN PROBLEM TUDEI?"
```

**Passo 6**: Sistema salva no cache
```typescript
await saveCachedTranslation(
  "Qual é o problema principal hoje?",
  "What is the main problem today?",
  "UOT IZ DA MEIN PROBLEM TUDEI?"
);
```

**Passo 7**: UI exibe na sidebar
```
┌────────────────────────────────────┐
│ What is the main problem today? ▶  │ (branco)
│ UOT IZ DA MEIN PROBLEM TUDEI?      │ (VERDE)
│ Qual é o problema principal hoje?  │ (cinza)
└────────────────────────────────────┘
```

---

## 📝 DIFERENÇAS: IPA vs SIMPLIFICADO

### ❌ IPA (Alfabeto Fonético Internacional)
- Símbolos complexos: /ə/, /θ/, /ð/, /ʃ/, /ʒ/, /ŋ/
- Difícil de ler sem treinamento
- Exemplo: /wʌt ɪz ðə meɪn ˈprɑbləm/
- **NÃO É USADO NO LINGUAFLOW**

### ✅ SIMPLIFICADO (Usado no LinguaFlow)
- Letras normais e acentos
- Qualquer brasileiro consegue ler
- Exemplo: "UOT IZ DA MEIN PROBLEM?"
- Hífen separa sílabas: "a-báut"
- Acento marca tônica: "símtomz"

---

## 🔧 RECUPERAÇÃO E MANUTENÇÃO

### Para Recuperar dos Backups:

```powershell
# Copiar todos os arquivos de volta
Copy-Item "BACKUP_TALKS\conversationCategories.ts.backup" -Destination "data\conversationCategories.ts" -Force
Copy-Item "BACKUP_TALKS\ConversationView.tsx.backup" -Destination "components\ConversationView.tsx" -Force
Copy-Item "BACKUP_TALKS\geminiService.ts.backup" -Destination "services\geminiService.ts" -Force
Copy-Item "BACKUP_TALKS\conversaCacheService.ts.backup" -Destination "services\conversaCacheService.ts" -Force
```

---

## 🚀 PERFORMANCE E OTIMIZAÇÃO

### Cache Reduz Chamadas à API:
- **1ª vez**: Chama Gemini API (~500ms)
- **2ª+ vez**: Lê do IndexedDB (~10ms)
- **Economia**: 98% mais rápido

### Estatísticas de Cache:
```typescript
// Exemplo com categoria "Hospital" (14 items):
// Primeira carga: 14 chamadas à API (7 segundos)
// Cargas seguintes: 0 chamadas à API (0.14 segundos)
```

---

## 📖 REFERÊNCIAS

### APIs Utilizadas:
- **Gemini API**: `POST /gemini/phonetics` (transcrição simplificada)
- **Gemini API**: `POST /gemini/ipa` (IPA - NÃO USADO na aba Conversa)
- **Proxy Service**: `services/proxyClient.ts`

### Backend Proxy:
- **Arquivo**: `backend/proxy/src/routes/gemini.js`
- **Modelo**: `gemini-2.5-flash`
- **Prompt**: "transcrição fonética simplificada... fácil de entender... falante nativo"

### IndexedDB Schema:
- **Versão**: 8
- **Tabela**: `conversaCache`
- **Índices**: `cacheKey`, `cachedAt`

---

## ✅ CHECKLIST DE VERIFICAÇÃO

### Funcionalidades Implementadas:
- [x] 6 categorias de conversas guiadas
- [x] Transcrição fonética **SIMPLIFICADA** (não IPA!)
- [x] Cache persistente em IndexedDB
- [x] Display de fonética na sidebar (texto VERDE)
- [x] Suporte a Q&A e frases
- [x] Tom formal e informal
- [x] Backup de todos os arquivos
- [x] Documentação corrigida e completa

### Para Testar:
- [ ] Selecionar categoria "Hospital"
- [ ] Verificar texto VERDE com fonética simplificada
- [ ] Confirmar formato: "UOT IZ DA..." (não /wʌt ɪz/)
- [ ] Recarregar página e verificar cache
- [ ] Verificar IndexedDB (Application > IndexedDB > conversaCache)

---

**Documentação CORRIGIDA em**: 2025-11-20 17:30  
**Versão**: 2.0 (CORRIGIDA)  
**Status**: ✅ Completo e CORRETO  
**Formato**: Transcrição SIMPLIFICADA para brasileiros (não IPA!)  
**Total de Items**: 106 conversas guiadas com transcrições fonéticas

**Data**: 2025-11-20  
**Localização**: Aba "Conversa" - Conversas Guiadas

---

## 📋 VISÃO GERAL

O sistema de transcrição fonética permite que os usuários visualizem a pronúncia correta (em IPA - International Phonetic Alphabet) de frases e palavras em inglês durante as conversas guiadas.

### Recursos Principais:
- ✅ Transcrição fonética automática via Gemini API
- ✅ Cache persistente em IndexedDB para reduzir chamadas à API
- ✅ Suporte a 6 categorias de conversas guiadas
- ✅ Display inline de fonética no sidebar
- ✅ Funciona para perguntas e respostas

---

## 📦 ARQUIVOS BACKUPEADOS

Todos os arquivos foram salvos em: `BACKUP_TALKS/`

### Lista de Backups:
1. ✅ `conversationCategories.ts.backup` - 304 linhas, 15KB
2. ✅ `ConversationView.tsx.backup` - UI da aba Conversa
3. ✅ `geminiService.ts.backup` - Funções de transcrição fonética
4. ✅ `conversaCacheService.ts.backup` - Sistema de cache

---

## 🎯 CATEGORIAS DE CONVERSAS GUIADAS

### 1. Entrevista na Imigração (Immigration)
**Registro**: Formal  
**Tipo**: Q&A (Perguntas e Respostas)  
**Total de Items**: 12 perguntas essenciais

**Exemplos**:
- "Qual é o motivo da sua viagem?" → "Estou aqui a turismo por duas semanas."
- "Onde você ficará hospedado?" → "Ficarei no Hotel Central, no centro da cidade."
- "Quanto tempo pretende ficar no país?" → "Permanecerei 14 dias e retorno no dia 20 de julho."

### 2. Hospital (Hospital)
**Registro**: Formal  
**Tipo**: Q&A + Frases

**Seções**:
- **Perguntas de triagem** (8 items)
  - "Qual é o problema principal hoje?" → "Estou sentindo dores fortes no estômago desde ontem."
  - "Quando os sintomas começaram?" → "Começaram há cerca de doze horas."
  
- **Sintomas para mencionar** (6 frases)
  - "Estou com tontura e visão turva."
  - "Tenho dificuldade para respirar."

### 3. Supermercado (Supermarket)
**Registro**: Formal  
**Tipo**: Q&A + Frases

**Seções**:
- **Assistência de compras** (12 items)
- **Frutas e verduras** (8 items)
- **Produtos comuns** (8 items)
- **Cortes de carne** (6 items)
- **Pedidos úteis** (12 frases)

**Total**: 46 items

### 4. Restaurante (Restaurant)
**Registro**: Formal  
**Tipo**: Q&A + Frases

**Seções**:
- **Pedidos guiados** (11 items)
- **Pedidos comuns** (12 frases)

**Total**: 23 items

### 5. Paquera (Dating)
**Registro**: Informal  
**Tipo**: Q&A + Frases

**Seções**:
- **Aberturas e respostas** (3 items)
- **Expressões úteis** (4 frases)

**Total**: 7 items

### 6. Balada (Nightlife)
**Registro**: Informal  
**Tipo**: Frases

**Seções**:
- **Frases rápidas** (4 frases)
  - "Bora pegar algo pra beber?"
  - "Essa música é muito boa!"

---

## 🔧 CÓDIGO - SISTEMA DE TRANSCRIÇÃO FONÉTICA

### Arquivo: `services/geminiService.ts`

#### 1. Função Principal: `getPhonetics`

```typescript
export const getPhonetics = async (
  text: string, 
  targetLangName: string, 
  nativeLangName: string
): Promise<string> => {
  try {
    const { phonetics } = await proxyPost<PhoneticsResponse>('/gemini/phonetics', {
      text,
      targetLangName,
      nativeLangName,
    });
    return phonetics ?? 'Não foi possível gerar a fonética.';
  } catch (error) {
    console.error('Error generating phonetics via proxy:', error);
    return 'Não foi possível gerar a fonética.';
  }
};
```

**Parâmetros**:
- `text`: Texto em inglês para gerar fonética
- `targetLangName`: Idioma alvo (ex: "English")
- `nativeLangName`: Idioma nativo (ex: "Portuguese")

**Retorno**: String com transcrição fonética em IPA

#### 2. Função Alternativa: `getIPA`

```typescript
export const getIPA = async (text: string, langName: string): Promise<string> => {
  try {
    const { ipa } = await proxyPost<IPAResponse>('/gemini/ipa', {
      text,
      langName,
    });
    return ipa ?? 'AFI indisponível';
  } catch (error) {
    console.error('Error fetching IPA via proxy:', error);
    return 'AFI indisponível';
  }
};
```

**Parâmetros**:
- `text`: Texto para transcrever
- `langName`: Nome do idioma

**Retorno**: String com notação IPA

---

## 💾 SISTEMA DE CACHE

### Arquivo: `services/conversaCacheService.ts`

#### Estrutura do Cache:

```typescript
interface CachedTranslation {
  cacheKey: string;       // Chave única baseada em MD5 do texto
  originalText: string;   // Texto original em PT
  translatedText: string; // Tradução em EN
  phoneticText?: string;  // Transcrição fonética IPA
  cachedAt: string;       // Timestamp ISO
}
```

#### Funções Principais:

**1. Salvar Tradução com Fonética**:
```typescript
export const saveCachedTranslation = async (
  originalText: string,
  translatedText: string,
  phoneticText?: string
): Promise<void> => {
  const cacheKey = generateCacheKey(originalText);
  await db.saveConversaCache({
    cacheKey,
    originalText,
    translatedText,
    phoneticText,
    cachedAt: new Date().toISOString()
  });
};
```

**2. Recuperar do Cache**:
```typescript
export const getCachedTranslation = async (
  originalText: string
): Promise<CachedTranslation | null> => {
  const cacheKey = generateCacheKey(originalText);
  return await db.getConversaCacheByKey(cacheKey);
};
```

**3. Verificar Existência**:
```typescript
export const isCached = async (originalText: string): Promise<boolean> => {
  const cacheKey = generateCacheKey(originalText);
  const cached = await db.getConversaCacheByKey(cacheKey);
  return cached !== null;
};
```

---

## 🎨 INTEGRAÇÃO NA UI

### Arquivo: `components/ConversationView.tsx`

#### Fluxo de Exibição de Fonética:

1. **Verificar Cache**:
```typescript
const cached = await conversaCache.getCachedTranslation(originalText);
if (cached && cached.phoneticText) {
  // Usar fonética do cache
  displayPhonetic(cached.phoneticText);
  return;
}
```

2. **Gerar se Não Existir**:
```typescript
const phoneticText = await geminiService.getPhonetics(
  translatedText,
  'English',
  'Portuguese'
);

// Salvar no cache
await conversaCache.saveCachedTranslation(
  originalText,
  translatedText,
  phoneticText
);
```

3. **Exibir no Sidebar**:
```tsx
{phoneticText && (
  <div className="text-xs text-gray-400 italic mt-1">
    /{phoneticText}/
  </div>
)}
```

---

## 📊 ESTATÍSTICAS DO CONTEÚDO

### Total de Items por Categoria:
```
Immigration:    12 items (Q&A)
Hospital:       14 items (Q&A + frases)
Supermarket:    46 items (Q&A + frases)
Restaurant:     23 items (Q&A + frases)
Dating:          7 items (Q&A + frases)
Nightlife:       4 items (frases)
───────────────────────────────
TOTAL:         106 items únicos
```

### Distribuição por Tipo:
- **Formal**: 93 items (Immigration, Hospital, Supermarket, Restaurant)
- **Informal**: 13 items (Dating, Nightlife)

### Seções Especiais:
- **Q&A (Perguntas e Respostas)**: 63 items
- **Frases Úteis**: 43 items

---

## 🔄 COMO FUNCIONA O SISTEMA

### Processo Completo:

```
┌─────────────────────────────────────────────────┐
│ 1. Usuário seleciona categoria de conversa     │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 2. ConversationView carrega items da categoria │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 3. Para cada frase/resposta em inglês:         │
│    - Verifica se existe no cache (IndexedDB)   │
└────────────────┬────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
    CACHE HIT         CACHE MISS
        │                 │
        │                 ▼
        │     ┌───────────────────────────┐
        │     │ 4. Chama Gemini API via   │
        │     │    proxyPost('/gemini/    │
        │     │    phonetics')            │
        │     └───────────┬───────────────┘
        │                 │
        │                 ▼
        │     ┌───────────────────────────┐
        │     │ 5. Recebe IPA do Gemini   │
        │     └───────────┬───────────────┘
        │                 │
        │                 ▼
        │     ┌───────────────────────────┐
        │     │ 6. Salva no cache         │
        │     │    (IndexedDB)            │
        │     └───────────┬───────────────┘
        │                 │
        └────────┬────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 7. Exibe fonética no sidebar da UI              │
│    Formato: /həˈloʊ/ (exemplo)                  │
└─────────────────────────────────────────────────┘
```

---

## 🛠️ EXEMPLO PRÁTICO

### Cenário: Usuário pratica "Restaurante"

**Passo 1**: Usuário seleciona categoria "Restaurante"

**Passo 2**: Sistema carrega frase:
- PT: "Eu gostaria de pedir batatas fritas crocantes, por favor."
- EN: "I would like to order crispy french fries, please."

**Passo 3**: Sistema verifica cache
```typescript
const cacheKey = generateCacheKey("I would like to order crispy french fries, please.");
const cached = await db.getConversaCacheByKey(cacheKey);
// Resultado: null (primeira vez)
```

**Passo 4**: Sistema chama Gemini
```typescript
const phonetic = await getPhonetics(
  "I would like to order crispy french fries, please.",
  "English",
  "Portuguese"
);
// Retorno: "/aɪ wʊd laɪk tuː ˈɔrdər ˈkrɪspi frɛntʃ fraɪz, pliːz/"
```

**Passo 5**: Sistema salva no cache
```typescript
await saveCachedTranslation(
  "Eu gostaria de pedir batatas fritas crocantes, por favor.",
  "I would like to order crispy french fries, please.",
  "/aɪ wʊd laɪk tuː ˈɔrdər ˈkrɪspi frɛntʃ fraɪz, pliːz/"
);
```

**Passo 6**: UI exibe na sidebar
```
┌────────────────────────────────┐
│ English:                       │
│ I would like to order crispy   │
│ french fries, please.          │
│                                │
│ /aɪ wʊd laɪk tuː ˈɔrdər        │
│ ˈkrɪspi frɛntʃ fraɪz, pliːz/   │
└────────────────────────────────┘
```

---

## 🔧 RECUPERAÇÃO E MANUTENÇÃO

### Para Recuperar dos Backups:

```powershell
# Copiar todos os arquivos de volta
Copy-Item "BACKUP_TALKS\conversationCategories.ts.backup" -Destination "data\conversationCategories.ts" -Force
Copy-Item "BACKUP_TALKS\ConversationView.tsx.backup" -Destination "components\ConversationView.tsx" -Force
Copy-Item "BACKUP_TALKS\geminiService.ts.backup" -Destination "services\geminiService.ts" -Force
Copy-Item "BACKUP_TALKS\conversaCacheService.ts.backup" -Destination "services\conversaCacheService.ts" -Force
```

### Para Adicionar Nova Categoria:

**Editar**: `data/conversationCategories.ts`

```typescript
export const CATEGORY_DEFINITIONS: Record<CategoryKey, CategoryDefinition> = {
  // ... categorias existentes
  
  novaCategoria: {
    key: 'novaCategoria',
    title: 'Título da Nova Categoria',
    description: 'Descrição detalhada',
    roleInstruction: 'Instrução para o modelo de IA',
    kickoffPrompt: 'Prompt inicial da conversa',
    register: 'formal', // ou 'informal'
    sections: [
      {
        type: 'qa',
        heading: 'Seção de Perguntas',
        items: [
          { 
            question: 'Pergunta em português?', 
            answer: 'Resposta em português.' 
          },
          // ... mais items
        ],
      },
      {
        type: 'phrases',
        heading: 'Frases Úteis',
        items: [
          'Frase 1 em português',
          'Frase 2 em português',
          // ... mais frases
        ],
      },
    ],
  },
};
```

**Adicionar ao array de keys**:
```typescript
export const CATEGORY_KEYS: CategoryKey[] = [
  'immigration', 
  'hospital', 
  'supermarket', 
  'restaurant', 
  'dating', 
  'nightlife',
  'novaCategoria' // ADICIONAR AQUI
];
```

---

## 📝 ESTRUTURA DE DADOS

### Interface CategoryDefinition
```typescript
export interface CategoryDefinition {
  key: CategoryKey;              // Identificador único
  title: string;                 // Nome exibido na UI
  description: string;           // Descrição da categoria
  roleInstruction: string;       // Instrução para IA (papel)
  kickoffPrompt: string;         // Mensagem inicial da IA
  register: 'formal' | 'informal'; // Tom da conversa
  sections: CategorySection[];   // Seções com conteúdo
}
```

### Interface QAItem
```typescript
export interface QAItem {
  question: string;  // Pergunta em português
  answer: string;    // Resposta em português
}
```

### Interface QASection
```typescript
export interface QASection {
  type: 'qa';
  heading: string;    // Título da seção
  items: QAItem[];    // Array de perguntas/respostas
}
```

### Interface PhraseSection
```typescript
export interface PhraseSection {
  type: 'phrases';
  heading: string;      // Título da seção
  items: string[];      // Array de frases
}
```

---

## 🚀 PERFORMANCE E OTIMIZAÇÃO

### Cache Reduz Chamadas à API:
- **1ª vez**: Chama Gemini API (~500ms)
- **2ª+ vez**: Lê do IndexedDB (~10ms)
- **Economia**: 98% mais rápido

### Estatísticas de Cache:
```typescript
// Exemplo com categoria "Restaurant" (23 items):
// Primeira carga: 23 chamadas à API (11.5 segundos)
// Cargas seguintes: 0 chamadas à API (0.23 segundos)
```

### Limpeza do Cache:
```typescript
// Para limpar todo o cache de conversas:
await db.clearConversaCache();
```

---

## 📖 REFERÊNCIAS

### APIs Utilizadas:
- **Gemini API**: `/gemini/phonetics` e `/gemini/ipa`
- **Proxy Service**: `services/proxyClient.ts`

### IndexedDB Schema:
- **Versão**: 8
- **Tabela**: `conversaCache`
- **Índices**: `cacheKey`, `cachedAt`

### Formato IPA:
- **Padrão**: International Phonetic Alphabet
- **Display**: Entre barras `/exemplo/`
- **Fonte**: Gemini API (Google AI)

---

## ✅ CHECKLIST DE VERIFICAÇÃO

### Funcionalidades Implementadas:
- [x] 6 categorias de conversas guiadas
- [x] Transcrição fonética automática
- [x] Cache persistente em IndexedDB
- [x] Display de fonética na sidebar
- [x] Suporte a Q&A e frases
- [x] Tom formal e informal
- [x] Backup de todos os arquivos
- [x] Documentação completa

### Para Testar:
- [ ] Selecionar categoria "Immigration"
- [ ] Verificar exibição de fonética
- [ ] Recarregar página e verificar cache
- [ ] Testar categoria informal (Dating/Nightlife)
- [ ] Verificar IndexedDB (Application > IndexedDB)

---

**Documentação criada em**: 2025-11-20 17:21  
**Versão**: 1.0  
**Status**: ✅ Completo e funcional  
**Total de Items**: 106 conversas guiadas com transcrições fonéticas
