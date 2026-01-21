# ✨ ATUALIZAÇÃO: Segunda Parcela Sob Demanda

## Status: ✅ IMPLEMENTADO

---

## 📋 Resumo da Mudança

**Antes:** Parcela 2 era criada automaticamente no Mercado Pago logo após Parcela 1 ser paga.

**Agora:** Cliente clica em botão "🎫 Pagar Agora" na Parcela 2 para gerar o QR code.

---

## 🆕 Novos Componentes

### 1. Endpoint: `/api/payments/generate-installment-qr`
- Gera QR code para parcela específica sob demanda
- Chamado quando cliente clica "Pagar Agora"
- Retorna QR code + código PIX + informações de expiração

### 2. Endpoint: `/api/payments/confirm-payment`
- Verifica se todas as parcelas foram pagas
- Se sim, marca pedido como CONFIRMADO
- Libera para preparação e envio

### 3. Botão na UI: "🎫 Pagar Agora"
- Aparece quando Parcela 2 está em PENDING ou sem QR
- Gera QR code ao clicar
- Mostra loading durante geração

---

## 📱 UX Melhorada

### Parcela 1 (Imediata)
```
Cliente vê QR code pronto
Escaneia / Copia PIX
Paga
```

### Parcela 2 (Sob Demanda) 
```
Cliente vê botão "Pagar Agora"
Clica quando pronto
QR code gerado
Escaneia / Copia PIX
Paga
```

---

## 🔄 Fluxo Completo

```
1. Pedido Criado
   └─ Parcela 1: PENDING
   └─ Parcela 2: PENDING

2. Cliente Paga Parcela 1
   └─ Webhook marca Inst1 → PAID
   └─ Webhook cria Inst2 → PENDING (SEM QR)

3. Cliente Clica "Pagar Agora"
   └─ POST /api/payments/generate-installment-qr
   └─ Gera QR code para Inst2
   └─ UI atualiza com novo QR

4. Cliente Paga Parcela 2
   └─ Webhook marca Inst2 → PAID
   └─ Webhook verifica: ambas PAID?
   └─ SIM → Order → CONFIRMED

5. Pedido Pronto para Entrega
```

---

## 📁 Arquivos Criados/Modificados

✨ **Novos:**
- `/pages/api/payments/generate-installment-qr.ts` (170 linhas)
- `/pages/api/payments/confirm-payment.ts` (80 linhas)
- `/docs/SECOND_INSTALLMENT_ON_DEMAND.md` (documentação)

✏️ **Modificados:**
- `/pages/order-status/[id].tsx`
  - +1 estado: `generatingQrId`
  - +1 função: `generateInstallmentQr()`
  - +1 botão: "🎫 Pagar Agora"

---

## ✅ Validação

- ✅ Sem erros TypeScript
- ✅ Sem erros JavaScript
- ✅ Endpoints funcionando
- ✅ UI responsiva
- ✅ Integrado com webhook existente

---

## 🚀 Como Usar

### Testar Geração de QR (Parcela 2)

```bash
# 1. Criar pedido normal

# 2. Pagar Parcela 1 (webhook test):
curl -X POST http://localhost:3000/api/payments/trigger-webhook-test \
  -H "Content-Type: application/json" \
  -d '{"orderId": "COPIE_ID", "installmentNumber": 1}'

# 3. Ir para /order-status/[id]

# 4. Ver Parcela 2 com botão "Pagar Agora"

# 5. Clicar no botão → QR gerado automaticamente

# 6. Simular pagamento de Parcela 2:
curl -X POST http://localhost:3000/api/payments/trigger-webhook-test \
  -H "Content-Type: application/json" \
  -d '{"orderId": "COPIE_ID", "installmentNumber": 2}'

# 7. Ver ambas pagas + pedido confirmado
```

---

## 🎯 Benefícios

✅ **Melhor UX:** Cliente controla fluxo
✅ **Economia de APIs:** QR gerado apenas quando necessário
✅ **Mais Seguro:** Código PIX próximo do pagamento
✅ **Flexível:** Pode gerar novo QR se expirar
✅ **Conforme Padrão:** Fluxo profissional de parcelamento

---

**Data:** 2024-01-20
**Versão:** 2.0.0
**Status:** ✅ Pronto para Produção
