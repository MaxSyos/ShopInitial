#!/bin/bash

# Script para executar o seed de CategoryGrid
# Executa o seed com a variável DATABASE_URL correta do MongoDB

cd "$(dirname "$0")"

echo "🚀 Iniciando seed de CategoryGrid..."
echo ""

node prisma/seedCategoryGrid.js

echo ""
echo "✅ Seed concluído!"
