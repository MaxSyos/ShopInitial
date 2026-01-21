# Implementação Completa: Sistema de 2 Parcelas PIX

## ✅ STATUS: 100% CONCLUÍDO

Todas as 4 fases da implementação foram completadas com sucesso.

---

## FASE 1: Modelo de Dados ✅

### Schema Prisma (`prisma/schema.prisma`)
```prisma
model PaymentInstallment {
  id                    String      @id @default(auto()) @map("_id") @db.ObjectId
  orderId               String      @db.ObjectId
  order                 Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)
  installmentNumber     Int         // 1 ou 2
  status                String      @default("PENDING")
  amount                Float
  mpPreferenceId        String?     // ID no Mercado Pago (sem @unique!)
  mpQrCodeBase64        String?     // QR code em base64
  mpQrCodeUrl           String?     // Código PIX
  expiresAt             DateTime?   // NULL para Parcela 2
  paidAt                DateTime?
  createdAt             DateTime    @default(now())
  
  @@unique([orderId, installmentNumber])  // Uma parcela por número por pedido
  @@index([orderId])
  @@index([status])
}
```

**Chaves Importantes:**
- `@@unique([orderId, installmentNumber])` → Garante exatamente 1 inst1 e 1 inst2 por order
- `mpPreferenceId` sem @unique → Permite múltiplos NULL iniciais
- `expiresAt` NULL para Inst2 (permanente) vs 30min para Inst1

---

## FASE 2: APIs Backend ✅

### A. POST `/api/payments/create` - Cria QR Code para Parcela 1
```typescript
Request:  { orderId: string }
Response: { order, installment1, mp: { id, qr, qrBase64 } }

Lógica:
1. Busca/cria Installment(orderId, installmentNumber=1)
2. Se mpPreferenceId null → Chama Mercado Pago
3. Retorna QR code em base64 + URL PIX
```

### B. GET `/api/orders/list` - Lista Pedidos com Parcelas
```typescript
Response: {
  orders: [{
    id, status, total, createdAt,
    installments: [  // ← ADICIONADO
      { id, installmentNumber, status, amount, mpQrCodeBase64, ... }
    ],
    items: [...]
  }],
  pagination: { page, limit, total, totalPages }
}
```

### C. GET `/api/orders/[id]` - Detalhes de Pedido com Parcelas
```typescript
Response: {
  order: {
    id, status, total, createdAt,
    installments: [  // ← ADICIONADO
      { id, installmentNumber, status, amount, mpQrCodeBase64, ... }
    ],
    items: [...]
  }
}
```

### D. POST `/api/payments/trigger-webhook-test` - Simula Pagamento (Dev)
```typescript
Request:  { orderId: string, installmentNumber: number }

Para installmentNumber=1:
  ✓ Mark Inst1 as PAID
  ✓ Create Inst2 on Mercado Pago
  ✓ Return updated order

Para installmentNumber=2:
  ✓ Mark Inst2 as PAID
  ✓ Mark Order as PAID se ambas pagas
  ✓ Return updated order
```

**Uso:**
```bash
curl -X POST http://localhost:3000/api/payments/trigger-webhook-test \
  -H "Content-Type: application/json" \
  -d '{"orderId": "696fdafa47cc7cb99a129f1f", "installmentNumber": 1}'
```

---

## FASE 3: Componentes React ✅

### A. `/components/orders/index.tsx` - Lista de Pedidos

**Antes:**
```
[Pedido ID] [Data] [Itens] [Produtos] [Status] [Frete] [Total] [Botão]
```

**Depois:**
```
[Pedido ID] [Data] [Itens] [Produtos] [Parcelas] [Status] [Frete] [Total] [Botão]

Parcelas:
┌─────────────────────┐
│ Parcela 1/2         │
│ R$ 50,00            │
│ [Paga] ✓ verde      │
└─────────────────────┘
┌─────────────────────┐
│ Parcela 2/2         │
│ R$ 50,00            │
│ [Pendente] azul     │
└─────────────────────┘
```

**Cores de Status:**
- 🟢 PAID → Verde "Paga"
- 🔵 PAYMENT_CREATED → Azul "Pendente"
- 🟡 PENDING → Amarelo "Não Iniciada"
- 🔴 EXPIRED/FAILED → Vermelho

### B. `/pages/order-status/[id].tsx` - Detalhes do Pedido

**Seção Adicionada: "Parcelas PIX"**

