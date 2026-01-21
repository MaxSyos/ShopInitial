# ✅ Checklist de Testes - Sistema 2 Parcelas PIX

## 📋 Antes de Começar

- [ ] Migração executada: `yarn prisma migrate dev --name add_payment_installments`
- [ ] Banco validado: `yarn prisma migrate status` (tudo "Applied")
- [ ] Credenciais MP configuradas no `.env.local`
- [ ] Servidor rodando: `yarn dev`

---

## 🧪 Testes Banco de Dados

### 1. Verificar Schema Criado
```bash
# No terminal, com banco rodando:
yarn prisma studio
```
- [ ] Tabela `PaymentInstallment` existe
- [ ] Enum `InstallmentStatus` criado
- [ ] Campos: orderId, installmentNumber, amount, status, etc.
- [ ] Índices criados corretamente

### 2. Query Teste - Listar Instalações
```typescript
// Em qualquer endpoint ou console:
const installments = await prisma.paymentInstallment.findMany({
  include: { order: true }
})
console.log(installments)
```
- [ ] Retorna array vazio (sem pedidos ainda)
- [ ] Tipo está correto

### 3. Query Teste - Validar Relacionamento
```typescript
const order = await prisma.order.findUnique({
  where: { id: 'algumOrderId' },
  include: { installments: true }
})
```
- [ ] order.installments é um array
- [ ] Cada item tem os 2 campos obrigatórios

---

## 🎯 Testes API - Criar Pedido

### 4. Criar Pedido (POST /api/orders)
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "items": [{"productId": "...", "quantity": 2, "price": 100}],
    "total": 200,
    "userId": "...",
    "status": "PENDING"
  }'
```

**Validações esperadas:**
- [ ] Status 200 ou 201
- [ ] Resposta contém `id` (Order ID)
- [ ] Response: `{ id, localOrder }`
- [ ] NO 500 error

### 5. Verificar Instalações Criadas
```typescript
const order = await prisma.order.findUnique({
  where: { id: 'ORDER_ID_DO_TESTE_ANTERIOR' },
  include: { installments: true }
})

console.log('Order:', order)
console.log('Installments:', order.installments)
```

**Validações esperadas:**
- [ ] Array com exatamente 2 items
- [ ] installments[0].installmentNumber = 1
- [ ] installments[1].installmentNumber = 2
- [ ] installments[0].amount = total / 2
- [ ] installments[1].amount = total / 2
- [ ] installments[0].status = "PENDING"
- [ ] installments[1].status = "PENDING"
- [ ] installments[0].expiresAt = NOW + 30 min (aprox)
- [ ] installments[1].expiresAt = NULL ✨
- [ ] Ambas têm orderId igual

---

## 💳 Testes API - Gerar Pagamento Parcela 1

### 6. Criar Pagamento Parcela 1 (POST /api/payments/create)
```bash
curl -X POST http://localhost:3000/api/payments/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "orderId": "ORDER_ID_DO_TESTE_5"
  }'
```

**Validações esperadas:**
- [ ] Status 200
- [ ] Response contém `installment1` (não `order.mpPreferenceId`)
- [ ] Response.installment1 tem: `id`, `mpPreferenceId`, `mpQrCodeBase64`, `mpQrCodeUrl`, `status`
- [ ] Response.mp tem: `id`, `qr`, `qrBase64`
- [ ] installment1.status = "PAYMENT_CREATED"
- [ ] installment1.installmentNumber = 1
- [ ] QR Code é válido (começa com "00020126...")

### 7. Verificar no Banco
```typescript
const installment1 = await prisma.paymentInstallment.findFirst({
  where: {
    orderId: 'ORDER_ID_DO_TESTE_5',
    installmentNumber: 1
  }
})

console.log('Installment1:', installment1)
console.log('mpPreferenceId:', installment1.mpPreferenceId)
```

**Validações esperadas:**
- [ ] mpPreferenceId é string (tipo: "123456789")
- [ ] mpQrCodeBase64 começa com "00020126"
- [ ] status = "PAYMENT_CREATED"
- [ ] expiresAt é data válida (entre NOW e NOW + 35 min)

### 8. Verificar Parcela 2 NÃO foi criada no MP
```typescript
const installment2 = await prisma.paymentInstallment.findFirst({
  where: {
    orderId: 'ORDER_ID_DO_TESTE_5',
    installmentNumber: 2
  }
})

