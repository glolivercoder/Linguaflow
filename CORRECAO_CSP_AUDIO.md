# 🔧 Correção CSP - Áudio Bloqueado

## 🐛 Erro Encontrado

```
Loading media from 'http://localhost:8000/references/ref_xxx.mp3' 
violates the following Content Security Policy directive: "default-src 'self'". 
Note that 'media-src' was not explicitly set, so 'default-src' is used as a fallback.
```

## 🎯 Problema

O **Content Security Policy (CSP)** está bloqueando o áudio porque:

1. Frontend roda em `http://localhost:3003` (ou 5173)
2. Backend roda em `http://localhost:8000`
3. CSP `default-src 'self'` só permite **mesma origem**
4. Áudio em `localhost:8000` é considerado **origem diferente**

## ✅ Solução Aplicada

### Alteração em `index.html` linha 7:

**Antes:**
```html
content="default-src 'self' blob:; ..."
```

**Depois:**
```html
content="default-src 'self' blob: http://localhost:* https://localhost:*; ..."
```

**O que isso faz:**
- Permite recursos de **qualquer porta localhost**
- Frontend pode carregar áudio do backend
- Mantém segurança para desenvolvimento

---

## 🚀 Como Aplicar

### **1. Recarregar Página (OBRIGATÓRIO)**

O CSP é lido na **primeira carga da página**. Você DEVE recarregar:

**Opção A - Hard Refresh:**
```
Ctrl + Shift + R
```

**Opção B - Limpar e Recarregar:**
1. Pressione **F12** (DevTools)
2. Clique direito no botão reload 🔄
3. Selecione **"Empty Cache and Hard Reload"**

**Opção C - Fechar e Abrir:**
1. Feche a aba do navegador
2. Abra novamente: `http://localhost:3003` (ou sua porta)

---

## 🧪 Como Testar

### 1. Verificar Console (F12)

**Antes (com erro):**
```
❌ violates the following Content Security Policy directive
❌ Failed to load because no supported source was found
```

**Depois (funcionando):**
```
✅ (Sem erros de CSP)
✅ (Sem erros de carregamento)
```

### 2. Testar Áudio

1. Vá para **Lições → Pronúncia**
2. Veja o botão azul **"Ouvir pronúncia nativa"**
3. **Click no botão** 🔊
4. **Deve tocar o áudio!**

---

## ⚠️ Se Ainda Não Funcionar

### A. Verifique se o Backend Está Rodando

```bash
curl http://localhost:8000/health
```

**Esperado:**
```json
{"status":"healthy","tts":"gTTS (Google)", ...}
```

### B. Verifique se o Áudio Foi Gerado

```bash
dir backend\pronunciation\references
```

**Esperado:**
```
ref_Hello_everyone.mp3
ref_My_name_is_Emma.mp3
...
```

### C. Teste Acesso Direto ao Áudio

Abra no navegador:
```
http://localhost:8000/references/ref_Hello_everyone__let_us_break_the_ice_with_a_quick.mp3
```

**Esperado:** Deve baixar ou tocar o MP3

### D. Verifique CORS no Backend

No terminal do backend, deve aparecer:
```
INFO: "GET /references/ref_xxx.mp3 HTTP/1.1" 200 OK
```

---

## 📊 Checklist de Verificação

- [ ] ✅ `index.html` editado (linha 7)
- [ ] ⚠️ **Página recarregada com Ctrl + Shift + R**
- [ ] ✅ Console sem erros de CSP
- [ ] ✅ Botão azul aparece
- [ ] ✅ Click no botão
- [ ] ✅ **Áudio toca! 🔊**

---

## 🎯 Explicação Técnica

### Content Security Policy (CSP)

É um cabeçalho de segurança que controla **de onde** recursos podem ser carregados:

| Diretiva | O Que Controla | Nossa Configuração |
|----------|----------------|-------------------|
| `default-src` | Fallback padrão | `'self' blob: http://localhost:*` |
| `script-src` | JavaScript | `'self' 'unsafe-eval' 'unsafe-inline' cdn...` |
| `style-src` | CSS | `'self' 'unsafe-inline'` |
| `connect-src` | Fetch/XHR | `* ws: wss:` (todos) |
| `media-src` | Audio/Video | `'self' blob: http://localhost:*` |
| `img-src` | Imagens | `* data: blob:` (todos) |

### Por que `localhost:*` funciona?

- `*` é um wildcard para **qualquer porta**
- `localhost:8000` → Backend API
- `localhost:3003` → Frontend Dev Server
- `localhost:5173` → Vite Default Port

### Alternativa: Desabilitar CSP (NÃO RECOMENDADO)

**Apenas para debug**, você pode comentar o CSP:

```html
<!-- <meta http-equiv="Content-Security-Policy" content="..." /> -->
```

⚠️ **Atenção:** Deixe habilitado para produção!

---

## ✅ Status Final

Após recarregar a página:

| Componente | Status |
|------------|--------|
| CSP Policy | ✅ Corrigido |
| Audio CORS | ✅ Permitido |
| Botão Azul | ✅ Aparece |
| Play Audio | ✅ Funciona |

---

## 🚀 Ação Imediata

1. **Pressione Ctrl + Shift + R** no navegador
2. Vá para **Lições → Pronúncia**
3. Click em **"Ouvir pronúncia nativa"**
4. **Ouça o áudio! 🎉**

---

**Status:** ✅ Corrigido  
**Próximo Passo:** Hard refresh no navegador
