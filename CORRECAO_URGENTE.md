# 🚨 Correção Urgente - CORS e CSP

## ❌ Problemas Encontrados

### 1. CORS Bloqueando Requisições
```
Access to fetch at 'http://localhost:8000/generate-reference' 
from origin 'http://localhost:3003' has been blocked by CORS policy
```

**Causa:** Frontend rodando em porta 3003, mas backend só permite 5173 e 3000

### 2. CSP Bloqueando Áudio Gravado
```
Loading media from 'blob:http://localhost:3003/...' 
violates Content Security Policy
```

**Causa:** CSP não permite blob URLs para media

### 3. Botão Azul Não Aparece
- Geração de referência falha (CORS)
- Sem `referenceAudioPath`, botão não é renderizado

---

## ✅ Correções Aplicadas

### 1. Backend CORS (main_simple.py)
```python
allow_origins=[
    "http://localhost:5173", 
    "http://localhost:3000", 
    "http://localhost:3003"  # ← ADICIONADO
]
```

### 2. CSP (index.html)
```html
content="default-src 'self' blob:; ... media-src 'self' blob: data: ..."
```

### 3. Error Handling (PronunciationTest.tsx)
- Mostra erro quando referência falha
- Botão "Tentar gerar áudio novamente"
- Permite gravar mesmo sem referência

---

## 🔧 PASSOS PARA APLICAR

### **1. Reiniciar Backend (OBRIGATÓRIO)**

**Feche a janela "LinguaFlow Backend" e execute:**

```bash
cd backend\pronunciation
uvicorn main_simple:app --host 0.0.0.0 --port 8000 --reload
```

### **2. Recarregar Frontend**

No navegador:
- Pressione **Ctrl + Shift + R** (hard refresh)
- Ou feche e abra novamente

### **3. Verificar**

1. Console não deve mostrar erros de CORS
2. Botão azul "Ouvir pronúncia nativa" deve aparecer
3. Áudio de referência deve tocar
4. Gravação deve funcionar

---

## 🧪 Como Testar

### Teste 1: Verificar CORS
```bash
# Em outro terminal
curl -X POST http://localhost:8000/generate-reference -F "text=Hello test" -H "Origin: http://localhost:3003"
```

**Esperado:** Resposta 200 OK com `audio_path`

### Teste 2: Verificar Frontend

1. Abra `http://localhost:3003` (ou porta que estiver rodando)
2. Vá para **Lições → Pronúncia**
3. Deve aparecer: "Gerando áudio de referência..."
4. Depois: Botão azul "Ouvir pronúncia nativa"
5. Click no botão azul → Áudio toca
6. Click em "Gravar" → Gravação funciona

---

## 📊 Checklist de Verificação

- [ ] Backend reiniciado com novo CORS
- [ ] Frontend recarregado (Ctrl + Shift + R)
- [ ] Console sem erros de CORS
- [ ] Console sem erros de CSP
- [ ] Botão azul aparece
- [ ] Áudio de referência toca
- [ ] Gravação funciona
- [ ] Análise retorna resultados

---

## ⚠️ Se Ainda Não Funcionar

### A. Verificar Porta do Frontend

```bash
# No terminal onde o frontend está rodando
# Deve mostrar algo como:
# VITE v6.x.x  ready in xxx ms
# ➜  Local:   http://localhost:XXXX/
```

**Se não for 3003, 5173 ou 3000:**
1. Pare o frontend (Ctrl+C)
2. Execute: `npm run dev -- --port 5173`

### B. Verificar Backend Respondendo

```bash
curl http://localhost:8000/health
```

**Esperado:**
```json
{"status":"healthy","tts":"gTTS (Google)", ...}
```

### C. Limpar Cache do Navegador

1. Pressione **F12** (DevTools)
2. Clique direito no botão Reload
3. Selecione **"Empty Cache and Hard Reload"**

### D. Verificar Logs do Backend

Na janela do backend, deve aparecer:
```
INFO: "POST /generate-reference HTTP/1.1" 200 OK
INFO: Generating reference audio for: [texto]
INFO: Reference audio generated: references/ref_xxx.mp3
```

---

## 🎯 O Que Deve Funcionar Agora

✅ **Geração de Referência TTS**
- Backend gera MP3 com gTTS
- Frontend recebe caminho correto
- Botão azul aparece

✅ **Reprodução de Áudio**
- Click no botão azul toca referência
- Blob URLs funcionam (áudio gravado)

✅ **Gravação de Voz**
- MediaRecorder captura áudio
- Upload para backend via FormData
- CORS permite a requisição

✅ **Análise de Pronúncia**
- Transcrição funciona
- Scoring retorna
- Feedback exibido

---

## 📝 Mudanças de Código

### Arquivo 1: `backend/pronunciation/main_simple.py`
- Linha 29: Adicionado `"http://localhost:3003"` ao CORS

### Arquivo 2: `index.html`
- Linha 7: Adicionado `blob:` ao `default-src` e `media-src`

### Arquivo 3: `components/PronunciationTest.tsx`
- Linhas 42-54: Melhor error handling
- Linhas 169-179: Botão "Tentar novamente"

---

## ✅ Status Final

Após aplicar as correções e reiniciar:

| Componente | Status |
|------------|--------|
| Backend CORS | ✅ Corrigido |
| CSP Policy | ✅ Corrigido |
| Error Handling | ✅ Melhorado |
| Botão Azul | ✅ Deve aparecer |
| Áudio Referência | ✅ Deve tocar |
| Gravação | ✅ Deve funcionar |
| Análise | ✅ Deve funcionar |

---

**🚀 Ação Imediata:** 
1. **Reinicie o backend**
2. **Recarregue o frontend (Ctrl + Shift + R)**
3. **Teste na aba Pronúncia**
