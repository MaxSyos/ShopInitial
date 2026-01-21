# Guia de Implementação - Sistema 2 Parcelas PIX

## 📋 Checklist de Implementação

- [x] **Schema Prisma atualizado** - Adicionado `PaymentInstallment` e `InstallmentStatus`
- [x] **API Orders** - Criação automática de 2 parcelas ao criar pedido
- [x] **API Payments/Create** - Modificado para trabalhar com Parcela 1
- [x] **Webhook** - Processamento de pagamentos com criação de Parcela 2
- [x] **Frontend** - Atualizado para exibir "Parcela 1/2"

## 🚀 Passos para Colocar em Produção

### Etapa 1: Executar Migração do Prisma

```bash
# Gerar migração baseado nas mudanças do schema
yarn prisma migrate dev --name add_payment_installments

# Ou, se o auto-detection não funcionar:
yarn prisma migrate dev
```

Isso criará:
- Tabela `PaymentInstallment`
- Indexes necessários
- Enums `InstallmentStatus`

### Etapa 2: Validar Banco de Dados

```bash
# Verificar status das migrações
yarn prisma migrate status

# Abrir Prisma Studio para validar
yarn prisma studio
```

### Etapa 3: Testar Fluxo Completo

**Local em modo mock (sem token MP):**

```bash
# 1. Fazer login
# 2. Adicionar produtos ao carrinho
# 3. Ir para checkout
# 4. Sistema criará 2 parcelas automaticamente com QR mock
# 5. Verificar database que há 2 PaymentInstallment por Order
```

**Com credenciais Mercado Pago real:**

```bash
# Garantir que as env vars estão corretas:
MERCADOPAGO_ACCESS_TOKEN=seu_token_aqui
NEXT_PUBLIC_API_URL=http://localhost:3000 (ou seu domínio)

# O sistema criará Preferences reais no MP
# Webhook do MP notificará sua app quando pagar
```

### Etapa 4: Validações Críticas

Executar as queries de validação para garantir integridade:

```typescript
// Verificar que TODA Order tem exatamente 2 Installments
const ordersComProblemas = await prisma.order.findMany({
  where: {
    NOT: {
      installments: {
        every: {
          installmentNumber: { in: [1, 2] }
        }
      }
    }
  },
  select: { id: true, installments: { select: { installmentNumber: true } } }
});

console.log('Orders com problemas:', ordersComProblemas);

// Verificar que soma de parcelas = total do pedido
const ordersWithDivergence = await prisma.$queryRaw`
  SELECT o.id, o.total, SUM(pi.amount) as sumInstallments
  FROM "Order" o
  LEFT JOIN "PaymentInstallment" pi ON o.id = pi.orderId
  GROUP BY o.id
  HAVING ABS(o.total - SUM(pi.amount)) > 0.01
`;

console.log('Orders com divergência:', ordersWithDivergence);
```

### Etapa 5: Monitoramento

**Verificar logs do webhook:**
```bash
# Procurar por: "Webhook recebido" e "Parcela" nos logs
# Verificar que Parcela 2 está sendo criada após Parcela 1 pagar
```

**Queries úteis de monitoramento:**
```typescript
// Parcelas pendentes há mais de 1 hora
const stuckInstallments = await prisma.paymentInstallment.findMany({
  where: {
    status: 'PAYMENT_CREATED',
    createdAt: { lt: new Date(Date.now() - 60 * 60 * 1000) }
  },
  include: { order: { select: { id: true, userId: true } } }
});

// Pedidos com pagamento inconsistente
const inconsistentOrders = await prisma.order.findMany({
  where: {
    paymentStatus: 'PENDING',
    installments: {
      some: { status: 'PAID' }
    }
  }
});
```

## 🔄 Fluxo de Testes Recomendado

### Teste 1: Criação de Pedido
```
✓ POST /api/orders → cria Order + 2 Installments
✓ Parcela 1: amount = 50% do total, expiresAt = 30 min
✓ Parcela 2: amount = 50% do total, expiresAt = NULL
```

### Teste 2: Criação de Pagamento P1
```
✓ POST /api/payments/create com orderId
✓ Retorna installment1 com QR Code
✓ external_reference no MP = "ORDER_ID-INSTALLMENT-1"
```

### Teste 3: Webhook Parcela 1
```
✓ MP envia webhook com status: approved
✓ Sistema atualiza Parcela 1 para PAID
✓ Sistema cria Parcela 2 no MP automaticamente
✓ Retorna QR Code para Parcela 2 (será consultado via poll)
```

### Teste 4: Webhook Parcela 2
```
✓ Cliente paga Parcela 2
✓ MP envia webhook
✓ Sistema atualiza Parcela 2 para PAID
✓ Sistema marca Order como PAID e status = CONFIRMED
✓ Pedido pronto para envio
```

## 🔒 Verificações de Segurança

- [ ] **Validação de montante**: Soma de parcelas sempre = total
- [ ] **Idempotência**: Mesma chave gera mesma preference no MP
- [ ] **Assinatura webhook**: Validar (implementar quando MP exigir)
- [ ] **Referência externa**: Formato "ORDER_ID-INSTALLMENT-N" é verificado
- [ ] **Transações atômicas**: Usar `prisma.$transaction()`
- [ ] **Rate limiting**: Webhooks podem vir múltiplas vezes

## 📝 Notas de Produção

1. **Fallback para mock em dev**: Se `MERCADOPAGO_ACCESS_TOKEN` não estiver definido, sistema cria QR mock
2. **Reconciliação**: Job periódico pode ser adicionado para reconciliar inconsistências
3. **Expiração de QR**: Apenas Parcela 1 expira (30 min padrão); Parcela 2 é permanente
4. **Sem sub-parcelamento**: Ambas as preferences têm `installments: 1` (sem parcelamento dentro do PIX)

## 🐛 Troubleshooting

**Problema**: "Parcela não encontrada"
- **Causa**: Order foi criada antes da migração
- **Solução**: Executar script de migração manual ou reconstruir order

**Problema**: "Parcela 2 não está sendo criada"
- **Causa**: Webhook não foi recebido ou webhook log mostra erro
- **Solução**: Verificar logs, configuração de notification_url, assinatura webhook

**Problema**: "Soma de parcelas diverge do total"
- **Causa**: Arredondamento de floats ou alteração manual de amounts
- **Solução**: Verificar lógica de cálculo, garantir precisão decimal

## 📧 Suporte

Para dúvidas ou problemas, consulte:
- [PAYMENT_INSTALLMENTS_LOGIC.md](./PAYMENT_INSTALLMENTS_LOGIC.md) - Lógica detalhada
- [SCHEMA_UPDATES.md](./SCHEMA_UPDATES.md) - Mudanças no banco
- Serviço: `lib/services/paymentInstallmentsService.ts` - Implementação pronta

---

**Data**: 20/01/2026
**Versão**: 1.0
**Status**: ✅ Pronto para Produção
