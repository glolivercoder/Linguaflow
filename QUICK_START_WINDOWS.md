# 🚀 Guia Rápido - Windows

## ✅ Backend ESTÁ RODANDO!

O servidor de pronúncia está ativo em: **http://localhost:8000**

---

## 🧪 Testar o Sistema

### 1. Iniciar o Frontend

Em **outro terminal**:

```bash
npm run dev
```

Acesse: **http://localhost:5173**

### 2. Navegar para Pronúncia

1. Clique na aba **"Lições"**
2. Clique na aba **"Pronúncia"**

### 3. Testar Pronúncia

1. ✅ **Ouvir Referência** - Clique em "Ouvir pronúncia nativa" (usa gTTS - Google Text-to-Speech)
2. 🎤 **Gravar** - Clique em "Gravar minha pronúncia" e fale a frase
3. ⏹️ **Parar** - Clique em "Parar gravação"
4. ⏳ **Aguardar** - A análise será feita automaticamente
5. 📊 **Ver Resultado** - Visualize seu score e feedback!

---

## 📡 API Disponível

- **Health Check**: http://localhost:8000/health
- **Docs**: http://localhost:8000/docs
- **Gerar Referência**: POST http://localhost:8000/generate-reference
- **Analisar Pronúncia**: POST http://localhost:8000/analyze-pronunciation

---

## 🔧 Diferenças da Versão Simplificada

Esta é uma **versão simplificada** para funcionar no Windows sem problemas:

### ✅ O que funciona:
- ✅ Gravação de áudio do microfone
- ✅ Geração de referências com **gTTS** (Google Text-to-Speech)
- ✅ Transcrição com **Google Speech Recognition**
- ✅ Análise baseada em similaridade de texto
- ✅ Feedback contextual
- ✅ Interface completa React

### ⏳ Removido temporariamente:
- ❌ openSMILE (análise acústica avançada)
- ❌ Piper TTS (tinha problemas no Windows)

### 📊 Scoring Simplificado:
- **Precisão de Texto**: Comparação entre o que você falou e o esperado
- **Outros scores**: Estimados com base na precisão do texto
- Feedback baseado em: 90%+ = Excelente, 75%+ = Boa, 60%+ = Continue praticando

---

## 🎯 Como o Sistema Funciona

1. **Você fala** → Microfone grava
2. **Google Speech** → Transcreve o que você disse
3. **Comparação** → Calcula similaridade com texto esperado
4. **Feedback** → Score + mensagem contextual

---

## 🐛 Troubleshooting

### Microfone não funciona
- Permita acesso ao microfone no navegador
- Chrome: `chrome://settings/content/microphone`

### Erro "Failed to generate reference"
- Precisa de conexão com internet (usa Google TTS)
- Verifique firewall

### Backend não responde
- Verifique se está rodando: `http://localhost:8000/health`
- Reinicie: Ctrl+C no terminal e rode novamente:
  ```bash
  uvicorn main_simple:app --host 0.0.0.0 --port 8000 --reload
  ```

---

## 🔄 Para Reiniciar o Backend

Se precisar reiniciar:

```bash
cd backend/pronunciation
uvicorn main_simple:app --host 0.0.0.0 --port 8000 --reload
```

---

## ⭐ Versão Completa com Docker (RECOMENDADA)

### 🐳 Backend com Piper1-GPL + openSMILE

A versão completa agora usa **Piper1-GPL** oficial e **openSMILE** via Docker!

**Vantagens:**
- ✅ TTS de alta qualidade (Piper1-GPL compilado do fonte)
- ✅ Análise acústica profissional (openSMILE)
- ✅ Funciona perfeitamente no Windows via WSL2
- ✅ Isolado e fácil de gerenciar

### Iniciar Backend Docker

```bash
cd backend/pronunciation
INICIAR_PRONUNCIATION.bat
```

Ou manualmente:

```bash
cd backend/pronunciation
docker compose build
docker compose up -d
```

### Verificar Status

- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

### Ver Logs

```bash
cd backend/pronunciation
docker compose logs -f
```

### Parar Backend

```bash
cd backend/pronunciation
docker compose down
```

---

## 📝 Arquivos Importantes

### Backend Docker (Versão Completa)
- **Dockerfile**: `backend/pronunciation/Dockerfile`
- **Docker Compose**: `backend/pronunciation/docker-compose.yml`
- **Main API**: `backend/pronunciation/main.py`
- **Piper1-GPL Generator**: `backend/pronunciation/reference_audio_generator.py`
- **openSMILE Analyzer**: `backend/pronunciation/pronunciation_analyzer.py`
- **Documentação**: `backend/pronunciation/README_PIPER_GPL.md`

### Backend Simplificado (Alternativo)
- **Backend Simplificado**: `backend/pronunciation/main_simple.py`
- **Dependências Simples**: `backend/pronunciation/requirements-simple.txt`

### Frontend
- **Componente**: `components/PronunciationTest.tsx`
- **Service**: `services/pronunciationService.ts`

---

## 🔄 Escolher Versão

### Usar Docker (Recomendado)
```bash
# No backend/pronunciation
docker compose up -d
```
API em: http://localhost:8000

### Usar Versão Simples (Alternativa)
```bash
cd backend/pronunciation
pip install -r requirements-simple.txt
uvicorn main_simple:app --host 0.0.0.0 --port 8000 --reload
```
API em: http://localhost:8000

---

🎉 **Sistema atualizado com Piper1-GPL!** 

📖 Consulte `backend/pronunciation/README_PIPER_GPL.md` para documentação completa.

💡 **Dica**: A versão Docker oferece melhor qualidade e é mais fácil de manter!
