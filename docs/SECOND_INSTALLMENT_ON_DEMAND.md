# 🎯 Novo Fluxo: Segunda Parcela Sob Demanda

## O Que Mudou

Agora quando a primeira parcela é paga, a segunda parcela **não tem QR code pré-gerado**. O cliente clica em "Pagar Agora" para gerar o QR code sob demanda.

---

## Fluxo Completo

### 1. Primeira Parcela (Iniciado Automaticamente)
```
Cliente cria pedido
    ↓
Order criada com 2 Parcelas (ambas PENDING)
    ↓
Cliente clica "Pagar Agora"
    ↓
POST /api/payments/create (para Parcela 1)
    ↓
Parcela 1: QR code gerado → Status: PAYMENT_CREATED
    ↓
Cliente escaneia QR / copia PIX
    ↓
Realiza pagamento
```

### 2. Webhook de Confirmação da Primeira Parcela
```
Mercado Pago chama /api/payments/webhook
    ↓
Verifica external_reference: "ORDER_ID-INSTALLMENT-1"
    ↓
Parcela 1: Status → PAID
    ↓
🆕 Webhook cria Parcela 2 automaticamente (SEM QR)
Parcela 2: Status → PENDING (sem mpQrCodeBase64)
```

### 3️⃣ Segunda Parcela (Sob Demanda)
```
Cliente volta para /order-status/[id]
    ↓
Vê Parcela 1: [Paga] ✓
Vê Parcela 2: [Não Iniciada] com botão "🎫 Pagar Agora"
    ↓
Cliente clica no botão
    ↓
🆕 POST /api/payments/generate-installment-qr
   { orderId, installmentNumber: 2 }
    ↓
API gera QR code para Parcela 2 no Mercado Pago
    ↓
Parcela 2: QR gerado → Status: PAYMENT_CREATED
    ↓
UI atualiza e mostra:
- Novo QR code
- Novo código PIX
- Tempo de expiração
    ↓
Cliente escaneia QR / copia PIX
    ↓
Realiza pagamento
```

### 4. Webhook de Confirmação da Segunda Parcela
```
Mercado Pago chama /api/payments/webhook
    ↓
Verifica external_reference: "ORDER_ID-INSTALLMENT-2"
    ↓
Parcela 2: Status → PAID
    ↓
✅ Webhook verifica ambas as parcelas
    ↓
Se AMBAS PAID:
  - Order.status → CONFIRMED
  - Order.paymentStatus → PAID
  - Pedido liberado para preparação/envio
```

---

## Novos Endpoints

### 1. POST `/api/payments/generate-installment-qr`
Gera QR code para uma parcela específica sob demanda

**Request:**
```json
{
  "orderId": "696fdafa47cc7cb99a129f1f",
  "installmentNumber": 2
}
```

**Response:**
```json
{
  "installment": {
    "id": "inst_001",
    "installmentNumber": 2,
    "status": "PAYMENT_CREATED",
    "amount": 50,
    "mpQrCodeBase64": "iVBORw0KGgo...",
    "mpQrCodeUrl": "00020.126..."
  },
  "mp": {
    "id": "123456",
    "qr": "00020.126...",
    "qrBase64": "iVBORw0KGgo..."
  }
}
```

### 2. POST `/api/payments/confirm-payment`
Verifica e confirma se todas as parcelas foram pagas

**Request:**
```json
{
  "orderId": "696fdafa47cc7cb99a129f1f"
}
```

**Response (Todas Pagas):**
```json
{
  "success": true,
  "message": "Pedido marcado como pago",
  "order": { ... },
  "installments": [...]
}
```

**Response (Ainda Faltam):**
```json
{
  "success": false,
  "message": "Pedido não está completamente pago",
  "pendingInstallments": [
    {
      "installmentNumber": 2,
      "status": "PENDING",
      "amount": 50
    }
  ]
}
```

---

## Arquivos Modificados/Criados

✨ **Novos Endpoints:**
- `/pages/api/payments/generate-installment-qr.ts` - Gera QR sob demanda
- `/pages/api/payments/confirm-payment.ts` - Confirma pagamento completo

✏️ **Modificado:**
- `/pages/order-status/[id].tsx`
  - Adicionado estado `generatingQrId` para loading
  - Adicionada função `generateInstallmentQr()`
  - Adicionado botão "🎫 Pagar Agora" na Parcela 2
  - Atualização automática de UI após gerar QR

---

## Fluxo de UI na Página de Detalhes

### Estado 1: Primeira Parcela Gerada
```
Parcela 1/2                              [PAGA ✓]
Valor: R$ 50,00
✓ Paga em 15/01/2024 10:30:45

Parcela 2/2                           [NÃO INICIADA]
Valor: R$ 50,00
[🎫 Pagar Agora - Gerar QR Code]
Clique para gerar o código PIX desta parcela
```

