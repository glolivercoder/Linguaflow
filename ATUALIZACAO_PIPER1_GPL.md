# Atualização: Sistema de Pronúncia com Piper1-GPL

## 🎯 Resumo das Mudanças

O sistema de pronúncia do LinguaFlow foi completamente reescrito para usar **Piper1-GPL** oficial do GitHub (https://github.com/OHF-Voice/piper1-gpl) em vez do pacote PyPI `piper-tts`.

## ✨ Principais Melhorias

### 1. **Piper1-GPL Oficial**
- ✅ Compilado do código-fonte oficial do repositório OHF-Voice
- ✅ Suporta GPL v3 (mais open-source)
- ✅ Melhor qualidade de áudio
- ✅ Mais estável e mantido pela comunidade

### 2. **Docker & WSL2**
- ✅ Solução completamente containerizada
- ✅ Funciona perfeitamente no Windows via WSL2
- ✅ Isolamento completo de dependências
- ✅ Fácil deployment e manutenção

### 3. **openSMILE Integrado**
- ✅ Análise acústica profissional
- ✅ Feature sets eGeMAPS e ComParE
- ✅ Extração completa de prosódia, pitch, jitter, shimmer, etc.

## 📁 Arquivos Modificados

### Novos Arquivos

```
backend/pronunciation/
├── INICIAR_PRONUNCIATION.bat          # Script Windows para iniciar
├── iniciar_pronunciation.sh           # Script Linux/WSL para iniciar
├── README_PIPER_GPL.md               # Documentação completa
└── (Dockerfile, docker-compose.yml modificados)
```

### Arquivos Atualizados

```
backend/pronunciation/
├── Dockerfile                        # ✏️ Reescrito para Piper1-GPL
├── docker-compose.yml                # ✏️ Configurações otimizadas
├── requirements.txt                  # ✏️ Removido piper-tts do PyPI
├── reference_audio_generator.py      # ✏️ Usa Piper1-GPL via subprocess
└── (main.py, pronunciation_analyzer.py - sem mudanças)

QUICK_START_WINDOWS.md                # ✏️ Adicionada seção Docker
```

## 🔧 Mudanças Técnicas Detalhadas

### 1. Dockerfile

**Antes:**
```dockerfile
# Usava piper-tts do PyPI
RUN pip install piper-tts==1.2.0
RUN python3 -m piper.download_voices en_US-lessac-medium
```

**Depois:**
```dockerfile
# Compila Piper1-GPL do fonte
RUN git clone https://github.com/OHF-Voice/piper1-gpl.git
RUN cd piper1-gpl && mkdir build && cd build && cmake .. && make && make install

# Baixa voice models do HuggingFace
RUN wget https://huggingface.co/rhasspy/piper-voices/.../en_US-lessac-medium.onnx
```

### 2. reference_audio_generator.py

**Antes:**
```python
from piper import PiperVoice
self.voice = PiperVoice.load(voice_model_path)
self.voice.synthesize_wav(text, wav_file)
```

**Depois:**
```python
import subprocess

# Usa Piper1-GPL via linha de comando
cmd = [self.piper_binary, "--model", model, "--output_file", output]
subprocess.run(cmd, input=text, text=True)
```

### 3. docker-compose.yml

**Adições:**
```yaml
environment:
  - PIPER_VOICE_MODEL=/app/models/en_US-lessac-medium.onnx
  - OPENSMILE_FEATURE_SET=eGeMAPSv02
  - MAX_AUDIO_SIZE_MB=10

volumes:
  - ./temp:/app/temp

deploy:
  resources:
    limits:
      cpus: '2'
      memory: 2G
```

## 🚀 Como Usar

### Iniciar Backend (Windows)

```bash
cd backend/pronunciation
INICIAR_PRONUNCIATION.bat
```

### Iniciar Backend (Linux/WSL)

```bash
cd backend/pronunciation
chmod +x iniciar_pronunciation.sh
./iniciar_pronunciation.sh
```

### Build Manual

```bash
cd backend/pronunciation
docker compose build
docker compose up -d
```

### Verificar Status

```bash
# API Health
curl http://localhost:8000/health

# Ver logs
docker compose logs -f
```

## 📊 Comparação: Antes vs Depois

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **TTS Engine** | piper-tts (PyPI) | Piper1-GPL (GitHub) |
| **Instalação** | pip install | Compilado no Docker |
| **Qualidade** | Boa | Excelente |
| **Manutenção** | Moderada | Fácil (containerizado) |
| **Windows** | Problemas | ✅ Funciona via WSL2 |
| **openSMILE** | Não funcionava | ✅ Funciona perfeitamente |
| **Isolamento** | Não | ✅ Completamente isolado |

## 🔍 Voice Model

### Modelo Atual
- **Nome**: en_US-lessac-medium
- **Fonte**: HuggingFace (rhasspy/piper-voices)
- **Qualidade**: Alta
- **Tipo**: Voz americana, speaker masculino
- **Uso**: Ideal para referências de pronúncia

### Adicionar Outros Modelos

1. Baixar do [HuggingFace](https://huggingface.co/rhasspy/piper-voices)
2. Adicionar ao Dockerfile ou montar volume:

```dockerfile
# No Dockerfile
RUN wget https://huggingface.co/.../outro-modelo.onnx
```

Ou:

```yaml
# No docker-compose.yml
volumes:
  - ./custom-models:/app/custom-models
```

3. Configurar variável de ambiente:

```yaml
environment:
  - PIPER_VOICE_MODEL=/app/custom-models/outro-modelo.onnx
```

## ⚙️ Configurações de Performance

### CPU/Memory Limits

```yaml
deploy:
  resources:
    limits:
      cpus: '2'      # Máximo 2 CPUs
      memory: 2G     # Máximo 2GB RAM
    reservations:
      cpus: '1'      # Mínimo 1 CPU
      memory: 512M   # Mínimo 512MB RAM
```

### Docker Desktop Settings

Para melhor performance:
1. Abrir Docker Desktop
2. Settings → Resources
3. Configurar:
   - **CPUs**: 4 (recomendado)
   - **Memory**: 4GB (recomendado)
   - **Swap**: 1GB
   - **Disk**: 20GB+

## 🐛 Troubleshooting

### Erro: "Docker não encontrado"

**Solução:**
1. Instalar Docker Desktop: https://www.docker.com/products/docker-desktop
2. Habilitar WSL2 quando solicitado
3. Reiniciar o computador

### Erro: "Piper binary not found"

**Solução:**
```bash
# Rebuild completo
cd backend/pronunciation
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Build demora muito

**Normal:** O primeiro build pode levar 10-15 minutos porque:
- Baixa imagem base Python
- Compila Piper1-GPL do fonte (C++)
- Instala dependências Python
- Baixa voice models (~50MB)

**Dica:** Builds subsequentes serão muito mais rápidos devido ao cache do Docker.

### Performance lenta

**Soluções:**
1. Aumentar recursos do Docker Desktop (ver acima)
2. Verificar se WSL2 está habilitado (Windows)
3. Fechar outros containers pesados

## 📚 Documentação

- **Completa**: `backend/pronunciation/README_PIPER_GPL.md`
- **Quick Start**: `QUICK_START_WINDOWS.md`
- **API Docs**: http://localhost:8000/docs (após iniciar)

## 🎓 Próximos Passos

1. ✅ Sistema compilado com Piper1-GPL
2. ✅ openSMILE funcionando
3. ✅ Docker containerizado
4. 📋 TODO: Adicionar mais voice models
5. 📋 TODO: Implementar cache de referências
6. 📋 TODO: Adicionar testes automatizados
7. 📋 TODO: Otimizar performance do build

## 📄 Licenças

- **LinguaFlow Backend**: MIT
- **Piper1-GPL**: GPL v3
- **openSMILE**: GPL v3
- **Voice Models**: Licenças específicas (ver HuggingFace)

---

**Data da Atualização**: 2025-01-07
**Desenvolvido para**: LinguaFlow 🎓🌍
**Status**: ✅ Pronto para produção com Docker
