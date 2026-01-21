# ✅ Solução Completa: Parcela 2 Agora Atualiza Igual à Parcela 1

## 🎯 O Problema Principal

A Parcela 2 **não estava sendo atualizada no banco de dados** mesmo que o Mercado Pago recebesse e confirmasse o pagamento.

### Causas Identificadas:

1. **Fluxo Diferente**: Parcela 1 usava `/v1/payments`, Parcela 2 usava `/checkout/preferences`
2. **Comparações de String Erradas**: Webhook comparava enum com string (`installmentStatus === 'PAID'` ao invés de `InstallmentStatus.PAID`)
3. **Sem Sincronização Manual**: Não havia endpoint para verificar status da Parcela 2 sob demanda
4. **Sem Retry**: Parcela 2 não tinha fallback se houvesse erro

## ✅ Solução Implementada

### 1. **Webhook Atualizado** (`/pages/api/payments/webhook.ts`)

#### ✅ Parcela 1 é paga → Cria Parcela 2 com `/v1/payments`
```typescript
// Quando Parcela 1 chega como PAID:
1. Busca Parcela 2 com dados ATUALIZADOS
2. Cria pagamento no MP usando /v1/payments (MESMO FLUXO DA PARCELA 1)
3. Recebe payment_id, armazena como mpPreferenceId
4. Atualiza Parcela 2 com status PAYMENT_CREATED + QR code
```

#### ✅ Correções de Tipo TypeScript:
```typescript
// ANTES (ERRADO):
installmentStatus === 'PAID'  // String vs Enum
status: 'PAYMENT_CREATED'     // String vs Enum

// DEPOIS (CORRETO):
installmentStatus === InstallmentStatus.PAID     // Enum vs Enum
status: InstallmentStatus.PAYMENT_CREATED        // Enum vs Enum
```

#### ✅ Ambas Parcelas Pagas → Order Confirmada:
```typescript
const allPaid = allInstallments.every(
  (inst) => inst.status === InstallmentStatus.PAID
);

if (allPaid) {
  Order → paymentStatus: 'PAID'
  Order → status: 'CONFIRMED'
}
```

### 2. **Novo Endpoint: `/api/payments/create-second`** 

Permite criar/recuperar a Parcela 2 sob demanda:

```bash
POST /api/payments/create-second
Body: { "orderId": "xyz" }

Response:
{
  installment2: {
    id: "...",
    amount: 50.00,
    mpPreferenceId: "123456", // payment_id do MP
    mpQrCodeBase64: "...",
    status: "PAYMENT_CREATED"
  },
  mp: {
    id: "123456",
    qrBase64: "..."
  }
}
```

**Comportamento:**
- ✅ Valida se Parcela 1 foi paga
- ✅ Se Parcela 2 já existe com QR, retorna dados existentes
- ✅ Se não existe, cria no MP usando `/v1/payments`
- ✅ Persistem idempotencyKey para evitar duplicatas
- ✅ Suporta 3 tentativas com backoff exponencial
- ✅ Fallback mock para desenvolvimento

### 3. **Novo Endpoint: `/api/payments/[id]/pix-status-second`**

Permite sincronizar status da Parcela 2 sob demanda:

```bash
GET /api/payments/{installment2_id}/pix-status-second

Response:
{
  id: "...",
  status: "PAID",
  paidAt: "2026-01-21T...",
  message: "Status atualizado"
}
```

**Comportamento:**
- ✅ Busca status atual no Mercado Pago
- ✅ Se mudou para PAID, atualiza banco
- ✅ Se ambas parcelas PAID, confirma Order
- ✅ Registra histórico em webhookLog
- ✅ Similar ao `/pix-status` da Parcela 1

## 📊 Fluxo Agora Idêntico Para Ambas as Parcelas

