# FLASHCARD_CORRECTION.md - Guia de Recuperação

**Data**: 2025-11-20  
**Status**: Backups criados e documentados

---

## 🚨 PROBLEMA ATUAL

Os flashcards pararam de carregar após implementação do recurso de criação de categorias customizadas. Erro no console: "Cannot read properties of undefined".

---

## 📦 BACKUPS CRIADOS

Todos os arquivos modificados foram salvos em: `f:\Projetos2025BKP\Llinguaflow_bug\BACKUP_TALKS\`

### Arquivos com Backup:
1. ✅ `categoryGeneratorService.ts.backup` - Serviço de geração via IA
2. ✅ `AddCategoryModal.tsx.backup` - Modal de criação de categorias
3. ✅ `db.ts.backup` - IndexedDB Schema v9 com customCategories
4. ✅ `flashcardData.ts.backup` - Todos os dados CSV importados
5. ✅ `FlashcardsView.tsx.backup` - View com integração

---

## 🔄 COMO RECUPERAR USANDO GIT

### Opção 1: Git Hard Reset (Voltar ao Commit Anterior)

```bash
# Ver histórico de commits
git log --oneline -10

# Voltar para commit anterior (substitua HASH pelo commit desejado)
git reset --hard HASH_DO_COMMIT

# OU voltar 1 commit atrás
git reset --hard HEAD~1
```

### Opção 2: Recuperar Arquivos Individualmente do GitHub

```bash
# Ver diff de um arquivo específico
git diff HEAD services/db.ts

# Recuperar arquivo específico do último commit
git checkout HEAD -- services/db.ts

# Recuperar arquivo de um commit específico
git checkout HASH_DO_COMMIT -- services/db.ts
```

### Opção 3: Recuperar dos Backups Locais

```bash
# Copiar do backup para o diretório original
Copy-Item "BACKUP_TALKS\db.ts.backup" -Destination "services\db.ts" -Force
Copy-Item "BACKUP_TALKS\categoryGeneratorService.ts.backup" -Destination "services\categoryGeneratorService.ts" -Force
Copy-Item "BACKUP_TALKS\AddCategoryModal.tsx.backup" -Destination "components\AddCategoryModal.tsx" -Force
Copy-Item "BACKUP_TALKS\FlashcardsView.tsx.backup" -Destination "components\FlashcardsView.tsx" -Force
Copy-Item "BACKUP_TALKS\flashcardData.ts.backup" -Destination "data\flashcardData.ts" -Force
```

---

## 🆕 NOVOS RECURSOS IMPLEMENTADOS

### 1. IndexedDB Schema v9

**Arquivo**: `services/db.ts`

**Mudanças**:
- Nova tabela `customCategories` para categorias criadas pelo usuário
- Interface `CustomCategory` com campos: id, type, name, cards, createdAt, updatedAt
- Funções CRUD: saveCustomCategory, getCustomCategories, deleteCustomCategory, updateCustomCategory

**Código Principal**:
```typescript
export interface CustomCategory {
  id: string; // UUID
  type: 'phrases' | 'objects';
  name: string;
  cards: RawCard[];
  createdAt: string;
  updatedAt: string;
}