console.log('Installment2 mpPreferenceId:', installment2.mpPreferenceId)
```

**Validações esperadas:**
- [ ] installment2.mpPreferenceId = NULL (ainda não foi para MP)
- [ ] installment2.status = "PENDING"
- [ ] installment2.expiresAt = NULL

---

## 🔔 Testes Webhook - Simular Pagamento Parcela 1

### 9. Simular Webhook de Pagamento Parcela 1
```bash
curl -X POST http://localhost:3000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "id": "123456789"
    },
    "type": "payment"
  }'
```

**Após webhook, validar Parcela 1:**
```typescript
const installment1 = await prisma.paymentInstallment.findFirst({
  where: {
    orderId: 'ORDER_ID_DO_TESTE_5',
    installmentNumber: 1
  }
})

console.log('Inst1 status após webhook:', installment1.status)
```

**Validações esperadas:**
- [ ] installment1.status = "PAID"
- [ ] installment1.paidAt é data válida
- [ ] webhookLog não é vazio (tem audit trail)

### 10. Validar Parcela 2 foi criada automaticamente
```typescript
const installment2 = await prisma.paymentInstallment.findFirst({
  where: {
    orderId: 'ORDER_ID_DO_TESTE_5',
    installmentNumber: 2
  }
})

console.log('Inst2 após webhook:', installment2)
console.log('Inst2 mpPreferenceId:', installment2.mpPreferenceId)
console.log('Inst2 status:', installment2.status)
```

**Validações esperadas:**
- [ ] installment2.mpPreferenceId !== NULL ✨ (foi criada no MP!)
- [ ] installment2.status = "PAYMENT_CREATED"
- [ ] installment2.expiresAt = NULL (sem expiração!)
- [ ] installment2.mpQrCodeBase64 é válido

### 11. Validar Order NÃO foi marcada como PAID ainda
```typescript
const order = await prisma.order.findUnique({
  where: { id: 'ORDER_ID_DO_TESTE_5' }
})

console.log('Order paymentStatus:', order.paymentStatus)
console.log('Order status:', order.status)
```

**Validações esperadas:**
- [ ] order.paymentStatus !== "PAID" (ainda esperando Parcela 2)
- [ ] order.status !== "CONFIRMED"

---

## 💳 Testes Webhook - Simular Pagamento Parcela 2

### 12. Simular Webhook de Pagamento Parcela 2
```bash
curl -X POST http://localhost:3000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "id": "987654321"
    },
    "type": "payment"
  }'
```

**Após webhook, validar Parcela 2:**
```typescript
const installment2 = await prisma.paymentInstallment.findFirst({
  where: {
    orderId: 'ORDER_ID_DO_TESTE_5',
    installmentNumber: 2
  }
})

console.log('Inst2 status após webhook:', installment2.status)
```

**Validações esperadas:**
- [ ] installment2.status = "PAID"
- [ ] installment2.paidAt é data válida

### 13. Validar Order foi marcada como PAID
```typescript
const order = await prisma.order.findUnique({
  where: { id: 'ORDER_ID_DO_TESTE_5' }
})

console.log('Order paymentStatus:', order.paymentStatus)
console.log('Order status:', order.status)
```

**Validações esperadas:**
- [ ] order.paymentStatus = "PAID" ✨
- [ ] order.status = "CONFIRMED" ✨

---

## 🎨 Testes Frontend

### 14. Página de Pagamento - Parcela 1
1. Navegue para `/payment` (após criar pedido)
2. Verificar:
   - [ ] Página exibe "Pagamento PIX - Parcela 1/2"
   - [ ] QR Code é exibido
   - [ ] Toast message: "Pagamento PIX (Parcela 1/2) gerado com sucesso!"
   - [ ] Botão "Copiar Código" funciona
   - [ ] Botão "Abrir no App" funciona (MP)

### 15. Página de Pagamento Dinâmica
1. Navegue para `/payment/ORDER_ID_DO_TESTE_5`
2. Verificar:
   - [ ] Mesmo conteúdo da página `/payment`
   - [ ] Sem erros de carregamento

---

## 🚨 Testes de Erro

### 16. Criar Pagamento sem Parcela Pendente
```bash
# Tentar criar pagamento de um pedido que já tem QR
curl -X POST http://localhost:3000/api/payments/create \
  -d '{"orderId": "ORDER_ID_JA_TESTADO"}'
