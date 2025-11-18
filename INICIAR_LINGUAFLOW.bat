@echo off
title LinguaFlow - Iniciando Sistema
color 0A

setlocal EnableExtensions EnableDelayedExpansion
pushd "%~dp0"

set "SCRIPT_DIR=%~dp0"
set "PROXY_DIR=%SCRIPT_DIR%backend\proxy"
set "PROXY_HEALTH=http://localhost:3100/healthz"
set "ARGOS_DIR=%SCRIPT_DIR%backend\anki_import"
set "ARGOS_HEALTH=http://localhost:8100/health"
set "VOSK_DIR=%SCRIPT_DIR%backend\vosk_service"
set "VOSK_HEALTH=http://localhost:8200/health"
set "ANKI_IMPORT_DIR=%SCRIPT_DIR%backend\anki_import"
set "ANKI_IMPORT_HEALTH=http://localhost:8003/health"

echo ========================================
echo   🚀 LINGUAFLOW - Sistema de Ingles
echo ========================================
echo.
echo Iniciando todos os servidores...
echo.

REM Verificar se Python esta instalado
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERRO: Python nao encontrado!
    echo Por favor, instale Python 3.11 ou superior.
    pause
    exit /b 1
)

REM Verificar se Node.js esta instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERRO: Node.js nao encontrado!
    echo Por favor, instale Node.js antes de continuar.
    pause
    exit /b 1
)

echo ✅ Python encontrado
echo ✅ Node.js encontrado
echo.

REM Criar diretorio de logs
if not exist logs mkdir logs

REM ========================================
REM 1. INICIAR PROXY DE INTEGRACOES (NODE)
REM ========================================
echo [1/5] Iniciando Proxy de Integracoes (Gemini/Pixabay)...
echo.

if not exist "%PROXY_DIR%" (
    echo ⚠️  AVISO: Diretório backend\proxy não encontrado.
    echo     Configure o proxy antes de continuar para evitar falhas nas integrações Gemini/Pixabay.
    goto AFTER_PROXY
)

pushd "%PROXY_DIR%"

if not exist node_modules (
    echo Instalando dependencias do proxy...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Falha ao instalar dependencias do proxy
        pause
        popd
        goto CLEANUP_AND_EXIT
    )
)

echo Iniciando servidor proxy...
start "LinguaFlow Proxy" cmd /k "pushd ""%PROXY_DIR%"" && npm run dev"

popd

echo Aguardando proxy inicializar (5 segundos)...
timeout /t 5 /nobreak >nul

echo Verificando saude do proxy...
curl -s "%PROXY_HEALTH%" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Proxy respondendo corretamente!
) else (
    echo ⚠️  Proxy pode nao estar pronto ainda...
    echo    Verifique manualmente em: %PROXY_HEALTH%
)
echo.

:AFTER_PROXY

REM ========================================
REM 2. INICIAR BACKEND DE PRONUNCIA (VENV)
REM ========================================
echo [2/5] Iniciando Backend de Pronuncia (Python venv + Piper TTS)...
echo.

cd backend\pronunciation

REM Verificar se ambiente virtual existe
if not exist venv (
    echo ❌ ERRO: Ambiente virtual nao encontrado!
    echo Execute primeiro: backend\pronunciation\setup_piper_venv.bat
    pause
    cd ..\..
    goto CLEANUP_AND_EXIT
)

REM Garantir diretorios persistentes
if not exist references mkdir references
if not exist temp mkdir temp
if not exist models mkdir models

echo Verificando ambiente virtual...
call venv\Scripts\activate.bat

REM Verificar se piper-tts esta instalado
python -c "import piper" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERRO: Piper TTS nao encontrado no ambiente virtual!
    echo Execute: backend\pronunciation\setup_piper_venv.bat
    pause
    cd ..\..
    goto CLEANUP_AND_EXIT
)

echo ✅ Piper TTS encontrado no venv
echo.

REM Verificar modelos
set MODEL_FOUND=0
if exist "models\*.onnx" set MODEL_FOUND=1
if exist "F:\Projetos2025BKP\PipperTTS\piper\trained_models" set MODEL_FOUND=1

if %MODEL_FOUND%==0 (
    echo ⚠️  AVISO: Nenhum modelo Piper encontrado!
    echo Copie modelos para backend\pronunciation\models
    echo Ou use os do PipperTTS em: F:\Projetos2025BKP\PipperTTS\piper\trained_models
    echo.
)

