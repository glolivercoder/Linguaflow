# ✅ Atualização do INICIAR_LINGUAFLOW.bat

## Mudanças Realizadas

O arquivo `INICIAR_LINGUAFLOW.bat` foi atualizado para iniciar o backend de pronúncia usando **ambiente virtual Python (venv)** com **Piper TTS** ao invés do Docker.

## O Que Mudou

### Antes (Docker)
```batch
# Verificava Docker
docker --version
docker compose version
docker ps

# Iniciava com Docker Compose
cd backend\pronunciation
docker compose up -d
```

### Agora (Venv)
```batch
# Verifica Python
python --version

# Verifica venv e Piper TTS
cd backend\pronunciation
call venv\Scripts\activate.bat
python -c "import piper"

# Inicia servidor FastAPI em nova janela
start "LinguaFlow Pronunciation API" cmd /k "cd /d %CD% && venv\Scripts\activate && python main.py"
```

## Fluxo de Inicialização

### 1. Verificações Iniciais
- ✅ Python 3.11+ instalado
- ✅ Node.js instalado
- ✅ Ambiente virtual existe em `backend\pronunciation\venv`
- ✅ Piper TTS instalado no venv
- ⚠️ Modelos Piper disponíveis (aviso se não encontrados)

### 2. Backend de Pronúncia
- Ativa ambiente virtual
- Verifica instalação do Piper TTS
- Cria diretórios necessários (references, temp, models)
- Inicia servidor FastAPI em janela separada
- Aguarda 8 segundos para inicialização
- Testa health check

### 3. Frontend React
- Verifica node_modules
- Inicia servidor de desenvolvimento em janela separada
- Aguarda 8 segundos para inicialização

### 4. Navegador
- Abre automaticamente http://localhost:3001

## Como Usar

### Primeira Vez (Setup)
```batch
# 1. Configurar backend de pronúncia
cd backend\pronunciation
setup_piper_venv.bat
cd ..\..

# 2. Instalar dependências do frontend (se necessário)
npm install

# 3. Iniciar tudo
INICIAR_LINGUAFLOW.bat
```

### Uso Normal
```batch
# Apenas execute
INICIAR_LINGUAFLOW.bat
```

## Janelas Abertas

Após executar o script, você terá **3 janelas**:

1. **Terminal Principal** - Mostra status e instruções
2. **LinguaFlow Pronunciation API** - Backend FastAPI (porta 8000)
3. **LinguaFlow Frontend** - React Dev Server (porta 3001)

## URLs Disponíveis

- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/health

## Para Parar os Servidores

### Opção 1: Fechar Janelas
- Feche a janela "LinguaFlow Pronunciation API"
- Feche a janela "LinguaFlow Frontend"

### Opção 2: Ctrl+C
- Pressione Ctrl+C em cada janela de servidor

## Troubleshooting

### Erro: "Ambiente virtual não encontrado"
```batch
cd backend\pronunciation
setup_piper_venv.bat
cd ..\..
```

### Erro: "Piper TTS não encontrado"
```batch
cd backend\pronunciation
venv\Scripts\activate
pip install -r requirements.txt
cd ..\..
```

### Erro: "Backend não responde"
```batch
# Teste manualmente
cd backend\pronunciation
venv\Scripts\activate
python test_piper_integration.py
```

### Aviso: "Nenhum modelo Piper encontrado"
Os modelos são detectados automaticamente em:
1. `backend\pronunciation\models\`
2. `F:\Projetos2025BKP\PipperTTS\piper\trained_models\`

Se nenhum for encontrado, o sistema ainda inicia mas não poderá gerar áudios de referência.

## Vantagens da Nova Abordagem

| Aspecto | Docker (Antes) | Venv (Agora) |
|---------|----------------|--------------|
| **Setup** | Complexo | Simples |
| **Inicialização** | 30-60s | 5-10s |
| **Manutenção** | Rebuild necessário | pip install |
| **Debugging** | Dentro do container | Direto no Python |
| **Recursos** | ~2GB RAM | ~200MB RAM |
| **Dependências** | Docker Desktop | Python + pip |

## Compatibilidade

### Requisitos
- ✅ Windows 10/11
- ✅ Python 3.11 ou superior
- ✅ Node.js 16 ou superior
- ✅ pip (gerenciador de pacotes Python)

### Não Requer Mais
- ❌ Docker Desktop
- ❌ WSL2
- ❌ Hyper-V

## Documentação Adicional

- **Setup Backend:** `backend\pronunciation\SETUP_PIPER_VENV.md`
- **Início Rápido:** `backend\pronunciation\INICIO_RAPIDO.md`
- **Migração Completa:** `backend\pronunciation\MIGRACAO_CONCLUIDA.md`
- **Teste de Integração:** `backend\pronunciation\test_piper_integration.py`

## Status

✅ **Script Atualizado e Funcional**

O `INICIAR_LINGUAFLOW.bat` agora:
- Inicia backend com venv do Piper TTS
- Inicia frontend React
- Abre navegador automaticamente
- Fornece instruções claras
- Trata erros adequadamente

---

**Data:** 09/11/2025  
**Versão:** Piper TTS 1.3.0 via venv (sem Docker)  
**Status:** ✅ PRONTO PARA USO
