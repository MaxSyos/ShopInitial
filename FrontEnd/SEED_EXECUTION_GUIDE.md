# 🚀 Executar Seed de CategoryGrid

## ✅ O Script Foi Corrigido!

O problema anterior era que o `.env` tinha **duas entradas de `DATABASE_URL`** (PostgreSQL e MongoDB). O script agora carrega corretamente a **última entrada** que é o MongoDB.

---

## 📋 Como Executar

### Opção 1: Linux/Mac (Recomendado)

```bash
cd FrontEnd
bash run-seed.sh
```

Ou direto:

```bash
cd FrontEnd
node prisma/seedCategoryGrid.js
```

### Opção 2: Windows

```cmd
cd FrontEnd
run-seed.bat
```

Ou direto:

```cmd
cd FrontEnd
node prisma/seedCategoryGrid.js
```

---

## 🔧 O que o Script Faz

1. ✅ Carrega as variáveis do `.env`
2. ✅ Usa a **última** `DATABASE_URL` (MongoDB)
3. ✅ Faz **upsert** de 7 categorias:
   - digital
   - fashion
   - beauty
   - sport
   - house
   - toy
   - stationery

4. ✅ Mapeia corretamente os campos do schema:
   - `styles.backgroundColor` → `backgroundColor`
   - `styles.flexDirection` → `flexDirection`
   - `styles.paddingBlock` → `paddingBlock`
   - `styles.paddingInline` → `paddingInline`
   - `styles.gridColumn` → `gridColumn`
   - `isCentered` → booleano para "stationery"

---

## 📊 Resultado Esperado

```
✓ DATABASE_URL carregado do .env (MongoDB)

Iniciando seed de CategoryGrid...

✓ Upsert com sucesso: digital (ID: <mongo-id>)
✓ Upsert com sucesso: fashion (ID: <mongo-id>)
✓ Upsert com sucesso: beauty (ID: <mongo-id>)
✓ Upsert com sucesso: sport (ID: <mongo-id>)
✓ Upsert com sucesso: house (ID: <mongo-id>)
✓ Upsert com sucesso: toy (ID: <mongo-id>)
✓ Upsert com sucesso: stationery (ID: <mongo-id>)

✓ Seed finalizado!
```

---

## 🛠️ Troubleshooting

### Erro: "Environment variable not found"
→ Verifique se o arquivo `.env` existe em `FrontEnd/.env`

### Erro: "The URL must start with protocol 'mongo'"
→ O `.env` ainda está usando PostgreSQL. Execute o script novamente — ele agora lê a última `DATABASE_URL` automaticamente.

### Erro: "Cannot connect to MongoDB"
→ Verifique se:
- A URL MongoDB está correta no `.env`
- Sua conexão de internet está ativa
- O MongoDB Atlas está acessível (cheque whitelist de IP)

---

## 📝 Arquivos Criados

- `prisma/seedCategoryGrid.js` - Script principal de seed
- `run-seed.sh` - Shell script para executar (Linux/Mac)
- `run-seed.bat` - Batch script para executar (Windows)
- `SEED_CATEGORYGRID_MAPPING.md` - Documentação de mapeamento

---

## ✨ Próximos Passos

Após executar o seed com sucesso:

1. Verifique os dados no MongoDB Atlas:
   ```bash
   npm run prisma:studio
   ```

2. Confirme que as 7 categorias foram inseridas corretamente na coleção `CategoryGrid`

3. Use a API para listar as categorias:
   ```bash
   curl http://localhost:3000/api/content/categories
   ```

---

**Última atualização:** 12 de dezembro de 2025
