@echo off
title LinguaFlow - Anki Import Service
color 0A

setlocal EnableExtensions EnableDelayedExpansion
pushd "%~dp0"

set "SCRIPT_DIR=%~dp0"
set "ANKI_IMPORT_DIR=%SCRIPT_DIR%backend\anki_import"
set "ANKI_IMPORT_HEALTH=http://localhost:8003/health"

echo ========================================
echo   📚 LINGUAFLOW - Anki Import Service
echo ========================================
echo.

echo Verificando se a porta 8003 esta disponivel...
netstat -ano | findstr :8003 >nul
if %errorlevel% equ 0 (
    echo ❌ ERRO: A porta 8003 ja esta em uso!
    echo    Por favor, feche o aplicativo que esta usando a porta 8003.
    pause
    exit /b 1
)

echo ✅ Porta 8003 disponivel
echo.

cd "%ANKI_IMPORT_DIR%"

if not exist "venv\Scripts\activate.bat" (
    echo Criando ambiente virtual...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install --upgrade pip
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate.bat
)

echo Iniciando servidor Anki Import na porta 8003...
start "LinguaFlow Anki Import" cmd /k "cd /d "%ANKI_IMPORT_DIR%" && call venv\Scripts\activate.bat && uvicorn main:app --reload --host 0.0.0.0 --port 8003"

echo Aguardando servidor inicializar (5 segundos)...
timeout /t 5 /nobreak >nul

echo Verificando saude do servidor...
curl -s "%ANKI_IMPORT_HEALTH%" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Anki Import respondendo corretamente!
    echo    Acesse: http://localhost:8003/docs
) else (
    echo ⚠️  Servidor pode nao estar pronto ainda...
    echo    Verifique manualmente em: %ANKI_IMPORT_HEALTH%
)

echo.
echo Pressione qualquer tecla para sair...
pause >nul
exit /b 0
