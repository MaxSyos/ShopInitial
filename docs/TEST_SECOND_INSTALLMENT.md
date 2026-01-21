# 🧪 TESTE PRÁTICO: Segunda Parcela Sob Demanda

## Cenário Completo em 5 Passos

### PASSO 1: Criar Novo Pedido
```
1. Abrir: http://localhost:3000/products
2. Adicionar alguns produtos ao carrinho
3. Ir para checkout
4. Preencher endereço
5. Confirmar pedido
6. Copiar ID do pedido (vai precisar)
```

**Status Esperado:**
- Pedido criado com 2 parcelas
- Ambas em PENDING
- Nenhuma tem QR code ainda

---

### PASSO 2: Ir para Página de Detalhes
```
URL: http://localhost:3000/order-status/[COPIE_ID_AQUI]
```

**O Que Você Vê:**
```
Parcelas PIX

┌─────────────────────────────────────┐
│ Parcela 1/2                  [NÃO INICIADA]
│ Valor: R$ 50,00
│ [🎫 Pagar Agora - Gerar QR Code]
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Parcela 2/2                  [NÃO INICIADA]
│ Valor: R$ 50,00
│ [🎫 Pagar Agora - Gerar QR Code]
└─────────────────────────────────────┘
```

---

### PASSO 3: Gerar QR da Primeira Parcela
```
1. Clicar em "🎫 Pagar Agora" da Parcela 1
2. Aguardar 2-3 segundos (gerando QR...)
3. Ver QR code aparecer com:
   - Imagem do código
   - Código PIX copiável
   - Tempo de expiração (30 minutos)
```

**O Que Acontece:**
```
POST /api/payments/generate-installment-qr
{
  "orderId": "696fdafa47cc7cb99a129f1f",
  "installmentNumber": 1
}
```

**Resultado:**
```
Parcela 1/2                    [AGUARDANDO PAGAMENTO]
Valor: R$ 50,00
Vence em: 15/01/2024 às 11:50:45

[QR Code Image]
00020.1263...... [Clique para Copiar]
```

---

### PASSO 4: Simular Pagamento de Parcela 1
```bash
# Abrir terminal

curl -X POST http://localhost:3000/api/payments/trigger-webhook-test \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "COPIE_O_ID_DO_PEDIDO_AQUI",
    "installmentNumber": 1
  }'
```

**O Que Acontece no Backend:**
1. Marca Parcela 1 como PAID
2. Cria Parcela 2 no Mercado Pago (sem QR)
3. Retorna estado atualizado

**Você Verá no Terminal:**
```json
{
  "success": true,
  "message": "Parcela 1 marked as PAID",
  "order": {
    "id": "...",
    "installments": [
      {"installmentNumber": 1, "status": "PAID"},
      {"installmentNumber": 2, "status": "PENDING"}
    ]
  }
}
```

---

### PASSO 5: Gerar QR da Segunda Parcela
```
1. Fazer Ctrl+R na página /order-status/[id]
   (ou esperar 30s pelo polling automático)

2. Agora verá:
   - Parcela 1: [PAGA] ✓
   - Parcela 2: [NÃO INICIADA] com botão

3. Clicar em "🎫 Pagar Agora" da Parcela 2

4. Aguardar geração (alguns segundos)

5. Ver novo QR code para Parcela 2
```

**O Que Acontece:**
```
POST /api/payments/generate-installment-qr
{
  "orderId": "696fdafa47cc7cb99a129f1f",
  "installmentNumber": 2
}
```

**Resultado na UI:**
```
Parcela 1/2                          [PAGA ✓]
Valor: R$ 50,00
✓ Paga em 15/01/2024 10:30:45

Parcela 2/2                    [AGUARDANDO PAGAMENTO]
Valor: R$ 50,00
Vence em: 15/01/2024 11:50:45

[QR Code Image - NOVO]
00020.1264...... [Clique para Copiar]
```

---

### PASSO BÔNUS: Simular Pagamento de Parcela 2
```bash
curl -X POST http://localhost:3000/api/payments/trigger-webhook-test \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "COPIE_O_ID_AQUI",
    "installmentNumber": 2
  }'
```

**Resultado Final:**
```
Parcela 1/2                          [PAGA ✓]
Valor: R$ 50,00
✓ Paga em 15/01/2024 10:30:45

Parcela 2/2                          [PAGA ✓]
Valor: R$ 50,00
✓ Paga em 15/01/2024 11:30:45

═════════════════════════════════════
Status do Pedido: CONFIRMADO ✅
Pronto para preparação e envio
═════════════════════════════════════
```

