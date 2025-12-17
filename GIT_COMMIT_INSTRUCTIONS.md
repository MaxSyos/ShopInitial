# 📤 Instruções de Git - Commit das Alterações

**Data**: 17 de Dezembro de 2025

---

## 📋 Sumário das Alterações

### Arquivos Criados (1)
```
✨ FrontEnd/utilities/masks.ts
```

### Arquivos Modificados (5)
```
🔄 FrontEnd/prisma/schema.prisma
🔄 FrontEnd/pages/api/auth/update.ts
🔄 FrontEnd/pages/api/auth/me.ts
🔄 FrontEnd/pages/api/auth/register.ts
🔄 FrontEnd/pages/profile.tsx
```

### Documentação Adicionada (4)
```
📄 PROFILE_CPF_WHATSAPP_IMPLEMENTATION.md
📄 PROFILE_CPF_WHATSAPP_VISUAL_SUMMARY.md
📄 PROFILE_CPF_WHATSAPP_TESTING_GUIDE.md
📄 PROFILE_CPF_WHATSAPP_COMPLETION_SUMMARY.md
```

---

## 🚀 Passo a Passo para Commit

### Opção 1: Commit Completo (Recomendado)

```bash
# Navegue até o diretório raiz do projeto
cd /workspaces/ShopInitial

# Verifique o status
git status

# Adicione todas as alterações
git add -A

# Faça o commit
git commit -m "feat: adicionar campos CPF e WhatsApp ao perfil do usuário

- Adicionar campos cpf e whatsapp ao modelo User (schema.prisma)
- Criar utility de máscaras para CPF e WhatsApp (masks.ts)
- Atualizar endpoint PUT /auth/update para aceitar e validar novos campos
- Atualizar endpoint GET /auth/me para retornar novos campos
- Atualizar endpoint POST /auth/register para aceitar novos campos
- Adicionar interface UI na página de perfil com máscaras automáticas
- Implementar validações em tempo real (frontend e backend)
- Adicionar documentação completa

Arquivos alterados:
- FrontEnd/prisma/schema.prisma
- FrontEnd/utilities/masks.ts (novo)
- FrontEnd/pages/api/auth/update.ts
- FrontEnd/pages/api/auth/me.ts
- FrontEnd/pages/api/auth/register.ts
- FrontEnd/pages/profile.tsx"

# Verifique o commit
git log --oneline -1
```

### Opção 2: Commit Separado (Frontend + Docs)

```bash
# Commit das alterações de código
git add FrontEnd/
git commit -m "feat: adicionar CPF e WhatsApp ao perfil

- Schema: adicionar campos cpf e whatsapp
- Utils: criar masks.ts com funções de máscara
- API: validação e armazenamento dos novos campos
- UI: novos campos na página de perfil com máscaras"

# Commit da documentação
git add PROFILE_CPF_*.md
git commit -m "docs: adicionar documentação de CPF e WhatsApp no perfil

- Guia de implementação técnica
- Resumo visual com exemplos
- Guia completo de testes"
```

### Opção 3: Commits Granulares (Mais Detalhado)

```bash
# 1. Schema e Migrations
git add FrontEnd/prisma/
git commit -m "schema: adicionar campos cpf e whatsapp ao User"

# 2. Utilidades
git add FrontEnd/utilities/masks.ts
git commit -m "utils: criar funções de máscara para CPF e WhatsApp"

# 3. API Endpoints
git add FrontEnd/pages/api/auth/
git commit -m "api: suportar CPF e WhatsApp nos endpoints de auth

- update.ts: validação e atualização dos campos
- me.ts: retornar novos campos
- register.ts: aceitar campos no cadastro"

# 4. Frontend
git add FrontEnd/pages/profile.tsx
git commit -m "ui: adicionar campos de CPF e WhatsApp à página de perfil

- Importar funções de máscara
- Adicionar estados para cpf e whatsapp
- Renderizar novos campos com máscaras automáticas
- Validação em tempo real com mensagens de erro"

# 5. Documentação
git add PROFILE_CPF_*.md
git commit -m "docs: documentação completa de CPF e WhatsApp"
```

---

## 📤 Push para o Repositório

Após fazer o commit, envie para o GitHub:

```bash
# Visualizar branches disponíveis
git branch -a

# Fazer push para a branch clothes
git push origin clothes

# Ou, se estiver em outra branch:
git push origin seu_nome_da_branch
```

### Verificar Push

```bash
# Verifique o status
git status

# Deve mostrar: "Your branch is up to date with 'origin/clothes'."

# Verifique o log remoto
git log origin/clothes --oneline -5
```

---

## 🔍 Verificação Pós-Commit

### 1. Verificar Local
```bash
# Confirme que tudo foi commitado
git status
# Resultado esperado: "nothing to commit, working tree clean"

# Visualize os últimos commits
git log --oneline -5
```

