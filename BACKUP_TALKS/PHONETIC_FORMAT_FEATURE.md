# PHONETIC_FORMAT_FEATURE.md - Recurso de Escolha de Formato Fonético

**Data**: 2025-11-20  
**Status**: ✅ UI Implementada, Backend Pendente

---

## 📋 VISÃO GERAL

Novo recurso que permite ao usuário escolher entre dois formatos de transcrição fonética na aba **Ajustes**:
1. **Simplificada** (padrão) - Adaptada para brasileiros
2. **IPA** (International Phonetic Alphabet) - Formato acadêmico

---

## 🎯 ARQUIVOS MODIFICADOS E BACKUPS

### Backups Criados em `BACKUP_TALKS/`:
1. ✅ `types.ts.backup_phonetic_feature`
2. ✅ `SettingsView.tsx.backup_phonetic_feature`
3. ✅ `gemini.js.backup`

---

## 📝 MUDANÇAS IMPLEMENTADAS

### 1. `types.ts`

**Adicionado**:
```typescript
export type PhoneticFormat = 'simplified' | 'ipa';

export interface Settings {
  nativeLanguage: LanguageCode;
  learningLanguage: LanguageCode;
  voiceGender: VoiceGender;
  piperVoiceModel?: string;
  preferOfflineTranslation?: boolean;
  useVoskStt?: boolean;
  openRouterModelId?: string;
  openRouterIncludeFree?: boolean;
  openRouterIncludePaid?: boolean;
  phoneticFormat?: PhoneticFormat; // ← NOVO CAMPO
}
```

### 2. `components/SettingsView.tsx`

**Import adicionado**:
```typescript
import { Settings, VoiceGender, AnkiDeckSummary, VoiceModelInfo, OpenRouterModelSummary, PhoneticFormat } from '../types';
```

**Nova seção de UI** (após "Gênero da Voz"):
```tsx
{/* NEW: Phonetic Format Selection */}
<div className="p-4 bg-gray-800 rounded-lg space-y-3">
  <div>
    <h3 className="text-lg font-semibold text-gray-200">Formato de Transcrição Fonética</h3>
    <p className="text-xs text-gray-400 mt-1">
      Escolha como deseja visualizar a pronúncia das palavras em inglês na aba Conversa.
    </p>
  </div>
  
  <div className="space-y-3">
    {/* Simplified Option */}
    <label className="flex items-start gap-3 p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
      <input
        type="radio"
        name="phoneticFormat"
        value="simplified"
        checked={(settings.phoneticFormat ?? 'simplified') === 'simplified'}
        onChange={() => onSettingsChange({ ...settings, phoneticFormat: 'simplified' })}
        className="mt-1 h-4 w-4 text-cyan-500 focus:ring-cyan-500"
      />
      <div className="flex-1">
        <div className="text-white font-medium">Simplificada (Recomendado)</div>
        <div className="text-xs text-gray-400 mt-1">
          Adaptada para brasileiros, usando letras normais e acentos.
        </div>
        <div className="mt-2 p-2 bg-gray-900/60 rounded border border-gray-600">
          <div className="text-xs text-gray-300 font-mono">
            <span className="text-gray-500">Exemplo:</span> "Hello, how are you?"
          </div>
          <div className="text-sm text-green-400 font-mono mt-1">
            re-LÔU, rau ár iú?
          </div>
        </div>
      </div>
    </label>

    {/* IPA Option */}
    <label className="flex items-start gap-3 p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
      <input
        type="radio"
        name="phoneticFormat"
        value="ipa"
        checked={settings.phoneticFormat === 'ipa'}
        onChange={() => onSettingsChange({ ...settings, phoneticFormat: 'ipa' })}
        className="mt-1 h-4 w-4 text-cyan-500 focus:ring-cyan-500"
      />
      <div className="flex-1">
        <div className="text-white font-medium">IPA (Alfabeto Fonético Internacional)</div>
        <div className="text-xs text-gray-400 mt-1">
          Formato padrão acadêmico com símbolos especiais (θ, ð, ə, etc.).
        </div>
        <div className="mt-2 p-2 bg-gray-900/60 rounded border border-gray-600">
          <div className="text-xs text-gray-300 font-mono">
            <span className="text-gray-500">Exemplo:</span> "Hello, how are you?"
          </div>
          <div className="text-sm text-green-400 font-mono mt-1">
            /həˈloʊ, haʊ ɑr juː/
          </div>
        </div>
      </div>
    </label>
  </div>
</div>
```

