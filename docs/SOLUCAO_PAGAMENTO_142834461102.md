# Correção: Pagamento 142834461102 Não Atualizado

## Problema Identificado

O pagamento com ID `142834461102` estava marcado como pago no Mercado Pago, mas o status não foi atualizado no banco de dados local.

## Causas Raiz

1. **Falha na localização da parcela**: O webhook estava procurando apenas por:
   - `external_reference` (quando vem na resposta do MP)
   - `mpPreferenceId` (preference ID, não payment ID)

2. **Diferentes tipos de ID no Mercado Pago**:
   - **Preference ID**: Gerado ao criar o código PIX (armazenado em `mpPreferenceId`)
   - **Payment ID**: Gerado quando o pagamento é processado (142834461102)
   - O webhook não estava mapeando payment IDs para parcelas

3. **Webhook Log não consultado**: O histórico de webhooks não era usado para retroativamente localizar pagamentos

## Soluções Implementadas

### 1. **Melhorado o Webhook** (`/pages/api/payments/webhook.ts`)

Agora o webhook tenta localizar a parcela em 3 níveis:

```
Nível 1: external_reference → ORDER_ID-INSTALLMENT-N
         ↓
Nível 2: mpPreferenceId → Procura diretamente
         ↓
Nível 3: webhookLog → Procura em histórico
```

### 2. **Adicionados Logs Detalhados**

O webhook agora registra:
- Qual método foi usado para encontrar a parcela
- Status do MP recebido
- Se a parcela foi encontrada ou não
- Campo `resolved: true` no webhook log

### 3. **Scripts de Investigação e Correção**

Criados 3 scripts auxiliares:

1. **`check-mp-payment.js`** - Verifica dados no Mercado Pago
   ```bash
   node scripts/check-mp-payment.js
   ```

2. **`investigate-payment-142834461102.ts`** - Investiga dados no banco
   ```bash
   npx ts-node scripts/investigate-payment-142834461102.ts
   ```

3. **`fix-payment-142834461102.ts`** - Corrige manualmente (se necessário)
   ```bash
   npx ts-node scripts/fix-payment-142834461102.ts
   ```

## Como Usar

### Para Investigar Este Pagamento:
```bash
# 1. Verificar no MP
node scripts/check-mp-payment.js

# 2. Verificar no banco
npx ts-node scripts/investigate-payment-142834461102.ts
```

### Para Corrigir (se o webhook não processou):
```bash
npx ts-node scripts/fix-payment-142834461102.ts
```

## Próximos Webhooks

Com essa melhoria, futuros webhooks com problemas semelhantes:
- ✅ Tentarão múltiplos métodos de localização
- ✅ Registrarão logs detalhados
- ✅ Não falharão silenciosamente

## Arquivos Modificados

- ✅ `/pages/api/payments/webhook.ts` - Melhorado com 3 níveis de localização + logs
- ✅ `/docs/PROBLEMA_PAGAMENTO_142834461102.md` - Documentação
- ✨ `/scripts/check-mp-payment.js` - Script de verificação (novo)
- ✨ `/scripts/investigate-payment-142834461102.ts` - Script de investigação (novo)
- ✨ `/scripts/fix-payment-142834461102.ts` - Script de correção (novo)

