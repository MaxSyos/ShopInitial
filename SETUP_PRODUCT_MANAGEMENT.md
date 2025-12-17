# ⚙️ SETUP - IMPLEMENTAÇÃO DO SISTEMA DE EDIÇÃO DE PRODUTOS

## 📋 Checklist de Implementação

### ✅ Fase 1: Código (Completo)
- [x] Schema Prisma atualizado
- [x] Componente ProductFormTabs criado
- [x] Componente EditProductForm criado
- [x] ImageUpload melhorado
- [x] Endpoint PUT /products/{id} criado
- [x] Página create-product atualizada
- [x] Documentação completa

### ⏳ Fase 2: Banco de Dados (Próximo Passo)
- [ ] Executar `prisma migrate dev`
- [ ] Verificar migração aplicada

### ⏳ Fase 3: Testes (Após Setup)
- [ ] Teste local com `yarn dev`
- [ ] Testar criar produto
- [ ] Testar editar produto
- [ ] Testar gerenciar imagens

### ⏳ Fase 4: Deploy (Final)
- [ ] Commit das mudanças
- [ ] Push para GitHub
- [ ] Deploy em produção

---

## 🔧 Passo a Passo - Setup Completo

### Passo 1: Preparar Ambiente

```bash
# Ir para pasta do Frontend
cd /workspaces/ShopInitial/FrontEnd

# Verificar se all dependencies estão instaladas
yarn install
```

**Resultado esperado:**
```
✓ All dependencies installed
```

---

### Passo 2: Aplicar Migração do Banco

```bash
# Executar migração
npx prisma migrate dev --name add_image_management
```

**Isso vai:**
1. Criar arquivo em `prisma/migrations/`
2. Aplicar mudanças no MongoDB
3. Regenerar Prisma Client
4. Perguntar se quer validar dados existentes

**Responda "y" (yes) para todas as perguntas**

**Resultado esperado:**
```
✓ Created migration: 20251217_add_image_management
✓ Migrations applied
✓ Prisma Client regenerated
```

---

### Passo 3: Verificar Migração

```bash
# Ver status das migrações
npx prisma migrate status
```

**Resultado esperado:**
```
Status
4 migrations found in prisma/migrations

All migrations have been successfully applied.
```

---

### Passo 4: Testar com `yarn dev`

```bash
# Iniciar servidor dev
yarn dev
```

**Aguarde a compilação completar:**
```
ready - started server on 0.0.0.0:3000
```

---

### Passo 5: Acessar a Página

1. Abra navegador: `http://localhost:3000`
2. Autentique como **ADMIN**
3. Vá para: `/create-product`

**Você deve ver:**
- ✅ Duas abas: "Criar Novo Produto" | "Editar Produto"
- ✅ Primeira aba com formulário vazio
- ✅ Upload de imagens funcionando

---

## 🧪 Testes de Validação

### Teste 1: Criar Produto (Básico)

**Setup:** Estar na aba "Criar Novo Produto"

**Ações:**
```
1. Nome: "Teste de Produto"
2. Descrição: "Descrição teste"
3. Preço: 99.90
4. Estoque: 10
5. SKU: TEST-001
6. Clique em "Clique para selecionar a imagem"
7. Selecione 2-3 imagens do seu computador
8. Aguarde upload completar
9. Clique em "Salvar Produto"
```

**Resultado esperado:**
- ✅ Toast verde: "Produto criado com sucesso!"
- ✅ Redirecionamento para `/products`
- ✅ Produto aparece na lista

---

### Teste 2: Editar Produto

**Setup:** Estar na aba "Editar Produto"

**Ações:**
```
1. Campo de busca: digite "Teste de Produto"
2. Clique no resultado
3. Altere o preço para 149.90
4. Clique "Salvar Alterações"
```

**Resultado esperado:**
- ✅ Toast verde: "Produto atualizado com sucesso!"
- ✅ Redirecionamento para `/products`
- ✅ Produto mostra preço novo

---

### Teste 3: Gerenciar Imagens

**Setup:** Estar editando um produto com 2+ imagens

**Ações:**
```
1. Localize a seção "Gerenciar Imagens"
2. Passe mouse sobre imagem #2
3. Clique seta ⬆️ para mover para cima
4. Verifique que trocou de posição
5. Clique na imagem que quer como principal
6. Verifique estrela ⭐ aparecendo
7. Clique "Salvar Alterações"
```