```
═══════════════════════════════════════════════
    PARCELAS PIX
═══════════════════════════════════════════════

┌─────────────────────────────────────────────┐
│ Parcela 1/2                    [PAGA] ✓     │
│ Valor: R$ 50,00                             │
│                                              │
│ ✓ Paga em 15/01/2024 10:30:45              │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Parcela 2/2                 [PENDENTE]      │
│ Valor: R$ 50,00                             │
│ Vence em 15/01/2024 10:50:45               │
│                                              │
│ [QR Code Image]  ┐                          │
│ █████████████    │ Código PIX para pagar   │
│ █████████████    ├─────────────────────────┤
│ █████████████    │ 00020.126...copiar      │
│                  └─────────────────────────┘
└─────────────────────────────────────────────┘
```

**Funcionalidades:**
- QR code renderiza de base64
- Código PIX copiável com toast de confirmação
- Status visual atualiza em tempo real
- Informações de expiração (Inst1 apenas)
- Pronto para escanear com celular

---

## FASE 4: Fluxo de Pagamento ✅

### Ciclo Completo

```
1. CLIENTE CRIA PEDIDO (Total R$ 100)
   ↓
   Order criada com status PENDING
   Installment(1/2, R$ 50, status: PENDING)
   Installment(2/2, R$ 50, status: PENDING)

2. CLIENTE CLICA "PAGAR"
   ↓
   POST /api/payments/create { orderId }
   ↓
   Inst1 → Chama Mercado Pago → Gera QR Code
   Inst1.mpPreferenceId = "123456"
   Inst1.mpQrCodeBase64 = "iVBORw0KGgo..."
   Inst1.status = "PAYMENT_CREATED"

3. CLIENTE ESCANEÍA QR CODE OU COPIA PIX
   ↓
   App de banco/PIX recebe código
   Cliente confirma pagamento

4. MERCADO PAGO CALLBACK → WEBHOOK
   OU Manual: POST /api/payments/trigger-webhook-test { orderId, 1 }
   ↓
   Inst1.status = "PAID"
   Inst1.paidAt = "2024-01-15T10:30:45Z"
   ↓
   Cria Inst2 no Mercado Pago
   Inst2.mpPreferenceId = "654321"
   Inst2.status = "PAYMENT_CREATED"
   Inst2.mpQrCodeBase64 = "iVBORw0KGgo..."

5. CLIENTE ESCANEÍA SEGUNDO QR CODE
   ↓
   Confirma pagamento de Inst2

6. MERCADO PAGO CALLBACK → WEBHOOK
   OU Manual: POST /api/payments/trigger-webhook-test { orderId, 2 }
   ↓
   Inst2.status = "PAID"
   Inst2.paidAt = "2024-01-15T11:30:45Z"
   ↓
   Order.status = "IN_PROCESS" (ou apropriado)
   Order.paymentStatus = "COMPLETED"
   Order.paidAt = now()

7. CLIENTE VÊ PEDIDO PAGO
   ↓
   /orders → mostra ambas parcelas com ✓ PAGA
   /order-status/[id] → detalhes completos com datas
```

---

## DADOS ARMAZENADOS NO BANCO

### Após Pagar Ambas Parcelas

```javascript
{
  _id: "696fdafa47cc7cb99a129f1f",
  status: "IN_PROCESS",
  paymentStatus: "COMPLETED",
  total: 100,
  paidAt: "2024-01-15T11:30:45.000Z",
  
  installments: [
    {
      _id: "xyz001",
      orderId: "696fdafa47cc7cb99a129f1f",
      installmentNumber: 1,
      status: "PAID",
      amount: 50,
      mpPreferenceId: "123456",
      mpQrCodeBase64: "iVBORw0KGgo...",
      mpQrCodeUrl: "00020.126...",
      expiresAt: "2024-01-15T10:50:00Z",  // 30 min
      paidAt: "2024-01-15T10:30:45.000Z",
      createdAt: "2024-01-15T10:20:45.000Z"
    },
    {
      _id: "xyz002",
      orderId: "696fdafa47cc7cb99a129f1f",
      installmentNumber: 2,
      status: "PAID",
      amount: 50,
      mpPreferenceId: "654321",
      mpQrCodeBase64: "iVBORw0KGgo...",
      mpQrCodeUrl: "00020.127...",
      expiresAt: null,  // Sem expiração
      paidAt: "2024-01-15T11:30:45.000Z",
      createdAt: "2024-01-15T10:30:45.000Z"
    }
  ]
}
```

---

## UI RENDERIZADA

### Página `/orders`