REM Iniciar servidor FastAPI em nova janela utilizando uvicorn diretamente
echo Iniciando servidor FastAPI...
start "LinguaFlow Pronunciation API" cmd /k "cd /d %CD% && call venv\Scripts\activate && python -m uvicorn main:app --host 0.0.0.0 --port 8000"

cd ..\..

REM Aguardar backend inicializar
echo Aguardando backend inicializar (8 segundos)...
timeout /t 8 /nobreak >nul

REM Verificar se backend esta respondendo
echo Verificando saude do backend...
curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend respondendo corretamente!
) else (
    echo ⚠️  Backend pode nao estar pronto ainda...
    echo    Aguarde mais alguns segundos e verifique: http://localhost:8000/health
)
echo.

REM ========================================
REM 3. INICIAR SERVIÇO DE CONVERSA OFFLINE (VOSK + OPENROUTER)
REM ========================================
echo [3/5] Iniciando Serviço de Conversa Offline (Vosk STT + OpenRouter LLM + Piper TTS)...
echo.

if not exist "%VOSK_DIR%" (
    echo ⚠️  AVISO: Diretório backend\vosk_service não encontrado.
    echo     Verifique se o serviço Vosk foi configurado antes de continuar.
    goto AFTER_VOSK
)

python -c "import vosk" >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Vosk não encontrado no Python atual.
    echo     Execute: python -m pip install -r backend\vosk_service\requirements.txt
)

echo Iniciando serviço Vosk...
start "LinguaFlow Vosk STT" cmd /k "cd /d %SCRIPT_DIR% && python -m uvicorn backend.vosk_service.main:app --host 0.0.0.0 --port 8200"

echo Aguardando Vosk inicializar (6 segundos)...
timeout /t 6 /nobreak >nul

echo Verificando saúde do serviço Vosk...
curl -s "%VOSK_HEALTH%" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Serviço Vosk respondendo corretamente!
) else (
    echo ⚠️  Serviço Vosk pode não estar pronto ainda...
    echo    Verifique manualmente em: %VOSK_HEALTH%
)
echo.

:AFTER_VOSK

REM ========================================
REM 4. INICIAR SERVIÇO ARGOS (TRADUÇÃO OFFLINE)
REM ========================================
echo [4/5] Iniciando Serviço de Tradução Offline (Argos)...
echo.

if not exist "%ARGOS_DIR%" (
    echo ⚠️  AVISO: Diretório backend\anki_import não encontrado.
    echo     Execute o setup antes de continuar para habilitar a traducao offline.
    goto AFTER_ARGOS
)

pushd "%ARGOS_DIR%"

if not exist venv (
    echo ⚠️  AVISO: Ambiente virtual do Argos nao encontrado!
    echo     Crie com: python -m venv backend\anki_import\venv e instale as dependencias.
    popd
    goto AFTER_ARGOS
)

echo Verificando ambiente virtual do Argos...
call venv\Scripts\activate.bat >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Nao foi possivel ativar o venv do Argos.
    popd
    goto AFTER_ARGOS
)

echo Iniciando servidor Argos...
start "LinguaFlow Argos Service" cmd /k "cd /d %CD% && call venv\Scripts\activate && python -m uvicorn main:app --host 0.0.0.0 --port 8100"

popd

echo Aguardando Argos inicializar (6 segundos)...
timeout /t 6 /nobreak >nul

echo Verificando saude do Argos...
curl -s "%ARGOS_HEALTH%" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Argos respondendo corretamente!
) else (
    echo ⚠️  Argos pode nao estar pronto ainda...
    echo    Verifique em: %ARGOS_HEALTH%
)
echo.

:AFTER_ARGOS

REM ========================================
REM 5. INICIAR FRONTEND (REACT)
REM ========================================
echo [5/6] Iniciando Anki Import (Porta 8003)...
echo.

if not exist "%ANKI_IMPORT_DIR%" (
    echo ⚠️  AVISO: Diretório backend\anki_import não encontrado.
    echo     O serviço de importação de baralhos Anki não será iniciado.
    echo     Certifique-se de que o diretório existe e tente novamente.
    goto AFTER_ANKI_IMPORT
)

pushd "%ANKI_IMPORT_DIR%"