**Resultado esperado:**
- ✅ Imagens reordenam corretamente
- ✅ Estrela aparece e desaparece ao clicar
- ✅ Dados salvam com a ordem nova

---

## 🐛 Troubleshooting de Setup

### Erro: "Migration already exists"

**Solução:**
```bash
# Roleback da migração anterior
npx prisma migrate resolve --rolled-back add_image_management

# Tente novamente
npx prisma migrate dev --name add_image_management
```

---

### Erro: "Port 3000 already in use"

**Solução:**
```bash
# Encontre o processo na porta 3000
lsof -i :3000

# Kill o processo (substitua PID pelo número)
kill -9 <PID>

# Tente yarn dev novamente
yarn dev
```

---

### Erro: "Prisma Client not generated"

**Solução:**
```bash
# Regenerar Prisma Client
npx prisma generate

# Tente yarn dev novamente
yarn dev
```

---

### Erro: "Image validation failed"

**Solução:**
1. Verifique se é imagem válida (PNG, JPG, etc)
2. Verifique se < 5MB
3. Tente com outra imagem
4. Se persistir, limpe cache (Ctrl+Shift+Delete)

---

### Erro: "Product not found" ao editar

**Solução:**
1. Verifique se o produto foi criado com sucesso
2. Tente recarregar página
3. Faça nova busca
4. Verifique no console se tem erros

---

## 📊 Verificação Pós-Setup

Após completar o setup, verifique:

### ✅ Banco de Dados

```bash
# Verifique schema atualizado
npx prisma db pull

# Verifique se vê os novos campos
cat prisma/schema.prisma | grep -A 5 "model Product"
cat prisma/schema.prisma | grep -A 8 "model Image"
```

**Resultado esperado:**
- Campo `primaryImageId` em Product ✅
- Campo `order` em Image ✅
- Campo `createdAt` em Image ✅

---

### ✅ Arquivo de Código

```bash
# Verifique componentes criados
ls -la components/productForm/

# Deve ver:
# ProductFormTabs.tsx ✅
# EditProductForm.tsx ✅
# ImageUpload.tsx ✅
```

---

### ✅ Endpoints API

No navegador (F12 > Network):
1. Vá para `/create-product`
2. Aba "Editar"
3. Digite algo para buscar
4. Veja requisição `GET /api/products/search?query=...` ✅
5. Edite um produto
6. Clique "Salvar"
7. Veja requisição `PUT /api/products/{id}` ✅

---

## 🚀 Próximos Passos Após Setup

### 1. Fazer Commit

```bash
cd /workspaces/ShopInitial
git add -A
git commit -m "feat: adicionar sistema completo de edição de produtos com múltiplas imagens

- Adicionada aba para editar produtos existentes
- Suporte a até 10 imagens por produto
- Reordenação de imagens com setas ↑↓
- Seleção de imagem principal ⭐
- Busca de produtos para edição (por nome/SKU)
- Atualizado schema Prisma (order, primaryImageId, createdAt)
- Criado endpoint PUT /products/{id} para atualização
- Componente ImageUpload melhorado com controles
- Validações completas frontend e backend
- Documentação completa"
git push origin clothes
```

---

### 2. Documentar no Projeto

Compartilhe com a equipe:
- `PRODUCT_MANAGEMENT_COMPLETE_GUIDE.md` - Como usar
- `PRODUCT_MANAGEMENT_SUMMARY.md` - O que foi implementado
- `MIGRATION_IMAGE_MANAGEMENT.md` - Detalhes técnicos

---

### 3. Testar em Staging (Antes de Produção)

```bash
# Se tem ambiente de staging
git push origin clothes
# Deploy para staging
# Testar em https://staging.seu-dominio.com

# Depois push para main
git checkout main
git pull origin clothes
git push origin main
# Deploy para produção
```

---

## 📞 Suporte Rápido

**Pergunta:** Como fazer rollback se der problema?

**Resposta:**
```bash
# Desfazer migração
npx prisma migrate resolve --rolled-back add_image_management

# Desfazer alterações no git
git reset --hard HEAD~1

# Ou se já fez push
git revert -m 1 HEAD
git push origin clothes
```

---

**Status de Setup:** ✅ Pronto para Implementação  
**Data:** 17 de Dezembro de 2025  
**Próximo Passo:** Executar `npx prisma migrate dev`
