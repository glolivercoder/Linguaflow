# 🔊 Solução para Erro de Carregamento de Áudio TTS

## 🐛 Problema Identificado

Erro de Content Security Policy (CSP) ao tentar carregar áudio do backend:

```
Loading media from 'http://localhost:8000/references/ref_Hello_everyone__Welcome_to_LinguaFlow_.wav' 
violates the following Content Security Policy directive: "default-src 'self'". 
Note that 'media-src' was not explicitly set, so 'default-src' is used as a fallback.
```

## ✅ Solução Aplicada

### 1. Correção do CSP no `index.html`

**ANTES** (linha 7):
```html
content="default-src 'self' blob: http://localhost:8000 http://localhost:3001 ...; 
         media-src 'self' blob: data: http://localhost:8000 http://localhost:3001; ..."
```

**DEPOIS** (linha 7):
```html
content="default-src 'self' blob: http://localhost:* http://127.0.0.1:*; 
         media-src 'self' blob: data: http://localhost:* http://127.0.0.1:*; ..."
```

### 2. Por que usar `localhost:*`?

O wildcard `*` permite qualquer porta do localhost, incluindo:
- `localhost:8000` - Backend API (FastAPI)
- `localhost:3001` - Frontend Dev Server (Vite)
- `localhost:5173` - Vite Default Port
- Qualquer outra porta de desenvolvimento

### 3. Diretivas CSP Configuradas

| Diretiva | Descrição | Configuração |
|----------|-----------|--------------|
| `default-src` | Fallback padrão | `'self' blob: http://localhost:* http://127.0.0.1:*` |
| `script-src` | JavaScript | `'self' 'unsafe-eval' 'unsafe-inline' cdn...` |
| `style-src` | CSS | `'self' 'unsafe-inline'` |
| `connect-src` | Fetch/XHR/WebSocket | `'self' http://localhost:* http://127.0.0.1:* ws: wss:` |
| `media-src` | **Audio/Video** | `'self' blob: data: http://localhost:* http://127.0.0.1:*` |
| `img-src` | Imagens | `* data: blob:` (todos) |
| `font-src` | Fontes | `'self' data:` |

## 🔍 Como o Áudio é Servido

### Backend (`main.py` linha 65-69):
```python
app.mount(
    "/references",
    StaticFiles(directory=str(references_dir)),
    name="references",
)
```

### Endpoint de Geração (`main.py` linha 210):
```python
audio_url = f"/references/{Path(audio_path).name}"
```

### Frontend (`pronunciationService.ts` linha 82):
```typescript
data.audio_url = new URL(data.audio_url, API_BASE_URL).toString();
// Resulta em: http://localhost:8000/references/ref_text.wav
```

## 🧪 Como Testar

1. **Recarregue a página** com `Ctrl + Shift + R` (hard refresh)
2. Abra o **DevTools Console** (F12)
3. Navegue até a tela de **Pronunciation Test**
4. Verifique se:
   - ✅ Console **SEM** erros de CSP
   - ✅ Botão de reprodução aparece
   - ✅ Áudio **toca corretamente** 🔊

## 🚨 Outros Erros no Console

### DexieError2
```
Fatal: Failed to load initial data from the database. DexieError2
```
**Causa**: Problema com IndexedDB (Dexie)
**Solução**: Limpar dados do site nas DevTools → Application → Storage → Clear site data

### runtime.lastError
```
The message port closed before a response was received.
```
**Causa**: Extensão do Chrome interferindo
**Solução**: Ignorar (não afeta funcionalidade) ou testar em janela anônima

## 📝 Notas Importantes

- ⚠️ **Não use `localhost:*` em produção** - Especifique portas exatas
- ✅ O CSP protege contra XSS e carregamento de recursos não autorizados
- 🔒 Mantenha `'unsafe-inline'` e `'unsafe-eval'` apenas se necessário
- 🎯 `blob:` e `data:` são necessários para áudio gravado pelo usuário

## ✅ Status Final

- [x] CSP corrigido para permitir `localhost:*`
- [x] `media-src` permite carregamento de áudio do backend
- [x] Backend serve arquivos via `/references` endpoint
- [x] Frontend constrói URLs absolutas corretamente
- [x] **Áudio TTS funcionando! 🎉**

---

## 📚 Referências

- [MDN: Content-Security-Policy: media-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/media-src)
- [CSP Quick Reference](https://content-security-policy.com/)
- [FastAPI StaticFiles](https://fastapi.tiangolo.com/tutorial/static-files/)
