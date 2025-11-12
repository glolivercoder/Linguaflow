@echo off
title LinguaFlow - Iniciando Sistema
color 0A

setlocal EnableExtensions EnableDelayedExpansion
pushd "%~dp0"

set "SCRIPT_DIR=%~dp0"
set "PROXY_DIR=%SCRIPT_DIR%backend\proxy"
set "PROXY_HEALTH=http://localhost:3100/healthz"

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
echo [1/3] Iniciando Proxy de Integracoes (Gemini/Pixabay)...
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
echo [2/3] Iniciando Backend de Pronuncia (Python venv + Piper TTS)...
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
REM 3. INICIAR FRONTEND (REACT)
REM ========================================
echo [3/3] Iniciando Frontend (React)...
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
echo   ✅ LINGUAFLOW INICIADO COM SUCESSO!
echo ========================================
echo.
echo 📡 Servidores ativos:
echo    Backend:  http://localhost:8000
echo    Frontend: http://localhost:3001
echo.
echo 📋 Para testar pronuncia:
echo    1. Clique em "Licoes"
echo    2. Clique em "Pronuncia"
echo    3. Teste as frases!
echo.
echo ⚠️  Para PARAR os servidores:
echo    - Backend: Feche a janela "LinguaFlow Pronunciation API" ou use Ctrl+C
echo    - Frontend: Feche a janela "LinguaFlow Frontend" ou use Ctrl+C
echo.
echo 📝 Logs e informacoes:
echo    - Backend: Janela "LinguaFlow Pronunciation API"
echo    - Frontend: Janela "LinguaFlow Frontend"
echo    - API Docs: http://localhost:8000/docs
echo.
echo 🔧 Troubleshooting:
echo    - Se backend falhar: Execute backend\pronunciation\setup_piper_venv.bat
echo    - Teste backend: backend\pronunciation\test_piper_integration.py
echo    - Documentacao: backend\pronunciation\INICIO_RAPIDO.md
echo.
echo Pressione qualquer tecla para sair deste terminal...
echo (Os servidores continuarao rodando nas outras janelas)
goto CLEANUP_AND_EXIT

:CLEANUP_AND_EXIT
popd
endlocal
pause >nul
