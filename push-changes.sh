#!/bin/bash

# Script para fazer commit e push de todas as alterações

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
git commit -m "feat: Sistema de gerenciamento de conteúdo para ADMINs

✨ Implementado:
- Novo módulo de gerenciamento de conteúdo (banners, carousel, ofertas, marcas)
- 3 APIs RESTful seguras com autenticação JWT
- Página admin /manage-content.tsx com 4 abas
- 3 novos modelos Prisma (Banner, CarouselImage, Offer)
- Upload de imagens via ImgBB
- Persistência de URLs no MongoDB
- Link de admin no menu do usuário (visível apenas para ADMIN)
- Suporte a 3 idiomas (PT, EN, FA)
- Interface responsiva e dark mode
- Validações robustas
- Documentação completa

📁 Arquivos criados:
- pages/api/content/banners.ts
- pages/api/content/carousel.ts
- pages/api/content/offers.ts
- pages/manage-content.tsx
- CONTENT_MANAGEMENT_IMPLEMENTATION.md
- CONTENT_MANAGEMENT_SUMMARY.md
- CONTENT_MANAGEMENT_TESTS.md
- PROJECT_COMPLETION_REPORT.md
- FILES_CHECKLIST.md

📝 Arquivos modificados:
- prisma/schema.prisma
- components/header/user/UserAccountBox.tsx
- locales/br.ts
- locales/en.ts
- locales/fa.ts"

echo ""
echo "🚀 Fazendo push para o GitHub..."
git push origin monolito

echo ""
echo "✅ Concluído com sucesso!"
git log --oneline -5
