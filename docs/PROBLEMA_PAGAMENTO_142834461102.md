# Investigação: Pagamento 142834461102 não atualizado

## Problema
Pagamento com ID 142834461102 está marcado como pago no Mercado Pago, mas não foi atualizado no banco de dados.

## Possíveis Causas

### 1. **Tipo de ID Incorreto**
- **142834461102** pode ser um `payment_id` (resultado de um pagamento processado)
- O webhook está procurando por `mpPreferenceId` (que é o `preference_id` - usado para gerar QR Code)
- Esses são IDs diferentes no fluxo do Mercado Pago:
  - `preference_id`: Criado ao gerar o QR Code (armazenado em `mpPreferenceId`)
  - `payment_id`: Criado quando o pagamento é processado

### 2. **Webhook não foi chamado**
- Se o webhook nunca foi chamado para este payment_id, o banco não seria atualizado
- O webhook só processa se conseguir encontrar a parcela

### 3. **External Reference incorreta ou não retornada**
- O Mercado Pago pode não estar devolvendo `external_reference` corretamente
- Sem isso, o webhook não consegue achar a parcela

## Solução

### Verificar Primeiro
```bash
# 1. Verificar dados no MP
node scripts/check-mp-payment.js

# 2. Verificar dados no banco
npx ts-node scripts/investigate-payment-142834461102.ts
```

### Corrigir (se necessário)
```bash
# Atualizar manualmente
npx ts-node scripts/fix-payment-142834461102.ts
```

## Melhorias Necessárias no Webhook

O webhook deve ser melhorado para:
1. Também procurar por campos adicionais que o MP retorna
2. Registrar melhor quando não consegue encontrar uma parcela
3. Suportar múltiplos formatos de resposta do MP

## Arquivos relacionados
- `/pages/api/payments/webhook.ts` - Processa webhooks do MP
- `/pages/api/payments/[id]/pix-status.ts` - Verifica status manualmente
- `/scripts/check-mp-payment.js` - Verifica dados no MP