```

**Validações esperadas:**
- [ ] Status 400 (Bad Request) ou 409 (Conflict)
- [ ] Mensagem clara de erro
- [ ] NO 500

### 17. Webhook com external_reference inválido
```bash
curl -X POST http://localhost:3000/api/payments/webhook \
  -d '{
    "data": {
      "id": "999",
      "external_reference": "INVALIDO_XYZ_123"
    }
  }'
```

**Validações esperadas:**
- [ ] Webhook não causa erro (graceful)
- [ ] Log de erro em console
- [ ] NO 500 error

### 18. Webhook para orderId inexistente
```bash
curl -X POST http://localhost:3000/api/payments/webhook \
  -d '{
    "data": {
      "external_reference": "000000000000000000000000-INSTALLMENT-1"
    }
  }'
```

**Validações esperadas:**
- [ ] Webhook gracefully ignora
- [ ] NO crash

---

## 📊 Testes de Dados

### 19. Validar Formato External Reference
```typescript
// Deve sempre ser: ORDEM_ID_HEX-INSTALLMENT-N
const formato = /^([0-9a-f]{24})-INSTALLMENT-([12])$/

// Exemplos válidos:
"507e1f77bcf86cd799439011-INSTALLMENT-1" ✓
"507e1f77bcf86cd799439012-INSTALLMENT-2" ✓

// Exemplos inválidos:
"ORDER-1-PARCELA-1" ✗
"507e1f77bcf86cd799439011" ✗
"507e1f77bcf86cd799439011-INSTALLMENT-3" ✗
```

- [ ] Todos os pedidos criados usam formato correto

### 20. Validar Idempotência
```bash
# Enviar mesmo webhook 2x
curl -X POST http://localhost:3000/api/payments/webhook \
  -d '{"data": {"id": "123456789"}}'

curl -X POST http://localhost:3000/api/payments/webhook \
  -d '{"data": {"id": "123456789"}}'
```

**Validações esperadas:**
- [ ] Ambas as chamadas retornam 200
- [ ] Estado do banco idêntico após ambas
- [ ] NO estado duplicado (ex: 2x PAID)

---

## 📈 Testes de Performance

### 21. Criar 100 Pedidos
```bash
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/orders \
    -d '{"userId": "user1", "total": 100}'
done
```

**Validações esperadas:**
- [ ] Nenhum erro
- [ ] Todos os pedidos criados
- [ ] Banco não está lento

### 22. Validar Índices
```typescript
// Consultas devem ser rápidas mesmo com muitos dados
const installments = await prisma.paymentInstallment.findMany({
  where: { status: 'PAID' },
  orderBy: { createdAt: 'desc' }
})
```

- [ ] Query executada em < 100ms (com índice)

---

## ✅ Checklist Final

- [ ] 20 testes de banco: PASS
- [ ] 3 testes de pagamento API: PASS
- [ ] 5 testes webhook: PASS
- [ ] 2 testes frontend: PASS
- [ ] 4 testes erro: PASS
- [ ] 2 testes dados: PASS
- [ ] 2 testes performance: PASS

**Status Final:**
- [ ] Todos os testes passando
- [ ] Código pronto para PRODUÇÃO
- [ ] Documentação completa
- [ ] Equipe informada

---

## 🆘 Troubleshooting

| Problema | Solução |
|----------|---------|
| Tabela não existe | `yarn prisma migrate dev` |
| External reference não funciona | Validar formato: `ORDER_ID-INSTALLMENT-1` |
| Parcela 2 não é criada | Verificar webhook está sendo chamado |
| Order não marca como PAID | Validar ambas parcelas têm status PAID |
| QR Code inválido | Validar credenciais MP |

---

## 📞 Contato

Dúvidas sobre testes? Consulte:
- [PAYMENT_INSTALLMENTS_LOGIC.md](PAYMENT_INSTALLMENTS_LOGIC.md) - Lógica
- [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) - Deploy
- [README_2_INSTALLMENTS.md](README_2_INSTALLMENTS.md) - Visão geral

