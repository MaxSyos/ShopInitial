#!/bin/bash

# Script para criar a branch 'clothes', commitar alterações locais e dar push
# Execute na raiz do repositório (/workspaces/ShopInitial)

set -e

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_ROOT"

echo "Repo: $REPO_ROOT"

# Verifica se há alterações
CHANGES=$(git status --porcelain)

# Se já existe branch clothes, apenas faz checkout
if git show-ref --verify --quiet refs/heads/clothes; then
  echo "Branch 'clothes' já existe localmente. Fazendo checkout..."
  git checkout clothes
else
  echo "Criando nova branch 'clothes' a partir da branch atual ($(git rev-parse --abbrev-ref HEAD))..."
  git checkout -b clothes
fi

# Adiciona mudanças
if [ -n "$CHANGES" ]; then
  echo "Adicionando alterações..."
  git add -A
  MSG="chore: iniciar branch clothes — atualizações recentes (paginação, dark mode, CategoryGrid)"
  git commit -m "$MSG" || echo "Nada para commitar"
else
  echo "Nenhuma alteração não comitada encontrada."
fi

# Push para remote
echo "Fazendo push para origin/clothes..."
# Define upstream se não existir
git push -u origin clothes

echo "Branch 'clothes' criada/atualizada e push concluído."

echo "Você pode abrir um PR a partir da branch 'clothes' no GitHub."