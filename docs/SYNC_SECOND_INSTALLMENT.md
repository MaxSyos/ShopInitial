# 🔄 Sistema de Sincronização da Parcela 2

## Problema Resolvido

**Antes:** Quando o webhook do Mercado Pago não era disparado, a Parcela 2 não era atualizada no banco de dados, mesmo que o PIX tivesse sido pago.

**Agora:** 3 camadas de sincronização automática garantem que a Parcela 2 seja sempre atualizada:

## ✅ Camadas de Sincronização

### 1️⃣ **Sincronização Automática ao Abrir a Página**
- Sempre que o usuário acessa `/order-status/[id]`, o sistema sincroniza automaticamente
- Verifica o status no Mercado Pago
- Atualiza o banco se necessário
- **Sem ação do usuário!**

### 2️⃣ **Polling Automático (A cada 10 segundos)**
- Enquanto o usuário fica na página, syncroniza a cada 10 segundos
- Detecta pagamentos assim que são processados
- Reduz latência

### 3️⃣ **Sincronização Manual (Botão de Refresh)**
- Botão "⟳ Sincronizar Status" na Parcela 2
- Força uma sincronização imediata se o usuário quiser
- Útil se o status não atualizou automaticamente

---

## 🔌 Endpoints Disponíveis

### POST `/api/payments/sync-second-installment`
Sincroniza a Parcela 2 com Mercado Pago

**Body:**
```json
{
  "orderId": "69710b33c9da0ab746b44321"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sincronização bem-sucedida",
  "orderId": "69710b33c9da0ab746b44321",
  "installmentId": "69710b33c9da0ab746b44323",
  "previousStatus": "PENDING",
  "currentMpStatus": "approved",
  "status": "PAID",
  "paidAt": "2026-01-21T17:58:18.901Z",
  "updated": true,
  "orderUpdated": {
    "status": "CONFIRMED",
    "paymentStatus": "PAID"
  }
}
```

### GET `/api/payments/diagnose-payment?mpPreferenceId=142283786737`
Diagnostica um pagamento específico

**Response:**
```json
{
  "mpPreferenceId": "142283786737",
  "diagnosis": "⚠️ MISMATCH: MP diz APPROVED mas BD diz PENDING → ✅ SINCRONIZADO!",
  "suggestion": "Sincronização automática foi executada com sucesso!",
  "dbStatus": { ... },
  "mpStatus": { ... }
}
```

### GET `/api/orders/diagnose-order?orderId=69710b33c9da0ab746b44321`
Diagnostica uma Order completa e suas parcelas

**Response:**
```json
{
  "orderId": "69710b33c9da0ab746b44321",
  "orderStatus": "CONFIRMED",
  "paymentStatus": "PAID",
  "installments": {
    "parcela1": { status: "PAID", ... },
    "parcela2": { status: "PAID", ... }
  },
  "diagnosis": "✅ TODAS as parcelas PAGAS!",
  "syncResults": "Order atualizada para CONFIRMED"
}
```

---

## 🧪 Como Testar

### Cenário 1: PIX Pago mas Status Desatualizado
1. Realize um PIX para Parcela 2
2. Aguarde 5 minutos (webhook deveria ter sido disparado mas falhou)
3. Atualize a página (`F5`)
4. ✅ A Parcela 2 deve aparecer como PAGA automaticamente

### Cenário 2: Forçar Sincronização Manual
1. Abra a página do pedido
2. Localize a Parcela 2 (se estiver PENDENTE)
3. Clique em "⟳ Sincronizar Status"
4. ✅ Status deve atualizar em segundos

### Cenário 3: Diagnosticar Problema
```bash
# Ver status de um pagamento específico
curl "http://localhost:3000/api/payments/diagnose-payment?mpPreferenceId=142283786737"

# Ver status completo de um pedido
curl "http://localhost:3000/api/orders/diagnose-order?orderId=69710b33c9da0ab746b44321"
```

---

## 🔍 Fluxo Completo

```
Usuário Abre /order-status/[id]
            ↓
    [1] Fetch dados da Order
    [2] Sync Parcela 2 (automático)
            ↓
    Verifica MP:
    - Approved? → Atualiza BD para PAID
    - Pending?  → Deixa como PENDING
    - Failed?   → Atualiza BD para FAILED
            ↓
    Se ambas PAID:
    - Order → CONFIRMED
    - paymentStatus → PAID
            ↓
    [3] A cada 10s:
    - Repete Sync
    - Se mudança detectada → Refrescar UI
            ↓
    Usuário vê status atualizado
```

---

## 📊 Logging

Os endpoints deixam logs detalhados:

```
[Sync Inst2] Sincronizando Parcela 2 para Order: 69710b33c9da0ab746b44321
[Sync Inst2] Parcela 2 encontrada: { status: 'PENDING' }
[Sync Inst2] Consultando MP para mpPreferenceId: 142283786737
[Sync Inst2] MP Response: { status: 'approved', ... }
[Sync Inst2] ✅ MP diz APPROVED! Atualizando para PAID
[Sync Inst2] ✅ Parcela 2 atualizada para: PAID
[Sync Inst2] 🎉 Ambas parcelas PAID! Confirmando Order...
[Sync Inst2] 🎉 Order confirmada!
```

---

## ⚙️ Configuração

Nenhuma configuração necessária! O sistema funciona automaticamente.

Mas você pode:
- **Aumentar/diminuir polling:** Editar intervalo em `order-status/[id].tsx` (linha ~110, `10000` = 10s)
- **Desabilitar auto-sync:** Comentar `syncSecondInstallment()` no useEffect
- **Adicionar logs extras:** Descomentar `console.log` nos endpoints

---

## 🎯 Próximas Melhorias

- [ ] Retry automático com backoff exponencial
- [ ] Notificação push quando Parcela 2 é paga
- [ ] Webhook com retry automático no backend
- [ ] Análise de taxas de falha de webhook
- [ ] Endpoint para sincronizar múltiplas orders

---

## 📞 Suporte

Se a Parcela 2 ainda não atualizar:

1. **Verifique logs:**
   ```bash
   # Ver logs do server
   npm run dev
   ```

2. **Diagnostique:**
   ```bash
   curl "http://localhost:3000/api/orders/diagnose-order?orderId=[seu-order-id]"
   ```

3. **Verifique credenciais:**
   ```bash
   # O token do MP está no .env.local?
   echo $MERCADOPAGO_ACCESS_TOKEN
   ```

4. **Teste o endpoint diretamente:**
   ```bash
   curl -X POST http://localhost:3000/api/payments/sync-second-installment \
     -H "Content-Type: application/json" \
     -d '{"orderId": "seu-order-id"}'
   ```