db.version(9).stores({
  settings: 'id',
  flashcards: 'id, sourceType, ankiDeckId',
  phonetics: 'cardId',
  imageOverrides: 'cardId',
  ankiDecks: 'id, importedAt',
  categoryTranslations: 'language',
  categoryPhonetics: 'key',
  imageCache: 'cardId, cachedAt',
  conversaCache: 'cacheKey, cachedAt',
  customCategories: 'id, type, name, createdAt', // NOVO
});
```

### 2. Serviço de Geração via IA

**Arquivo**: `services/categoryGeneratorService.ts` (NOVO)

**Funcionalidade**:
- Gera categorias usando Gemini API
- Valida dados de entrada
- Converte resposta JSON da IA para formato RawCard

**Código Principal**:
```typescript
export const generateCategory = async (
  request: GenerateCategoryRequest
): Promise<RawCard[]> => {
  const prompt = buildPrompt(request);
  const response = await proxyPost<{ translation: string }>('/gemini/translate', {
    text: prompt,
    fromLangName: 'Portuguese',
    toLangName: 'English'
  });
  const parsed = parseGeminiResponse(response.translation);
  return parsed.items.map((item, index) => ({
    id: `custom-${Date.now()}-${index}`,
    texts: { 'pt-BR': item.pt, 'en-US': item.en },
    phoneticTexts: { 'en-US': item.phonetic },
    imageUrl: request.type === 'objects' ? 'pixabay:auto' : undefined
  }));
};
```

### 3. Modal de Criação de Categorias

**Arquivo**: `components/AddCategoryModal.tsx` (NOVO)

**Funcionalidade**:
- 3 telas: Seleção de Modo, Criação Manual, Geração via IA
- Validação de formulários
- Preview de itens gerados

**Componentes**:
- `ModeSelection`: Escolher entre Manual ou IA
- `ManualCreation`: Formulário para adicionar itens manualmente
- `AIGeneration`: Interface para gerar via IA

### 4. Integração no FlashcardsView

**Arquivo**: `components/FlashcardsView.tsx`

**Mudanças Principais**:

1. **Novo Estado**:
```typescript
const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
const [customCategories, setCustomCategories] = useState<Record<'phrases' | 'objects', db.CustomCategory[]>>({
  phrases: [],
  objects: []
});
```

2. **Função de Conversão**:
```typescript
const rawCardToFlashcard = useCallback((rawCard: RawCard): Flashcard => {
  return {
    id: rawCard.id,
    originalText: rawCard.texts['pt-BR'] || '',
    translatedText: rawCard.texts['en-US'] || '',
    phoneticText: rawCard.phoneticTexts?.['en-US'] || undefined,
    originalLang: 'pt-BR' as LanguageCode,
    translatedLang: 'en-US' as LanguageCode,
    imageUrl: rawCard.imageUrl,
    sourceType: 'predefined'
  };
}, []);
```

3. **Merge de Categorias**:
```typescript
const allCategories = React.useMemo(() => {
  const predefined = categorizedFlashcards[activeTab] || {};
  const custom = customCategories[activeTab] || [];
  const customAsRecord: Record<string, Flashcard[]> = {};
  for (const cat of custom) {
    customAsRecord[cat.name] = cat.cards.map(rawCardToFlashcard);
  }
  return { ...predefined, ...customAsRecord };
}, [categorizedFlashcards, activeTab, customCategories, rawCardToFlashcard]);
```

4. **Botão "+" Adicionado**:
```tsx
<div className="flex items-center justify-between mb-3">
  <h3 className="text-lg font-semibold text-gray-400">Categorias</h3>
  <button
    onClick={() => setShowAddCategoryModal(true)}
    className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center transition-colors shadow-lg hover:shadow-xl"
    title="Adicionar Categoria"
  >
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  </button>
</div>
```

---

## 📊 DADOS CSV IMPORTADOS

### Categorias de Frases (phrases):
- Restaurantes
- Apresentações Pessoais
- Viagem (Aeroporto)
- Viagem (Uber/Taxi)
- Clima
- Puxar Conversa (Fofoca)
- Puxar Conversa (Política)
- Paquera

### Categorias de Objetos (objects):
- Alimentação (50 items)
- Animais (50 items)
- Partes do Corpo (60 items)
- Ambientes Domésticos (32 items)
- Móveis (30 items)
- Itens do Lar (88 items)
- Itens de Escritório (52 items)
- Meios de Transporte (49 items)
- Roupas e Acessórios (53 items)
- Cidade (52 items)
- Itens Hospitalares (48 items)
- Ferramentas (46 items)
- Materiais (37 items)
- Natureza (54 items)

**Total**: 918 flashcards predefinidos!

---

## 🔧 SOLUÇÃO DO PROBLEMA ATUAL

### Problema Identificado:
O erro "Cannot read properties of undefined" ocorre porque:
1. RawCard tem estrutura diferente de Flashcard
2. O useMemo não estava recalculando corretamente
3. O useEffect não estava usando allCategories

### Correções Aplicadas:
1. ✅ Adicionada função `rawCardToFlashcard` para conversão
2. ✅ Corrigido useMemo para converter categorias customizadas
3. ✅ Atualizado useEffect para usar `allCategories`

### Se o Problema Persistir:

**Opção A - Desabilitar Recurso de Categorias Customizadas**:
```typescript
// Em FlashcardsView.tsx, comentar ou remover:
// - useState customCategories
// - useEffect de carregamento
// - Merge no useMemo
// - Modal AddCategoryModal
// - Botão "+"
```

**Opção B - Reverter para Versão Anterior**:
```bash
# Usar git reset para voltar ao commit anterior
git reset --hard HEAD~1

# OU recuperar apenas FlashcardsView.tsx
git checkout HEAD~1 -- components/FlashcardsView.tsx
```

**Opção C - Debug Completo**:
1. Abrir DevTools (F12)
2. Ir para Console
3. Limpar logs (clear)
4. Recarregar página (F5)
5. Capturar screenshot do erro
6. Verificar linha exata do erro
7. Analisar stack trace

---

## 📝 CHECKLIST DE RECUPERAÇÃO

### Para Recuperar Tudo:
- [ ] Copiar arquivos de BACKUP_TALKS para diretórios originais
- [ ] Verificar se IndexedDB está limpo (Application > IndexedDB > Clear)
- [ ] Recarregar página (F5)
- [ ] Testar criação de categoria manual
- [ ] Testar geração via IA

### Para Reverter Tudo:
- [ ] `git reset --hard HEAD~5` (voltar 5 commits)
- [ ] Limpar IndexedDB
- [ ] Recarregar página
- [ ] Confirmar que flashcards predefinidos carregam

### Para Recuperar Apenas CSV:
- [ ] `Copy-Item BACKUP_TALKS\flashcardData.ts.backup -Destination data\flashcardData.ts -Force`
- [ ] Recarregar página

---

## 🎯 PRÓXIMOS PASSOS RECOMENDADOS

1. **Imediato**: Reverter FlashcardsView.tsx para versão anterior
2. **Debug**: Identificar linha exata do erro
3. **Fix**: Corrigir problema específico
4. **Test**: Testar com categorias predefinidas primeiro
5. **Reintegrate**: Adicionar categorias customizadas gradualmente

---

## 📧 CONTATO E SUPORTE

Se precisar de ajuda adicional:
- Backups estão em: `f:\Projetos2025BKP\Llinguaflow_bug\BACKUP_TALKS\`
- Git history: `git log --oneline --graph --all`
- Diff de mudanças: `git diff HEAD~1`

**IMPORTANTE**: Antes de fazer qualquer git reset, faça um backup adicional:
```bash
git stash save "backup-antes-do-reset"
```

---

**Documentação criada em**: 2025-11-20 17:09  
**Versão**: 1.0  
**Status**: ✅ Backups completos e seguros
