#!/bin/bash
cd /workspaces/ShopInitial
git add -A
git commit -m "feat: adicionar CPF e WhatsApp ao perfil do usuário com máscaras automáticas

- Adicionados campos cpf e whatsapp ao modelo User (schema.prisma)
- Criado utilitário de máscaras (FrontEnd/utilities/masks.ts)
- Atualizado endpoint PUT /auth/update para validar novos campos
- Atualizado endpoint GET /auth/me para retornar novos campos
- Atualizado endpoint POST /auth/register para aceitar novos campos
- Adicionada interface na página de perfil com máscaras automáticas
- Implementadas validações em tempo real (frontend e backend)
- Adicionada documentação completa

Máscaras:
- CPF: XXX.XXX.XXX-XX (11 dígitos)
- WhatsApp: (+55) 11 99999-9999 (11 ou 13 dígitos)"

git push origin clothes
echo "✅ Push realizado com sucesso!"
