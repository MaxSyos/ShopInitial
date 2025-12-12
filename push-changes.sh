#!/bin/bash

# Script para fazer commit e push de todas as alterações para o GitHub

cd /workspaces/ShopInitial

echo "📋 Verificando status do git..."
git status --short

echo ""
echo "➕ Adicionando todas as alterações..."
git add -A

echo ""
echo "📝 Status após adicionar..."
git status

echo ""
echo "🔔 Fazendo commit..."
git commit -m "feat: integração CategoryGrid com banco de dados MongoDB

✨ Implementado:
- Hook customizado useCategoryGrid para buscar categorias do MongoDB
- Atualização do componente Category.tsx para usar dados do banco
- Script de seed (seedCategoryGrid.js) com upsert de 7 categorias
- Tratamento de loading e erro no componente
- Transformação correta de dados: styles → campos individuais
- Scripts de execução (Linux/Mac e Windows)

📁 Arquivos criados:
- FrontEnd/hooks/useCategoryGrid.ts (novo hook)
- FrontEnd/prisma/seedCategoryGrid.js (script seed)
- FrontEnd/run-seed.sh (script bash)
- FrontEnd/run-seed.bat (script batch Windows)
- FrontEnd/CATEGORY_DATABASE_INTEGRATION.md
- FrontEnd/SEED_CATEGORYGRID_MAPPING.md
- FrontEnd/SEED_EXECUTION_GUIDE.md

✏️ Arquivos modificados:
- FrontEnd/components/category/Category.tsx
- FrontEnd/mock/category-lg.js

🔄 Fluxo:
MongoDB (seed) → API /api/content/categories → Hook useCategoryGrid → Componente → Tela

7 categorias inseridas com sucesso:
✓ digital (span 3 / span 12)
✓ fashion (span 3 / span 3)
✓ beauty (span 3 / span 3)
✓ sport (span 3 / span 3 - row-reverse)
✓ house (span 3 / span 6)
✓ toy (span 3 / span 6 - column)
✓ stationery (span 6 / span 6 - isCentered)"
- locales/fa.ts"

echo ""
echo "🚀 Fazendo push para o GitHub..."
git push origin monolito

echo ""
echo "✅ Concluído com sucesso!"
git log --oneline -5