### 2. Verificar no GitHub
1. Acesse: https://github.com/ZahraMirzaei/online-shop
2. Verifique a branch `clothes`
3. Procure pelo novo commit
4. Verifique os arquivos alterados
5. Verifique se o PR está atualizado (se aplicável)

---

## 📊 Exemplo de Commit Message Completa

```
feat: adicionar suporte a CPF e WhatsApp no perfil do usuário

DESCRIÇÃO:
Implementação completa de dois novos campos no perfil do usuário com
suporte a máscaras automáticas, validação em tempo real e armazenamento
seguro no banco de dados.

ALTERAÇÕES:
- Schema Prisma: adicionar campos opcionais cpf e whatsapp ao User
- Novo arquivo: utilities/masks.ts com funções de formatação
- API: endpoints /auth/update, /auth/me e /auth/register suportam novos campos
- Frontend: página de perfil com interface para editar CPF e WhatsApp
- Validações: implementadas em frontend (UX) e backend (segurança)

FEATURES:
- Máscara automática: CPF (XXX.XXX.XXX-XX) e WhatsApp ((+55) 11 99999-9999)
- Validação de formato: 11 dígitos para CPF, 11 ou 13 para WhatsApp
- Armazenamento: sem máscara, apenas números
- Compatibilidade: campos opcionais, não quebra dados antigos
- Segurança: validação dupla frontend + backend

TESTES:
- Testes manuais: todas as máscaras funcionando
- Validação: erros exibidos corretamente
- Persistência: dados salvam e carregam corretamente
- API: endpoints retornam dados corretos
- Compatibilidade: usuários antigos continuam funcionando

NOTAS:
- Nenhum erro TypeScript
- Sem quebra de compatibilidade
- Documentação completa gerada
- Pronto para produção
```

---

## ✅ Checklist Pre-Push

Antes de fazer push, verifique:

- [ ] Todos os arquivos foram adicionados com `git add`
- [ ] Commit foi feito com mensagem descritiva
- [ ] `git status` mostra "nothing to commit"
- [ ] `git log` mostra seu novo commit
- [ ] Nenhum erro TypeScript (`npx tsc --noEmit`)
- [ ] `yarn dev` continua funcionando
- [ ] Testou a funcionalidade localmente
- [ ] Rebase com main (se necessário): `git pull origin main`
- [ ] Push bem-sucedido: `git push origin seu_branch`

---

## 🔧 Troubleshooting Git

### Erro: "Your branch and 'origin/clothes' have diverged"
```bash
# Rebase com a branch remota
git rebase origin/clothes

# Ou merge (menos recomendado)
git merge origin/clothes

# Depois faça push
git push origin clothes
```

### Erro: "Permission denied (publickey)"
```bash
# Configure SSH key (uma única vez)
ssh-keygen -t ed25519 -C "seu_email@example.com"

# Adicione a chave ao SSH Agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Teste a conexão
ssh -T git@github.com
```

### Erro: "failed to push some refs"
```bash
# Primeiro, puxe as alterações remotas
git pull origin clothes

# Resolva conflitos (se houver)
# Depois faça o push
git push origin clothes
```

### Desfazer último commit (ainda não fez push)
```bash
# Manter as alterações
git reset --soft HEAD~1

# Ou desfazer tudo
git reset --hard HEAD~1
```

---

## 📚 Comandos Git Úteis

```bash
# Ver status
git status

# Ver commits
git log --oneline -10

# Ver diferenças
git diff

# Ver diferenças antes de commit
git diff --cached

# Adicionar arquivo específico
git add FrontEnd/pages/profile.tsx

# Remover arquivo do staging
git reset FrontEnd/pages/profile.tsx

# Amend do último commit (se ainda não fez push)
git commit --amend -m "nova mensagem"

# Stash (guardar alterações temporariamente)
git stash

# Recuperar stash
git stash pop

# Ver branches
git branch -a

# Criar nova branch
git checkout -b nome_da_nova_branch

# Mudar de branch
git checkout clothes

# Excluir branch local
git branch -d nome_da_branch

# Excluir branch remota
git push origin --delete nome_da_branch
```

---

## 🎯 Resumo Rápido

```bash
# Passo 1: Ver o que mudou
cd /workspaces/ShopInitial
git status

# Passo 2: Adicionar todas as mudanças
git add -A

# Passo 3: Fazer commit
git commit -m "feat: adicionar CPF e WhatsApp ao perfil"

# Passo 4: Fazer push
git push origin clothes

# Passo 5: Verificar no GitHub
# Abra: https://github.com/ZahraMirzaei/online-shop/commits/clothes
```

---

## 📞 Suporte

Se precisar de ajuda com Git:
```bash
# Documentação oficial
git help commit
git help push

# Ver versão do Git
git --version

# Configurar identidade (primeira vez)
git config --global user.name "Seu Nome"
git config --global user.email "seu_email@example.com"
```

---

**Pronto para fazer commit?** 🚀
1. Siga o "Resumo Rápido" acima
2. Verifique no GitHub se tudo está correto
3. Conclua! ✅
