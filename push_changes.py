#!/usr/bin/env python3
import subprocess
import os
import sys

# Mudar para o diretório do repositório
os.chdir('/workspaces/ShopInitial')

print("=" * 80)
print("📤 FAZENDO COMMIT E PUSH DAS ALTERAÇÕES")
print("=" * 80)

try:
    # 1. Verificar status
    print("\n📋 Verificando status do git...")
    result = subprocess.run(['git', 'status', '--short'], capture_output=True, text=True)
    print(result.stdout)
    
    # 2. Adicionar arquivos
    print("\n➕ Adicionando todas as alterações...")
    subprocess.run(['git', 'add', '-A'], check=True)
    
    # 3. Fazer commit
    print("📝 Fazendo commit...")
    commit_message = """feat: Sistema de gerenciamento de conteúdo para ADMINs

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

📁 Arquivos criados:
- FrontEnd/pages/api/content/banners.ts
- FrontEnd/pages/api/content/carousel.ts
- FrontEnd/pages/api/content/offers.ts
- FrontEnd/pages/manage-content.tsx
- CONTENT_MANAGEMENT_IMPLEMENTATION.md
- CONTENT_MANAGEMENT_SUMMARY.md
- CONTENT_MANAGEMENT_TESTS.md
- PROJECT_COMPLETION_REPORT.md
- FILES_CHECKLIST.md
- PUSH_INSTRUCTIONS.md

📝 Arquivos modificados:
- FrontEnd/prisma/schema.prisma
- FrontEnd/components/header/user/UserAccountBox.tsx
- FrontEnd/locales/br.ts
- FrontEnd/locales/en.ts
- FrontEnd/locales/fa.ts"""
    
    subprocess.run(['git', 'commit', '-m', commit_message], check=True)
    
    # 4. Fazer push
    print("\n🚀 Fazendo push para o GitHub...")
    subprocess.run(['git', 'push', 'origin', 'monolito'], check=True)
    
    # 5. Verificar log
    print("\n✅ Concluído com sucesso!")
    print("\n📊 Últimos 5 commits:")
    result = subprocess.run(['git', 'log', '--oneline', '-5'], capture_output=True, text=True)
    print(result.stdout)
    
    print("\n" + "=" * 80)
    print("✨ Alterações enviadas para o GitHub!")
    print("=" * 80)

except subprocess.CalledProcessError as e:
    print(f"\n❌ Erro: {e}")
    sys.exit(1)
except Exception as e:
    print(f"\n❌ Erro inesperado: {e}")
    sys.exit(1)