```
┌─────────────────────────────────────────────────┐
│ Parcela 1: /v1/payments                        │
│ ├─ POST /v1/payments                           │
│ ├─ Response: payment_id                        │
│ ├─ Salva: mpPreferenceId = payment_id          │
│ ├─ Status: PAYMENT_CREATED                     │
│ └─ Mostrar: QR Code PIX                        │
└─────────────────────────────────────────────────┘
           ↓ (Usuário paga)
┌─────────────────────────────────────────────────┐
│ Webhook recebe payment_id                       │
│ ├─ Encontra Parcela 1 por external_reference   │
│ ├─ Valida status no MP: APPROVED               │
│ ├─ Atualiza Parcela 1: status = PAID           │
│ └─ Cria Parcela 2 (MESMO FLUXO)               │
└─────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────┐
│ Parcela 2: /v1/payments ✅ (ERA /checkout/pref)│
│ ├─ POST /v1/payments                           │
│ ├─ Response: payment_id_2                      │
│ ├─ Salva: mpPreferenceId = payment_id_2        │
│ ├─ Status: PAYMENT_CREATED                     │
│ └─ Mostrar: QR Code PIX                        │
└─────────────────────────────────────────────────┘
           ↓ (Usuário paga)
┌─────────────────────────────────────────────────┐
│ Webhook recebe payment_id_2                     │
│ ├─ Encontra Parcela 2 por external_reference   │
│ ├─ Valida status no MP: APPROVED               │
│ ├─ Atualiza Parcela 2: status = PAID           │
│ ├─ Verifica: ambas PAID?                       │
│ └─ SIM → Order: CONFIRMED ✅                   │
└─────────────────────────────────────────────────┘
```

## 🔧 Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `/pages/api/payments/webhook.ts` | Parcela 2 agora usa `/v1/payments` + enum types corretos + logs melhorados |
| `/pages/api/payments/create-second.ts` | ✨ NOVO - Criar/recuperar Parcela 2 |
| `/pages/api/payments/[id]/pix-status-second.ts` | ✨ NOVO - Sincronizar status Parcela 2 |

## 📝 Resumo das Mudanças

### ❌ ANTES:
- Parcela 2 usava `/checkout/preferences` (preference_id)
- Webhook comparava enum com string
- Sem endpoint para criar Parcela 2 sob demanda
- Sem endpoint para sincronizar Parcela 2

### ✅ DEPOIS:
- Parcela 2 usa `/v1/payments` (payment_id) - IDÊNTICO à Parcela 1
- Webhook usa comparações enum-to-enum
- Novo `/api/payments/create-second` para criar sob demanda
- Novo `/api/payments/[id]/pix-status-second` para sincronizar
- Ambas parcelas seguem exatamente o mesmo fluxo

## 🧪 Como Testar

### Teste 1: Criar Parcela 1
```bash
POST /api/payments/create
Body: { orderId: "123", amount: 100 }
→ QR Code PIX para Parcela 1
```

### Teste 2: Pagar Parcela 1
- Usar QR Code gerado
- MP envia webhook
- Webhook atualiza Parcela 1 → PAID
- **Webhook cria Parcela 2 automaticamente**

### Teste 3: Verificar Parcela 2 Criada
```bash
GET /api/payments/{installment2_id}/pix-status-second
→ Status: PAYMENT_CREATED
→ QR Code: [novo QR para Parcela 2]
```

### Teste 4: Pagar Parcela 2
- Usar novo QR Code
- MP envia webhook com payment_id_2
- Webhook encontra Parcela 2 (por external_reference)
- Webhook atualiza Parcela 2 → PAID
- **Webhook verifica ambas PAID → Order → CONFIRMED** ✅

## 🚨 Validações Implementadas

✅ Parcela 1 e 2 usam o MESMO endpoint (`/v1/payments`)  
✅ Ambas salvam em `mpPreferenceId` (agora unificado)  
✅ Webhook encontra ambas por `external_reference`  
✅ Status comparado com enum, não string  
✅ paidAt definido apenas quando PAID  
✅ Ambas parcelas PAID → Order CONFIRMED automaticamente  
✅ Fallback para desenvolvimento sem MP  
✅ 3 tentativas com backoff para resiliência  

## 🎯 Resultado Final

**A Parcela 2 agora funciona exatamente igual à Parcela 1:**
- ✅ Criada com mesmo endpoint e mesmo formato
- ✅ Atualizada pelo webhook automaticamente
- ✅ Sincronizável sob demanda
- ✅ Mesmo padrão de tratamento de erro
- ✅ Transações atômicas com ambas parcelas

🎉 **Pronto para produção!**
