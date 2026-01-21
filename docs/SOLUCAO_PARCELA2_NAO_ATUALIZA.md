# Solução: Parcela 2 Não Se Atualiza

## 🔴 Problema Identificado

A Parcela 2 não estava sendo atualizada quando o Mercado Pago recebia o pagamento e mudava o status da transação.

## 🎯 Causa Raiz

Havia uma **falha crítica na busca da Parcela 2** no webhook:

```
FLUXO CORRETO:
1. Parcela 2 é criada em /checkout/preferences
2. MP retorna: preference_id (ex: 123456789)
3. Sistema salva: mpPreferenceId = preference_id
4. Usuário paga: MP processa pagamento
5. Webhook recebe: payment_id (diferente de preference_id!)
6. Webhook procura por mpPreferenceId === payment_id ❌ NÃO ENCONTRA!
```

### O Problema Específico:
- **Parcela 1**: Criada com `/v1/payments` → `mpPreferenceId` recebe o `payment_id`
- **Parcela 2**: Criada com `/checkout/preferences` → `mpPreferenceId` recebe o `preference_id`
- Webhook recebe um `payment_id` e procura por `mpPreferenceId === payment_id`
- Para Parcela 2: `payment_id` ≠ `preference_id` → **Não encontra**

## ✅ Solução Implementada

### 1. **Melhorado o Webhook com 4 Níveis de Busca**

```typescript
Nível 1: external_reference
         → Formato: ORDER_ID-INSTALLMENT-2
         → Mais confiável, vem do MP
         
Nível 2: mpPreferenceId
         → Procura em todos (changed from findUnique)
         → Funciona para ambas as parcelas
         
Nível 3: webhookLog histórico
         → Procura em registros anteriores
         → Se payment_id já foi registrado
         
Nível 4: external_reference + retry para Parcela 2
         → Fallback especial se é Parcela 2
         → Procura por orderId-2 mesmo sem mpPreferenceId
```

### 2. **Melhorados os Logs do Webhook**

Agora o webhook registra:
- ✅ MP ID recebido
- ✅ Status e status_detail do MP
- ✅ External reference recebida
- ✅ Qual método encontrou a parcela
- ✅ Installment Number (para rastrear qual parcela)

### 3. **Correções de Tipo TypeScript**

- ✅ Importado enum `InstallmentStatus` do Prisma
- ✅ Usando tipo correto: `InstallmentStatus.PAID` ao invés de string `'PAID'`
- ✅ Mudado `findUnique` para `findMany` (mpPreferenceId não é campo único)

## 📊 Fluxo Melhorado

```
Webhook recebe payment_id (142834461102)
        ↓
[1] Tenta: external_reference → ORDER_ID-INSTALLMENT-2 ✅
        ↓
   Se encontrar: atualiza e pronto!
        ↓
   Se não encontrar:
   [2] Tenta: mpPreferenceId === payment_id
   [3] Tenta: webhookLog contém este payment_id
   [4] Tenta: Fallback especial para Parcela 2
```

## 🔧 Arquivo Modificado

**`/pages/api/payments/webhook.ts`**

Mudanças:
- ✅ Adicionado import: `import { InstallmentStatus } from '@prisma/client'`
- ✅ Status agora é enum: `InstallmentStatus.PAID` ao invés de `'PAID'`
- ✅ 4 níveis de busca implementados
- ✅ Logs detalhados com informações de debug
- ✅ `findMany` ao invés de `findUnique` para mpPreferenceId

## 🧪 Como Testar

Quando pagamento de Parcela 2 chegar:
1. Veja os logs: `[Webhook] Tentando localizar por...`
2. Veja qual método encontrou: `✅ Parcela encontrada via...`
3. Veja a atualização: `[Webhook] Atualizando parcela...`
4. Verifique no banco: Parcela 2 deve estar com status `PAID`

## 📝 Arquivos Relacionados

- ✅ `/pages/api/payments/webhook.ts` - Melhorado com 4 níveis de busca
- 📄 `/docs/ANALISE_PROBLEMA_PARCELA2.md` - Análise detalhada
- 📄 `/docs/SOLUCAO_PAGAMENTO_142834461102.md` - Contexto anterior