### Estado 2: Gerando QR da Segunda Parcela (Loading)
```
Parcela 2/2                           [NÃO INICIADA]
Valor: R$ 50,00
[Gerando QR Code...] (desabilitado)
Clique para gerar o código PIX desta parcela
```

### Estado 3: QR Gerado e Pronto para Pagar
```
Parcela 2/2                         [AGUARDANDO PAGAMENTO]
Valor: R$ 50,00
Vence em: 15/01/2024 às 11:50:45

Código PIX para pagar:
[QR Code Image]
00020.127...... [Clique para Copiar] ✓
Ou copie o código PIX

Ou escaneie com seu celular
```

### Estado 4: Ambas Pagas (Após Webhook)
```
Parcela 1/2                              [PAGA ✓]
Valor: R$ 50,00
✓ Paga em 15/01/2024 10:30:45

Parcela 2/2                              [PAGA ✓]
Valor: R$ 50,00
✓ Paga em 15/01/2024 11:30:45

Status do Pedido: CONFIRMADO
Pronto para preparação e envio
```

---

## Como Testar

### Teste 1: Gerar QR para Segunda Parcela
```bash
# 1. Criar novo pedido em /products → /checkout

# 2. Ir para /order-status/[id]

# 3. Ver seção Parcelas:
#    - Parcela 1: [Paga] ✓
#    - Parcela 2: [Não Iniciada]

# 4. Clicar em "🎫 Pagar Agora - Gerar QR Code"

# 5. Aguardar geração (alguns segundos)

# 6. Ver QR code e código PIX aparecerem

# 7. Copiar código PIX e testar
```

### Teste 2: Simular Pagamento Completo
```bash
# 1. Executar webhook para Parcela 1 (se ainda não feito):
curl -X POST http://localhost:3000/api/payments/trigger-webhook-test \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "COPIE_ID_DO_PEDIDO",
    "installmentNumber": 1
  }'

# 2. Ir para /order-status/[id]

# 3. Clicar em "Pagar Agora" para gerar QR da Parcela 2

# 4. Executar webhook para Parcela 2:
curl -X POST http://localhost:3000/api/payments/trigger-webhook-test \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "COPIE_ID_DO_PEDIDO",
    "installmentNumber": 2
  }'

# 5. Fazer Ctrl+R na página

# 6. Ver ambas as parcelas pagas
# 7. Ver pedido em status CONFIRMED
```

---

## Fluxo de Dados Técnico

```
┌─────────────────────────────────────┐
│ Cliente em /order-status/[id]       │
└──────────────┬──────────────────────┘
               │
               ├─→ GET /api/orders/[id]
               │   └─→ Retorna installments array
               │
               └─→ Vê Parcela 2 [NÃO INICIADA]
                   └─→ Clica botão "Pagar Agora"
                       │
                       ├─→ POST /api/payments/generate-installment-qr
                       │   {orderId, installmentNumber: 2}
                       │
                       ├─→ API cria QR no Mercado Pago
                       │
                       ├─→ Salva em DB:
                       │   - mpQrCodeBase64
                       │   - mpQrCodeUrl
                       │   - status: PAYMENT_CREATED
                       │
                       └─→ Response com novo QR
                           │
                           └─→ UI atualiza state
                               └─→ Renderiza novo QR code

                [Cliente escaneia QR e paga]

                Mercado Pago chama webhook
                     │
                     ├─→ POST /api/payments/webhook
                     │   └─→ PaymentInstallment status=PAID
                     │
                     ├─→ Verifica if ambas PAID
                     │
                     └─→ Se sim:
                         └─→ Order.status=CONFIRMED
                            └─→ Polling de 30s atualiza UI
```

---

## Vantagens Deste Fluxo

✅ **Melhor UX:** Cliente controla quando gera QR da Parcela 2
✅ **Economia de APIs:** QR gerado apenas quando necessário
✅ **Melhor Segurança:** Código PIX gerado próximo do pagamento
✅ **Flexibilidade:** Cliente pode gerar novo QR se expirar
✅ **Conformidade:** Segue padrão de pagamento em parcelas

---

## Considerações Importantes

1. **Expiração da Parcela 1:** 30 minutos (configurable)
2. **Expiração da Parcela 2:** Sem expiração (até pagar)
3. **Webhook:** Cria Parcela 2 automaticamente após Parcela 1 paga
4. **Confirmação:** Order só fica CONFIRMED quando AMBAS pagas
5. **Polling:** Atualiza UI a cada 30s (pode ser acelerado)

---

**Status:** ✅ Implementado e Testado
**Versão:** 2.0.0
**Data:** 2024-01-20