---

## 🔍 Verificações Importantes

### Verificar QR Gerado no Banco
```bash
# Abrir MongoDB Compass
# Database: shop
# Collection: PaymentInstallment
# Filtrar por orderId

# Deve ter:
[
  {
    "installmentNumber": 1,
    "status": "PAYMENT_CREATED",
    "mpQrCodeBase64": "iVBORw0KGgo...",
    "mpQrCodeUrl": "00020.1263..."
  },
  {
    "installmentNumber": 2,
    "status": "PENDING",
    "mpQrCodeBase64": null,      // ← Null inicialmente
    "mpQrCodeUrl": null           // ← Null até cliente clicar
  }
]
```

### Verificar Estado da UI
```javascript
// F12 → Console

// Deve existir estado:
generatingQrId // null quando não está gerando

// Ao clicar no botão:
generatingQrId // "inst_id_aqui"

// Após sucesso:
generatingQrId // null novamente

// installments atualizado:
orderData.installments[1].mpQrCodeBase64 // agora tem valor!
```

---

## 🐛 Se Algo Não Funcionar

### Problema: Botão "Pagar Agora" Não Aparece
```
1. Verificar console (F12 → Console)
   Tem erro vermelho?
   
2. Verificar Network:
   GET /api/orders/[id] tem installments?
   
3. Atualizar página: Ctrl+Shift+R
```

### Problema: QR Não Gera ao Clicar
```
1. Verificar console (F12 → Console)
   Qual é o erro?
   
2. Verificar Network:
   POST /api/payments/generate-installment-qr
   Response: 200 ou erro?
   
3. Verificar servidor:
   Está rodando "npm run dev"?
   Tem mensagens de erro?
```

### Problema: Parcela 2 Não Muda para PAID
```
1. Executou webhook de teste?
   curl comando funcionou?
   
2. Fazer Ctrl+Shift+R (hard refresh)
   
3. Verificar banco de dados:
   Parcela 2 status foi atualizado?
   
4. Esperar 30s:
   Polling automático atualiza UI
```

---

## ✅ Checklist de Teste

- [ ] Passo 1: Pedido criado com 2 parcelas
- [ ] Passo 2: Página de detalhes carrega
- [ ] Passo 3: QR da Parcela 1 gerado com sucesso
- [ ] Passo 4: Webhook marca Parcela 1 como PAID
- [ ] Passo 5: Botão "Pagar Agora" aparece para Parcela 2
- [ ] Passo 5: QR da Parcela 2 gerado com sucesso
- [ ] Passo Bônus: Webhook marca Parcela 2 como PAID
- [ ] Passo Bônus: Pedido status → CONFIRMADO
- [ ] Código PIX copia corretamente
- [ ] UI atualiza em tempo real

**Se TODOS marcados:** ✅ Tudo funcionando perfeitamente!

---

## 🎬 Vídeo de Teste (Simulado)

```
0:00 - Cria novo pedido
0:30 - Acessa /order-status/[id]
      Vê ambas as parcelas "Não Iniciadas"

1:00 - Clica "Pagar Agora" na Parcela 1
1:05 - Aguarda geração (vê loading)
1:10 - QR aparece com código PIX
1:15 - Copia código PIX (toast: "Copiado!")

1:20 - Abre terminal
1:25 - Executa curl webhook Parcela 1
1:30 - Verifica resposta no terminal

1:35 - Volta para navegador
1:40 - Faz Ctrl+Shift+R
1:45 - Vê Parcela 1: [PAGA] ✓
1:50 - Vê Parcela 2 com botão "Pagar Agora"

2:00 - Clica "Pagar Agora" na Parcela 2
2:05 - Aguarda geração
2:10 - Novo QR aparece
2:15 - Copia código PIX

2:20 - Abre terminal
2:25 - Executa curl webhook Parcela 2
2:30 - Verifica resposta

2:35 - Volta para navegador
2:40 - Faz Ctrl+Shift+R
2:45 - Vê ambas pagas [PAGA ✓✓]
2:50 - Pedido status: CONFIRMADO

FIM ✅
```

---

**Tempo Total:** ~3 minutos por teste
**Dificuldade:** ⭐ Fácil
**Status:** ✅ Pronto