---

## 🔧 PROMPTS PARA CADA FORMATO

### Prompt Simplificado (Atual - Padrão)
```javascript
const prompt = `Gere uma transcrição fonética simplificada para a frase "${text}" em ${targetLangName}. 
A transcrição deve ser fácil de entender para um falante nativo de ${nativeLangName}. 
Use uma notação simples e intuitiva. 
Responda apenas com a transcrição fonética.`;
```

**Exemplo de saída**: `"UOT IZ DA MEIN PROBLEM TUDEI?"`

### Prompt IPA (Novo - Quando selecionado)
```javascript
const prompt = `Forneça a transcrição do Alfabeto Fonético Internacional (IPA) para a frase "${text}" em ${targetLangName}. 
Use apenas símbolos IPA padrão (como ə, θ, ð, ʃ, ʒ, ŋ, etc.). 
Responda apenas com a transcrição IPA entre barras, por exemplo: /həˈloʊ/.`;
```

**Exemplo de saída**: `"/wʌt ɪz ðə meɪn ˈprɑbləm təˈdeɪ/"`

---

## 📊 EXEMPLOS COMPARATIVOS

| Frase em Inglês | Simplificada | IPA |
|-----------------|--------------|-----|
| Hello | re-LÔU | /həˈloʊ/ |
| How are you? | rau ár iú? | /haʊ ɑr juː/ |
| What is the main problem today? | UOT IZ DA MEIN PROBLEM TUDEI? | /wʌt ɪz ðə meɪn ˈprɑbləm təˈdeɪ/ |
| I have been feeling | ai hév bin fíling | /aɪ hæv biːn ˈfiːlɪŋ/ |

---

## ⚠️ IMPLEMENTAÇÃO PENDENTE

### Backend: `backend/proxy/src/routes/gemini.js`

**Modificação necessária no endpoint `/gemini/phonetics`**:

```javascript
app.post('/gemini/phonetics', async (req, res) => {
  const { text, targetLangName, nativeLangName, format } = req.body ?? {}; // ← ADICIONAR format
  
  if (!text || !targetLangName || !nativeLangName) {
    return res.status(400).json({ 
      error: 'Campos text, targetLangName e nativeLangName são obrigatórios.' 
    });
  }

  try {
    const phoneticFormat = format ?? 'simplified'; // ← Default para simplified
    
    let prompt;
    if (phoneticFormat === 'ipa') {
      // PROMPT IPA
      prompt = `Forneça a transcrição do Alfabeto Fonético Internacional (IPA) para a frase "${text}" em ${targetLangName}. 
Use apenas símbolos IPA padrão (como ə, θ, ð, ʃ, ʒ, ŋ, etc.). 
Responda apenas com a transcrição IPA entre barras, por exemplo: /həˈloʊ/.`;
    } else {
      // PROMPT SIMPLIFICADO (atual)
      prompt = `Gere uma transcrição fonética simplificada para a frase "${text}" em ${targetLangName}. 
