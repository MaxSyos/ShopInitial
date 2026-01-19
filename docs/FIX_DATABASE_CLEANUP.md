# ⚠️ BANCO DE DADOS COM DADOS INVÁLIDOS - Solução

## O Problema

Seu banco de dados tem registros de `ShippingRate` com campos nulos ou inválidos:
- `quantityUpTo: null` (deveria ser um número)
- `weight: null` (deveria ser um número)

Isso acontece porque o schema foi modificado mas os dados antigos não foram limpos.

## ✅ Solução

### Opção 1: Via API (Recomendado)

Faça uma requisição POST para limpar automaticamente:

```bash
curl -X POST http://localhost:3000/api/admin/cleanup-shipping-rates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Resposta esperada:**
```json
{
  "message": "Limpeza concluída com sucesso",
  "countBefore": 2,
  "countAfter": 0,
  "deletedCount": 2,
  "validRates": []
}
```

### Opção 2: Manualmente via MongoDB

1. Abra [MongoDB Atlas](https://cloud.mongodb.com)
2. Navegue até seu cluster
3. Selecione o banco `onlineshop`
4. Selecione a coleção `ShippingRate`
5. Delete todos os documentos (ou apenas os com `quantityUpTo: null`)

### Opção 3: Via Script Node

```bash
cd /workspaces/ShopInitial
node scripts/cleanup-shipping-rates.js
```

## O Que Acontece Após Limpar?

Todos os `ShippingRate` inválidos serão deletados. Você precisará:

1. ✅ Ir para `/manage-shipping-rates` (como ADMIN)
2. ✅ Criar novas faixas de frete
3. ✅ Exemplo:
   - Quantidade Até: 10
   - Altura: 13
   - Largura: 22
   - Comprimento: 30
   - Peso: 1.8
4. ✅ Clicar "Calcular Frete"
5. ✅ Clicar "Criar Tabela de Frete"

## 🔍 Verificar Status

Após limpar, faça a mesma requisição novamente para verificar:

```bash
curl -X POST http://localhost:3000/api/admin/cleanup-shipping-rates \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Você verá `"validRates": []` inicialmente, que é o esperado.

## 📝 Próximos Passos

1. Execute a limpeza (Opção 1, 2 ou 3)
2. Acesse `/manage-shipping-rates`
3. Crie suas faixas de frete novamente
4. Teste em `/orders`

## ⚡ Resumo Rápido

```
❌ ANTES (erro):
  quantityUpTo: null → ❌ ERRO
  weight: null → ❌ ERRO

✅ DEPOIS (após limpeza + criar nova):
  quantityUpTo: 10
  weight: 1.8
  height: 13
  width: 22
  length: 30
  sedexValue: 105.00
  pacValue: 55.00
```

## 🆘 Ainda com Erro?

Se continuar com erro, verifique:
1. ✅ Você limpou todos os registros?
2. ✅ Você criou novas faixas com TODOS os campos preenchidos?
3. ✅ O peso está > 0?
4. ✅ A quantidade até está > 0?

Se o problema persistir, delete MANUALMENTE todos da coleção `ShippingRate` no MongoDB.
