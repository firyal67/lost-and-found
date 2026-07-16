@echo off
echo ======================================
echo   Lost^&Found - Demarrage des serveurs
echo ======================================
echo.

:: Verifier si node_modules racine existe
if not exist "node_modules" (
  echo Installation de concurrently...
  call npm install
  echo.
)

echo Lancement du backend  ^(port 5000^) et frontend ^(port 3000^)...
echo Appuie sur Ctrl+C pour tout arreter.
echo.

call npm run dev