A transcrição deve ser fácil de entender para um falante nativo de ${nativeLangName}. 
Use uma notação simples e intuitiva. 
Responda apenas com a transcrição fonética.`;
    }
    
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

### Frontend: `services/geminiService.ts`

**Modificação necessária**:

```typescript
export const getPhonetics = async (
  text: string, 
  targetLangName: string, 
  nativeLangName: string,
  format?: 'simplified' | 'ipa' // ← ADICIONAR parâmetro opcional
): Promise<string> => {
  try {
    const { phonetics } = await proxyPost<PhoneticsResponse>('/gemini/phonetics', {
      text,
      targetLangName,
      nativeLangName,
      format: format ?? 'simplified', // ← ENVIAR formato
    });
    return phonetics ?? 'Não foi possível gerar a fonética.';
  } catch (error) {
    console.error('Error generating phonetics via proxy:', error);
    return 'Não foi possível gerar a fonética.';
  }
};
```

### Frontend: `components/ConversationView.tsx`

**Modificação necessária** (onde chama getPhonetics):

```typescript
// Importar settings no componente
const { settings } = props; // ou useContext se estiver em contexto

// Ao chamar getPhonetics:
const phoneticText = await getPhonetics(
  translatedText,
  'English',
  'Portuguese',
  settings.phoneticFormat // ← PASSAR configuração do usuário
);
```

---

##  COMO RECUPERAR

### Recuperar Arquivos Originais:
```powershell
# Recuperar types.ts
Copy-Item "BACKUP_TALKS\types.ts.backup_phonetic_feature" -Destination "types.ts" -Force

# Recuperar SettingsView.tsx
Copy-Item "BACKUP_TALKS\SettingsView.tsx.backup_phonetic_feature" -Destination "components\SettingsView.tsx" -Force

# Recuperar backend (se modificado)
Copy-Item "BACKUP_TALKS\gemini.js.backup" -Destination "backend\proxy\src\routes\gemini.js" -Force
```

### Remover Recurso Completamente:

1. **Reverter types.ts**:
```typescript
// Remover estas linhas:
export type PhoneticFormat = 'simplified' | 'ipa';
// E remover do Settings:
phoneticFormat?: PhoneticFormat;
```

2. **Reverter SettingsView.tsx**:
- Remover import de `PhoneticFormat`
- Remover toda a seção "Phonetic Format Selection"

3. **Reverter backend** (se modificado):
- Remover parâmetro `format` do endpoint
- Usar apenas prompt simplificado

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Concluído:
- [x] Tipo `PhoneticFormat` criado em `types.ts`
- [x] Campo `phoneticFormat` adicionado ao `Settings`
- [x] UI de seleção criada em `SettingsView.tsx`
- [x] Exemplos visuais implementados
- [x] Backups criados
- [x] Documentação completa

### Pendente:
- [ ] Modificar backend `gemini.js` para aceitar parâmetro `format`
- [ ] Atualizar `geminiService.ts` para enviar formato
- [ ] Modificar `ConversationView.tsx` para passar `settings.phoneticFormat`
- [ ] Testar formato Simplificado
- [ ] Testar formato IPA
- [ ] Limpar cache de fonética existente (opcional)
- [ ] Atualizar walkthrough.md

---

## � COMO COMPLETAR A IMPLEMENTAÇÃO

### Passo 1: Backend
1. Abrir `backend/proxy/src/routes/gemini.js`
2. Localizar função `app.post('/gemini/phonetics', ...)`
3. Adicionar parâmetro `format` na desestruturação
4. Adicionar lógica condicional para escolher prompt
5. Testar com Postman ou similar

### Passo 2: Frontend Service
1. Abrir `services/geminiService.ts`
2. Adicionar parâmetro `format` em `getPhonetics`
3. Enviar `format` no body do `proxyPost`

### Passo 3: Frontend Component
1. Abrir `components/ConversationView.tsx`
2. Garantir acesso a `settings`
3. Passar `settings.phoneticFormat` ao chamar `getPhonetics`

### Passo 4: Teste
1. Ir para Ajustes
2. Selecionar "Simplificada"
3. Ir para Conversa e verificar fonética
4. Voltar para Ajustes
5. Selecionar "IPA"
6. Ir para Conversa e verificar fonética

---

**Documentação criada em**: 2025-11-20 17:56  
**Versão**: 1.0  
**Status**: ✅ UI Completa, Backend Pendente  
**Backups**: Seguros em BACKUP_TALKS/
