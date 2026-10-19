@echo off
REM Avvia PocketBase e il server React (Vite) in due finestre separate.
REM Correggi i due percorsi qui sotto con quelli reali sul tuo pc.

set POCKETBASE_DIR=E:\Wargaming-DEV\Warforge-ArmyBuilder\src\pocketBase
set PROJECT_DIR=E:\Wargaming-DEV\Warforge-ArmyBuilder

echo Avvio PocketBase...
start "PocketBase" cmd /k "cd /d %POCKETBASE_DIR% && pocketbase.exe serve"

timeout /t 2 /nobreak >nul

echo Avvio server React (Vite)...
start "React Dev Server" cmd /k "cd /d %PROJECT_DIR% && npm run dev"

echo.
echo Entrambi avviati in finestre separate. Puoi chiudere questa.