echo Verificando se a porta 8003 esta disponivel...
netstat -ano | findstr :8003 >nul
if %errorlevel% equ 0 (
    echo ⚠️  AVISO: A porta 8003 ja esta em uso!
    echo     O serviço de importação de baralhos Anki não será iniciado.
    echo     Verifique se o serviço já está em execução ou feche o aplicativo que está usando a porta 8003.
    popd
    goto AFTER_ANKI_IMPORT
)

echo Iniciando servidor Anki Import...
start "LinguaFlow Anki Import" cmd /k "cd /d "%ANKI_IMPORT_DIR%" && call .\venv\Scripts\activate.bat && uvicorn main:app --reload --host 0.0.0.0 --port 8003"

popd

echo Aguardando servidor Anki Import inicializar (5 segundos)...
timeout /t 5 /nobreak >nul

echo Verificando saude do Anki Import...
curl -s "%ANKI_IMPORT_HEALTH%" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Anki Import respondendo corretamente!
    echo    Acesse: http://localhost:8003/docs
) else (
    echo ⚠️  Anki Import pode nao estar pronto ainda...
    echo    Verifique manualmente em: %ANKI_IMPORT_HEALTH%
)
echo.

:AFTER_ANKI_IMPORT

REM ========================================
REM 6. INICIAR FRONTEND (REACT)
REM ========================================
echo [6/6] Iniciando Frontend (React)...
echo.

REM Verificar se node_modules existe
if not exist node_modules (
    echo ⚠️  Dependencias nao encontradas!
    echo Instalando dependencias do npm...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Falha ao instalar dependencias
        pause
        goto CLEANUP_AND_EXIT
    )
)

REM Iniciar frontend
start "LinguaFlow Frontend" cmd /k "echo ✅ Frontend iniciado em http://localhost:3001 && npm run dev"

echo ✅ Frontend iniciado!
echo    URL: http://localhost:3001
echo.

REM Aguardar frontend inicializar
echo Aguardando frontend inicializar (8 segundos)...
timeout /t 8 /nobreak >nul

REM ========================================
REM 3. ABRIR NAVEGADOR
REM ========================================
echo Abrindo navegador...
start http://localhost:3001

echo.
echo ========================================
echo    LINGUAFLOW INICIADO COM SUCESSO!
echo ========================================
echo.
echo  Servidores ativos:
echo    Pronúncia:       http://localhost:8000
echo    Proxy Gemini:    http://localhost:3100
echo    Vosk STT/LLM:    http://localhost:8200
echo    Argos Translate: http://localhost:8100
echo    Anki Import:     http://localhost:8003
echo    Frontend:        http://localhost:3001
echo.
echo  Para testar pronuncia:
echo    1. Clique em "Licoes"
echo    2. Clique em "Pronuncia"
echo    3. Teste as frases!
echo.
echo  Para PARAR os servidores:
echo    - Pronúncia:      Feche a janela "LinguaFlow Pronunciation API" ou use Ctrl+C
echo    - Vosk STT/LLM:   Feche a janela "LinguaFlow Vosk STT" ou use Ctrl+C
echo    - Argos:          Feche a janela "LinguaFlow Argos Service" ou use Ctrl+C
echo    - Proxy Gemini:   Feche a janela "LinguaFlow Proxy" ou use Ctrl+C
echo    - Anki Import:    Feche a janela "LinguaFlow Anki Import" ou use Ctrl+C
echo    - Frontend:       Feche a janela "LinguaFlow Frontend" ou use Ctrl+C
echo.
echo  Logs e informacoes:
echo    - Backend: Janela "LinguaFlow Pronunciation API"
echo    - Frontend: Janela "LinguaFlow Frontend"
echo    - API Docs: http://localhost:8000/docs
echo    - Anki Import: http://localhost:8003/docs
echo.
echo  Troubleshooting:
echo    - Se backend falhar: Execute backend\pronunciation\setup_piper_venv.bat
echo    - Teste backend: backend\pronunciation\test_piper_integration.py
echo    - Documentacao: backend\pronunciation\INICIO_RAPIDO.md
echo    - Para importar baralhos Anki: Acesse http://localhost:8003/docs
echo.
echo Pressione qualquer tecla para sair deste terminal...
echo (Os servidores continuarao rodando nas outras janelas)
goto CLEANUP_AND_EXIT

:CLEANUP_AND_EXIT
popd
endlocal
pause >nul

