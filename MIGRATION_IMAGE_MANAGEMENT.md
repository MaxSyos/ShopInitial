# Migration para adicionar suporte a múltiplas imagens com ordem e imagem principal

## Mudanças no Schema:

### Model Product
- ✅ Adicionado campo `primaryImageId` (String opcional) - referência à imagem principal

### Model Image
- ✅ Adicionado campo `order` (Int) - para ordenação das imagens
- ✅ Adicionado campo `createdAt` (DateTime) - timestamp de criação
- ✅ Alterado relacionamento para usar `Cascade` em `onDelete` (ao deletar produto, deleta imagens)

## Próximos passos:

1. Execute no FrontEnd:
```bash
cd /workspaces/ShopInitial/FrontEnd
npx prisma migrate dev --name add_image_management
```

2. Isso vai:
   - Criar arquivo de migração em `prisma/migrations/`
   - Aplicar mudanças no banco MongoDB
   - Regenerar Prisma Client

## Validação:

Após executar a migração, verifique se:
- ✅ Campo `primaryImageId` adicionado ao Product
- ✅ Campo `order` adicionado ao Image
- ✅ Campo `createdAt` adicionado ao Image
- ✅ Restrição de exclusão em cascata aplicada

## Rollback (se necessário):

```bash
npx prisma migrate resolve --rolled-back add_image_management
```
