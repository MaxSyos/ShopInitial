@echo off
REM Script para executar o seed de CategoryGrid no Windows

cd /d "%~dp0"

echo 🚀 Iniciando seed de CategoryGrid...
echo.

node prisma/seedCategoryGrid.js

echo.
echo ✅ Seed concluído!
pause
