@echo off
title LinguaFlow - Iniciando Sistema
color 0A

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
    echo Por favor, instale Python 3.11+ antes de continuar.
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
REM 1. INICIAR BACKEND DE PRONUNCIA
REM ========================================
echo [1/2] Iniciando Backend de Pronuncia (Python)...
echo.

cd backend\pronunciation

REM Verificar se venv existe
if not exist venv (
    echo ⚠️  Virtual environment nao encontrado!
    echo Executando setup automatico...
    call setup.bat
    if %errorlevel% neq 0 (
        echo ❌ Falha no setup do backend
        pause
        exit /b 1
    )
)

REM Ativar venv e iniciar backend
start "LinguaFlow Backend" cmd /k "venv\Scripts\activate && echo ✅ Backend iniciado em http://localhost:8000 && uvicorn main_simple:app --host 0.0.0.0 --port 8000 --reload"

echo ✅ Backend iniciado!
echo    URL: http://localhost:8000
echo    Docs: http://localhost:8000/docs
echo.

cd ..\..

REM Aguardar backend inicializar
echo Aguardando backend inicializar (5 segundos)...
timeout /t 5 /nobreak >nul

REM Verificar se backend esta respondendo
echo Verificando saude do backend...
curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend respondendo corretamente!
) else (
    echo ⚠️  Backend pode nao estar pronto ainda...
)
echo.

REM ========================================
REM 2. INICIAR FRONTEND (REACT)
REM ========================================
echo [2/2] Iniciando Frontend (React)...
echo.

REM Verificar se node_modules existe
if not exist node_modules (
    echo ⚠️  Dependencias nao encontradas!
    echo Instalando dependencias do npm...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Falha ao instalar dependencias
        pause
        exit /b 1
    )
)

REM Iniciar frontend
start "LinguaFlow Frontend" cmd /k "echo ✅ Frontend iniciado em http://localhost:5173 && npm run dev"

echo ✅ Frontend iniciado!
echo    URL: http://localhost:5173
echo.

REM Aguardar frontend inicializar
echo Aguardando frontend inicializar (8 segundos)...
timeout /t 8 /nobreak >nul

REM ========================================
REM 3. ABRIR NAVEGADOR
REM ========================================
echo Abrindo navegador...
start http://localhost:5173

echo.
echo ========================================
echo   ✅ LINGUAFLOW INICIADO COM SUCESSO!
echo ========================================
echo.
echo 📡 Servidores ativos:
echo    Backend:  http://localhost:8000
echo    Frontend: http://localhost:5173
echo.
echo 📋 Para testar pronuncia:
echo    1. Clique em "Licoes"
echo    2. Clique em "Pronuncia"
echo    3. Teste as frases!
echo.
echo ⚠️  Para PARAR os servidores:
echo    - Feche as janelas "LinguaFlow Backend" e "LinguaFlow Frontend"
echo    - Ou pressione Ctrl+C em cada janela
echo.
echo 📝 Logs disponiveis em:
echo    - Backend: backend\pronunciation\
echo    - Frontend: Console do navegador
echo.
echo Pressione qualquer tecla para sair deste terminal...
echo (Os servidores continuarao rodando nas outras janelas)
pause >nul