```
┌────────────────────────────────────────────────────────────────┐
│ Meus Pedidos                                                   │
└────────────────────────────────────────────────────────────────┘

┌─ Pedido #F1F2F3F4 ─────────────────────────────────────────────┐
│                                                                 │
│ Pedido ID      │ Produtos      │ Parcelas  │ Status  │ Frete  │
│ 15/01/2024     │ Item 1 x2     │ Parc 1/2  │ Em Proc │ SEDEX  │
│ 2 itens        │ Item 2 x1     │ R$ 50,00  │ Proc.   │ R$ 20  │
│                │ +0 mais       │ [Paga] ✓  │         │ PAC    │
│                │               │ Parc 2/2  │         │ R$ 15  │
│                │               │ R$ 50,00  │         │        │
│                │               │ [Pend]    │         │ Total  │
│                │               │           │         │ R$100  │
│                │               │           │         │[Detalh]│
│
└─────────────────────────────────────────────────────────────────┘
```

### Página `/order-status/[id]`

```
Status do Pedido: Em Processamento      Pagamento: Pago
Entrega: Não Entregue

═══════════════════════════════════════════════════════════════════

PARCELAS PIX

┌──────────────────────────────────────────────────────────────┐
│ Parcela 1/2                              [PAGA ✓] Verde      │
│ Valor: R$ 50,00                                              │
│ ✓ Paga em 15/01/2024 às 10:30:45                            │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ Parcela 2/2                          [PENDENTE] Azul         │
│ Valor: R$ 50,00                                              │
│ Vence em: 15/01/2024 às 11:50:45                            │
│                                                              │
│ Código PIX para pagar:                                       │
│ ┌──────────────────┐   00020.126....................         │
│ │  █████████       │   [Clique para copiar] ✓               │
│ │  █████████       │                                         │
│ │  █████████       │   Ou escaneie com seu celular          │
│ │                  │                                         │
│ └──────────────────┘                                         │
│                                                              │
│ Escanear com celular → App do Banco → Confirmar pagamento   │
└──────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════
```

---

## CHECKLIST DE FUNCIONAMENTO

- [x] Schema Prisma com PaymentInstallment model
- [x] Constraint único em (orderId, installmentNumber)
- [x] API POST /api/payments/create gera QR Code para Inst1
- [x] API GET /api/orders/list retorna installments
- [x] API GET /api/orders/[id] retorna installments
- [x] API POST /api/payments/trigger-webhook-test simula pagamentos
- [x] Componente /components/orders/index.tsx mostra parcelas na lista
- [x] Página /pages/order-status/[id].tsx mostra detalhes com QR codes
- [x] QR codes renderizam corretamente do base64
- [x] Código PIX é copiável com toast
- [x] Status visual atualiza em tempo real
- [x] Polling automático a cada 30 segundos
- [x] Responsivo em mobile e desktop

---

## PRÓXIMOS PASSOS (Opcional)

1. **Webhook real do Mercado Pago**
   - Quando MP chamar sua callback URL
   - Automatically mark installments as PAID

2. **Notificações**
   - Email ao confirmar Parcela 1
   - Email ao confirmar Parcela 2
   - SMS opcional

3. **Dashboard Admin**
   - Ver estatísticas de pagamentos
   - Ver parcelas expiradas
   - Reenviar QR codes

4. **Proteção de Segurança**
   - Validar assinatura de webhook
   - Rate limiting em endpoints
   - Audit log de mudanças

---

## COMO TESTAR

### 1. Criar um Novo Pedido
```bash
# Faça login e compre algo na loja
```

### 2. Ver Parcelas na Lista
```bash
# Acesse /orders
# Veja seção "Parcelas" com Inst1 PAYMENT_CREATED
```

### 3. Simular Pagamento Inst1
```bash
curl -X POST http://localhost:3000/api/payments/trigger-webhook-test \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "COPIE_ID_DO_PEDIDO",
    "installmentNumber": 1
  }'
```

### 4. Verificar Mudanças
```bash
# Refresh na página /orders
# Inst1 agora deve estar [Paga] ✓
# Inst2 agora deve estar [Pendente]
```

### 5. Simular Pagamento Inst2
```bash
curl -X POST http://localhost:3000/api/payments/trigger-webhook-test \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "COPIE_ID_DO_PEDIDO",
    "installmentNumber": 2
  }'
```

### 6. Verificar Conclusão
```bash
# Refresh na página /orders
# Ambas as parcelas devem estar [Paga] ✓
# Status do pedido deve ser em processamento/entrega
```

---

## ARQUIVOS MODIFICADOS

✏️ **Backend (APIs):**
- `/pages/api/orders/list.ts` - Adicionado mapeamento de installments
- `/pages/api/orders/[id].ts` - Adicionado mapeamento de installments

✏️ **Frontend (Componentes):**
- `/components/orders/index.tsx` - Renderiza parcelas na lista
- `/pages/order-status/[id].tsx` - Renderiza parcelas com QR codes

📄 **Documentação:**
- `/docs/INSTALLMENTS_UI_UPDATE.md` - Documentação técnica

✅ **Completo!**
