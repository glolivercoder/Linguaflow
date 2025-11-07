# 🎤 Guia Rápido - Sistema de Pronúncia

## 🚀 Início Rápido

### 1. Iniciar o Backend de Pronúncia

**Opção A: Docker (Recomendado)**
```bash
cd backend/pronunciation
docker-compose up --build
```

**Opção B: Setup Manual**

**Windows:**
```bash
cd backend/pronunciation
setup.bat
venv\Scripts\activate
python main.py
```

**Linux/Mac:**
```bash
cd backend/pronunciation
chmod +x setup.sh
./setup.sh
source venv/bin/activate
python main.py
```

O backend estará disponível em: `http://localhost:8000`

### 2. Iniciar o Frontend

Em outro terminal:

```bash
npm run dev
```

O frontend estará disponível em: `http://localhost:5173`

### 3. Testar o Sistema de Pronúncia

1. Acesse `http://localhost:5173`
2. Clique na aba **"Lições"**
3. Clique na aba **"Pronúncia"**
4. Selecione uma frase para praticar
5. Clique em **"Ouvir pronúncia nativa"** (usa Piper TTS)
6. Clique em **"Gravar minha pronúncia"**
7. Fale a frase no microfone
8. Clique em **"Parar gravação"**
9. Aguarde a análise (openSMILE + Speech Recognition)
10. Visualize seu score e feedback detalhado!

---

## 📊 Como Funciona

### Backend (Python + FastAPI)

1. **openSMILE** extrai features acústicas:
   - Pitch (entonação)
   - Jitter/Shimmer (fluência)
   - HNR (clareza vocal)
   - Spectral flux

2. **Piper TTS** gera áudios de referência nativos:
   - Voz natural americana (en_US-lessac-medium)
   - WAV 16kHz mono
   - Geração sob demanda

3. **Google Speech API** transcreve o áudio

4. **PronunciationScorer** calcula:
   - Score de entonação (30%)
   - Score de fluência (25%)
   - Score de clareza (20%)
   - Score de precisão textual (25%)

### Frontend (React + TypeScript)

1. **AudioRecorder** grava áudio do microfone
   - MediaRecorder API
   - Configuração otimizada (16kHz, mono, noise suppression)

2. **PronunciationTest** component:
   - Interface de gravação interativa
   - Player de referência TTS
   - Visualização de resultados com 4 métricas
   - Feedback contextual

3. **pronunciationService** integra com backend:
   - Upload de áudio
   - Análise de pronúncia
   - Geração de referências

---

## 🧪 Testar API Diretamente

### Health Check
```bash
curl http://localhost:8000/health
```

### Gerar Áudio de Referência
```bash
curl -X POST http://localhost:8000/generate-reference \
  -F "text=Hello everyone"
```

### Analisar Pronúncia
```bash
curl -X POST http://localhost:8000/analyze-pronunciation \
  -F "audio=@recording.wav" \
  -F "expected_text=Hello everyone"
```

---

## 🐛 Troubleshooting

### Backend não inicia
- Verifique se Python 3.11+ está instalado: `python --version`
- Verifique se todas dependências foram instaladas: `pip list`
- Baixe o modelo TTS: `python -m piper.download_voices en_US-lessac-medium`

### Erro "Microphone access denied"
- Permita acesso ao microfone no navegador
- Chrome: Settings > Privacy > Site Settings > Microphone
- Firefox: Preferences > Privacy & Security > Permissions > Microphone

### Erro "Failed to analyze pronunciation"
- Verifique se o backend está rodando: `http://localhost:8000/health`
- Verifique CORS no console do navegador
- Certifique-se que o áudio foi gravado corretamente

### Transcrição incorreta
- O Google Speech API pode ter dificuldades com:
  - Sotaques fortes
  - Áudio com ruído de fundo
  - Volume muito baixo
- Tente falar mais claramente e próximo ao microfone

### Piper TTS não gera áudio
- Verifique se o modelo foi baixado:
  - Windows: `%USERPROFILE%\.local\share\piper-voices\`
  - Linux/Mac: `~/.local/share/piper-voices/`
- Baixe manualmente se necessário: `python -m piper.download_voices en_US-lessac-medium`

---

## 📈 Próximos Passos

- [ ] WebSocket para feedback em tempo real durante gravação
- [ ] Biblioteca de 50+ frases pré-gravadas
- [ ] Visualização de onda de pitch (user vs native)
- [ ] Sistema de badges/conquistas
- [ ] Histórico de progresso de pronúncia
- [ ] Múltiplas vozes de referência (UK, AU, etc.)

---

## 📚 Documentação Adicional

- Backend: `backend/pronunciation/README.md`
- Piper TTS: https://github.com/OHF-Voice/piper1-gpl
- openSMILE: https://www.audeering.com/opensmile/
- API Docs: `http://localhost:8000/docs` (quando backend estiver rodando)
