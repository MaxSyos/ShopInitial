# Lógica de Pagamento em 2 Parcelas PIX - Mercado Pago

## 📋 Sumário Executivo

Este documento detalha a implementação de um sistema de pagamento em 2 parcelas via PIX integrado ao Mercado Pago, com regras específicas para garantir consistência entre o sistema interno e a plataforma de pagamento.

---

## 🗄️ Estrutura de Dados Proposta

### 1. Análise do Schema Atual

O schema existente já possui campos preparados para parcelas:

```prisma
model Order {
  // ... campos existentes ...
  paymentInstallments        Int           @default(1)
  installment1Status         PaymentStatus @default(PENDING)
  installment1Amount         Float         @default(0)
  installment1PaidAt         DateTime?
  mpPreferenceId             String?
  mpIdempotencyKey           String?
  
  installment2Status         PaymentStatus @default(PENDING)
  installment2Amount         Float         @default(0)
  installment2PaidAt         DateTime?
  mpPreferenceId2            String?
  
  paymentExpiresAt           DateTime?
  paymentExpiresAt2          DateTime?
}
```

### 2. Otimizações Propostas

Recomendo criar uma **tabela separada de parcelas** para melhor rastreabilidade e auditoria:

```prisma
enum InstallmentStatus {
  PENDING          // Aguardando pagamento
  PAYMENT_CREATED  // Pagamento criado no MP, aguardando confirmação
  PAID             // Pagamento confirmado
  FAILED           // Pagamento falhou
  EXPIRED          // QR Code expirou
}

model PaymentInstallment {
  id                String              @id @map("_id") @default(auto()) @db.ObjectId
  orderId           String              @db.ObjectId
  order             Order               @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  // Identificação da parcela
  installmentNumber Int                 // 1 ou 2
  
  // Dados financeiros
  amount            Float               // Valor da parcela
  
  // Integração Mercado Pago
  mpPreferenceId    String?             // ID da preference no MP
  mpIdempotencyKey  String?             // Chave de idempotência
  mpQrCodeBase64    String?             // QR Code em base64
  mpQrCodeUrl       String?             // URL do QR Code
  
  // Status e datas
  status            InstallmentStatus   @default(PENDING)
  createdAt         DateTime            @default(now())
  paidAt            DateTime?           // Data de pagamento confirmado
  expiresAt         DateTime?           // Data de expiração do QR Code
  
  // Auditoria
  webhookLog        Json?               // Log dos webhooks recebidos
  
  @@index([orderId])
  @@index([status])
  @@index([mpPreferenceId])
}

// Modificação na Order
model Order {
  // ... campos existentes ...
  paymentInstallments    Int                 @default(2) // Sistema sempre cria com 2 parcelas
  installments           PaymentInstallment[]
  
  // STATUS GERAL DO PEDIDO BASEADO NAS PARCELAS
  paymentStatus          PaymentStatus       @default(PENDING) // Será PAID apenas quando ambas as parcelas estiverem PAID
}
```

---

## 🔄 Fluxo Passo a Passo

### **FASE 1: CRIAÇÃO DO PEDIDO**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Cliente completa compra e seleciona PIX 2x                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Sistema calcula parcelas:                                 │
│    - Total: R$ 100                                           │
│    - Parcela 1: R$ 50 (50%)                                  │
│    - Parcela 2: R$ 50 (50%)                                  │
│    (ou configurável: 50/50, 40/60, etc)                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Criar registro Order no banco                             │
│    - status: "PENDING"                                       │
│    - paymentStatus: "PENDING"                                │
│    - paymentInstallments: 2                                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Criar 2 registros PaymentInstallment                      │
│    ├─ Parcela 1:                                             │
│    │  - installmentNumber: 1                                 │
│    │  - amount: 50.00                                        │
│    │  - status: PENDING                                      │
│    │  - expiresAt: NOW + 30 minutos (PIX padrão)            │
│    │                                                         │
│    └─ Parcela 2:                                             │
│       - installmentNumber: 2                                 │
│       - amount: 50.00                                        │
│       - status: PENDING                                      │
│       - expiresAt: NULL (sem expiração)                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Criar Preference no Mercado Pago (PARCELA 1 SOMENTE)      │
│    - Gerar POST /checkout/preferences                        │
│    - Payload:                                                │
│      {                                                       │
│        "items": [{                                           │
│          "title": "Pedido #ORDER_ID",                        │
│          "unit_price": 50.00,                                │
│          "quantity": 1                                       │
│        }],                                                   │
│        "payment_methods": {                                  │
│          "excluded_payment_types": [{                        │
│            "id": "ticket"                                    │
│          }],                                                 │
│          "installments": 1,  // SEM parcelamento!            │
│          "default_payment_method_id": "account_money"        │
│        },                                                    │
│        "external_reference": "ORDER_ID-INSTALLMENT-1",       │
│        "notification_url": "/api/webhooks/mercadopago"       │
│      }                                                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Receber resposta do MP com QR Code e Preference ID        │
│    - Armazenar mpPreferenceId (Parcela 1)                    │
│    - Armazenar mpQrCodeBase64                                │
│    - Armazenar mpQrCodeUrl                                   │
│    - Atualizar status: PAYMENT_CREATED                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Retornar ao cliente:                                      │
│    - QR Code da Parcela 1                                    │
│    - Mensagem: "Escaneie o QR Code para pagar a 1ª parcela" │
│    - Redirecionamento para página de confirmação            │
└─────────────────────────────────────────────────────────────┘
```

### **FASE 2: CONFIRMAÇÃO DA PRIMEIRA PARCELA**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Cliente escaneia QR Code e realiza pagamento PIX          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Webhook do Mercado Pago notifica o sistema                │
│    - POST /api/webhooks/mercadopago                          │
│    - Evento: payment.created ou payment.updated              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Sistema identifica:                                       │
│    - mpPreferenceId (vindo no webhook)                       │
│    - Status do pagamento (approved, pending, rejected)       │
│    - ID do pagamento no MP                                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. SUCESSO: Status = "approved"                              │
│    ├─ Atualizar PaymentInstallment (Parcela 1):              │
│    │  - status: PAID                                         │
│    │  - paidAt: NOW                                          │
│    │                                                         │
│    └─ Atualizar Order:                                       │
│       - installment1Status: PAID                             │
│       - installment1PaidAt: NOW                              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Criar Preference no Mercado Pago (PARCELA 2)              │
│    - Gerar POST /checkout/preferences                        │
│    - Payload similar à Parcela 1, MAS:                       │
│      - unit_price: 50.00                                     │
│      - external_reference: "ORDER_ID-INSTALLMENT-2"          │
│      - NO campo expires_in (deixar vazio para sem expiração) │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Armazenar dados da Parcela 2:                             │
│    - mpPreferenceId2                                         │
│    - mpQrCodeBase642                                         │
│    - expiresAt2: NULL (sem expiração)                        │
│    - status: PAYMENT_CREATED                                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Notificar cliente:                                        │
│    - Email: "Primeira parcela confirmada!"                   │
│    - QR Code da 2ª parcela disponível                        │
│    - Pode ser paga a qualquer momento                        │
└─────────────────────────────────────────────────────────────┘
```

### **FASE 3: CONFIRMAÇÃO DA SEGUNDA PARCELA**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Cliente paga a 2ª parcela (tempo indeterminado)           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Webhook do Mercado Pago notifica (payment.updated)        │
│    - external_reference contém "INSTALLMENT-2"               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Atualizar PaymentInstallment (Parcela 2):                 │
│    - status: PAID                                            │
│    - paidAt: NOW                                             │
│                                                              │
│    Atualizar Order:                                          │
│    - installment2Status: PAID                                │
│    - installment2PaidAt: NOW                                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. VALIDAR PAGAMENTO COMPLETO:                               │
│    if (installment1Status === PAID &&                        │
│        installment2Status === PAID)                          │
│    {                                                         │
│      Order.paymentStatus = PAID                              │
│      Order.status = "CONFIRMED"                              │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Notificar cliente:                                        │
│    - Email: "Pedido totalmente pago!"                        │
│    - Status do pedido: CONFIRMADO                            │
│    - Iniciar preparação/envio                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 📐 Regras de Validação

### **R1: Criação de Parcelas**

```typescript
// REGRA: Sempre criar com 2 parcelas automáticas
function validateOrderCreation(order) {
  if (order.paymentInstallments !== 2) {
    throw new Error("Sistema suporta apenas 2 parcelas PIX");
  }
  
  if (order.paymentMethod !== 'PIX') {
    throw new Error("Parcelas disponíveis apenas para PIX");
  }
}
```

### **R2: Cálculo das Parcelas**

```typescript
// REGRA: Soma das parcelas deve bater com total
function validateInstallmentAmounts(order, installments) {
  const total = installments.reduce((sum, inst) => sum + inst.amount, 0);
  
  if (Math.abs(total - order.total) > 0.01) { // 1 centavo de tolerância
    throw new Error(
      `Soma de parcelas (R$ ${total.toFixed(2)}) diferente do total (R$ ${order.total.toFixed(2)})`
    );
  }
}
```

### **R3: Criação da Parcela 2**

```typescript
// REGRA: Parcela 2 SÓ criada se Parcela 1 está PAID
function canCreateInstallment2(order) {
  if (order.installments[0].status !== InstallmentStatus.PAID) {
    throw new Error(
      "Parcela 2 só pode ser criada após pagamento da Parcela 1"
    );
  }
}
```

### **R4: Status do Pedido**

```typescript
// REGRA: Pedido só é PAID quando ambas as parcelas estão PAID
function updateOrderPaymentStatus(order) {
  const allPaid = order.installments.every(
    inst => inst.status === InstallmentStatus.PAID
  );
  
  order.paymentStatus = allPaid ? PaymentStatus.PAID : PaymentStatus.PENDING;
  
  if (allPaid) {
    order.status = 'CONFIRMED'; // Liberar para preparação
  }
}
```

### **R5: Expiração de QR Codes**

```typescript
// REGRA: Apenas Parcela 1 tem expiração; Parcela 2 é permanente
function setInstallmentExpiration(installment, installmentNumber) {
  if (installmentNumber === 1) {
    installment.expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min
  } else if (installmentNumber === 2) {
    installment.expiresAt = null; // SEM EXPIRAÇÃO
  }
}
```

### **R6: Validação de Webhook**

```typescript
// REGRA: Apenas processar webhooks com external_reference válido
function validateWebhookReference(reference) {
  const regex = /^([0-9a-f]{24})-INSTALLMENT-([12])$/;
  const match = reference.match(regex);
  
  if (!match) {
    throw new Error("external_reference inválido: " + reference);
  }
  
  return {
    orderId: match[1],
    installmentNumber: parseInt(match[2]),
  };
}
```

### **R7: Idempotência**

```typescript
// REGRA: Cada criação de preference deve ser idempotente
async function createMercadoPagoPreference(installment) {
  // Usar header: Idempotency-Key
  const idempotencyKey = `${installment.orderId}-INST-${installment.installmentNumber}-${Date.now()}`;
  
  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    headers: {
      'Idempotency-Key': idempotencyKey,
      'Authorization': `Bearer ${MERCADO_PAGO_TOKEN}`,
    },
  });
  
  installment.mpIdempotencyKey = idempotencyKey;
}
```

---

## 🔐 Boas Práticas para Evitar Inconsistências

### **1. Transações Atomares no Banco**

```typescript
// ✅ BOM: Usar transação
async function createOrderWithInstallments(orderData) {
  return await prisma.$transaction(async (tx) => {
    // Criar pedido
    const order = await tx.order.create({
      data: { ...orderData }
    });
    
    // Criar parcelas atomicamente
    const installments = await tx.paymentInstallment.createMany({
      data: [
        {
          orderId: order.id,
          installmentNumber: 1,
          amount: order.total / 2,
          status: InstallmentStatus.PENDING,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
        {
          orderId: order.id,
          installmentNumber: 2,
          amount: order.total / 2,
          status: InstallmentStatus.PENDING,
          expiresAt: null,
        },
      ],
    });
    
    return { order, installments };
  });
}

// ❌ RUIM: Criar separadamente (risco de inconsistência)
const order = await createOrder();
const installments = await createInstallments(); // Pode falhar após order criada
```

### **2. Log de Webhooks**

```typescript
// ✅ BOM: Registrar todos os webhooks para auditoria
async function handleMercadoPagoWebhook(payload) {
  const installment = await findInstallmentByMPPreferenceId(payload.data.id);
  
  if (installment) {
    // Log o webhook
    installment.webhookLog = {
      ...installment.webhookLog,
      [new Date().toISOString()]: {
        event: payload.action,
        status: payload.data.status,
        paymentId: payload.data.id,
      },
    };
    
    await updateInstallmentStatus(installment, payload.data.status);
  }
}
```

### **3. Verificação de Coherência**

```typescript
// ✅ BOM: Validar estado antes de processar
async function processPaymentUpdate(mpPaymentId) {
  const payment = await getMercadoPagoPayment(mpPaymentId);
  const installment = await findInstallmentByMPPaymentId(mpPaymentId);
  
  // Verificar se já foi processado
  if (installment.status === InstallmentStatus.PAID) {
    console.log(`Pagamento já processado: ${mpPaymentId}`);
    return; // Idempotente
  }
  
  // Verificar coerência
  if (Math.abs(payment.amount - installment.amount) > 0.01) {
    throw new Error(
      `Valor do pagamento (${payment.amount}) diferente da parcela (${installment.amount})`
    );
  }
  
  // Atualizar
  installment.status = InstallmentStatus.PAID;
  installment.paidAt = new Date();
  await installment.save();
}
```

### **4. Retry Logic com Backoff Exponencial**

```typescript
// ✅ BOM: Retornar com espera progressiva
async function createMercadoPagoPreferenceWithRetry(
  installment,
  maxAttempts = 3
) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await createMercadoPagoPreference(installment);
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      console.log(`Tentativa ${attempt} falhou. Aguardando ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### **5. Reconciliação Periódica**

```typescript
// ✅ BOM: Job que verifica inconsistências a cada hora
async function reconcilePayments() {
  // Buscar todos os pagamentos no status PAYMENT_CREATED há mais de 1 hora
  const stuckInstallments = await prisma.paymentInstallment.findMany({
    where: {
      status: InstallmentStatus.PAYMENT_CREATED,
      createdAt: {
        lt: new Date(Date.now() - 60 * 60 * 1000), // 1 hora atrás
      },
    },
  });
  
  for (const installment of stuckInstallments) {
    // Consultar status real no MP
    const mpPayment = await getMercadoPagoPaymentByReference(
      installment.mpPreferenceId
    );
    
    // Se divergir, corrigir
    if (mpPayment.status === 'approved' && 
        installment.status !== InstallmentStatus.PAID) {
      console.warn(
        `INCONSISTÊNCIA DETECTADA: Installment ${installment.id} não foi marcada como paga`
      );
      installment.status = InstallmentStatus.PAID;
      installment.paidAt = new Date();
      await installment.save();
    }
  }
}

// Executar a cada hora
setInterval(reconcilePayments, 60 * 60 * 1000);
```

### **6. Proteção Contra Manipulação**

```typescript
// ✅ BOM: Validar integridade de dados críticos
async function validateInstallmentIntegrity(order) {
  const installments = await prisma.paymentInstallment.findMany({
    where: { orderId: order.id },
  });
  
  // Verificação 1: Deve ter exatamente 2 parcelas
  if (installments.length !== 2) {
    throw new Error(
      `Pedido ${order.id} tem ${installments.length} parcelas. Esperado: 2`
    );
  }
  
  // Verificação 2: Soma deve bater
  const total = installments.reduce((sum, inst) => sum + inst.amount, 0);
  if (Math.abs(total - order.total) > 0.01) {
    throw new Error(
      `Soma de parcelas diverge do total do pedido ${order.id}`
    );
  }
  
  // Verificação 3: Números devem ser 1 e 2
  const numbers = new Set(installments.map(inst => inst.installmentNumber));
  if (!numbers.has(1) || !numbers.has(2)) {
    throw new Error(
      `Parcelas devem ter installmentNumber 1 e 2 no pedido ${order.id}`
    );
  }
  
  // Verificação 4: Parcela 2 só deve ter expiração nula
  const installment2 = installments.find(inst => inst.installmentNumber === 2);
  if (installment2.expiresAt !== null) {
    throw new Error(
      `Parcela 2 do pedido ${order.id} não deve ter expiração`
    );
  }
  
  return true;
}
```

### **7. Documentação de Mudanças**

```typescript
// ✅ BOM: Usar campos de auditoria
enum AuditAction {
  CREATED = "CREATED",
  PAYMENT_CREATED = "PAYMENT_CREATED",
  PAID = "PAID",
  FAILED = "FAILED",
  EXPIRED = "EXPIRED",
}

interface AuditLog {
  timestamp: Date;
  action: AuditAction;
  changedBy: string; // "SYSTEM", "WEBHOOK", user ID...
  reason?: string;
  mpResponse?: object;
}

// Adicionar ao modelo PaymentInstallment:
// auditLog: Json[] // Array de AuditLog

async function logInstallmentChange(
  installment: PaymentInstallment,
  action: AuditAction,
  changedBy: string,
  reason?: string
) {
  const log: AuditLog = {
    timestamp: new Date(),
    action,
    changedBy,
    reason,
  };
  
  installment.auditLog = [...(installment.auditLog || []), log];
  await installment.save();
}
```

---

## 🌐 Estrutura de Webhook Esperado

### **Payload do Mercado Pago:**

```json
{
  "id": "123456789",
  "live_mode": true,
  "type": "payment",
  "date_created": "2026-01-20T10:30:00Z",
  "user_id": 123456,
  "api_version": "v1",
  "action": "payment.created",
  "data": {
    "id": 987654321,
    "status": "approved",
    "transaction_amount": 50.00,
    "currency_id": "BRL",
    "description": "Pedido #ORDER_ID",
    "external_reference": "ORDER_ID-INSTALLMENT-1",
    "payment_method_id": "pix",
    "payer": {
      "id": 555555,
      "email": "customer@example.com"
    },
    "date_approved": "2026-01-20T10:35:00Z"
  }
}
```

### **Tratamento no Backend:**

```typescript
async function handleMercadoPagoWebhook(req, res) {
  const { data, action } = req.body;
  
  // 1. Validar assinatura (importante!)
  if (!validateMercadoPagoSignature(req)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  try {
    // 2. Extrair dados do webhook
    const { orderId, installmentNumber } = 
      parseExternalReference(data.external_reference);
    
    // 3. Atualizar banco em transação
    await prisma.$transaction(async (tx) => {
      const installment = await tx.paymentInstallment.findUnique({
        where: { 
          orderId_installmentNumber: {
            orderId,
            installmentNumber,
          },
        },
      });
      
      if (!installment) {
        throw new Error(`Installment não encontrada`);
      }
      
      // 4. Validar integridade
      if (Math.abs(data.transaction_amount - installment.amount) > 0.01) {
        throw new Error(`Valor divergente`);
      }
      
      // 5. Atualizar status conforme resposta
      if (data.status === 'approved') {
        installment.status = InstallmentStatus.PAID;
        installment.paidAt = new Date();
      } else if (data.status === 'rejected') {
        installment.status = InstallmentStatus.FAILED;
      }
      
      await tx.paymentInstallment.update({
        where: { id: installment.id },
        data: installment,
      });
      
      // 6. Se Parcela 1 foi paga, criar Parcela 2
      if (installmentNumber === 1 && 
          data.status === 'approved') {
        await createInstallment2(tx, orderId);
      }
      
      // 7. Se Parcela 2 foi paga, marcar pedido como PAID
      if (installmentNumber === 2 && 
          data.status === 'approved') {
        const order = await tx.order.findUnique({ where: { id: orderId } });
        if (order.installment1Status === 'PAID') {
          await tx.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: PaymentStatus.PAID,
              status: 'CONFIRMED',
            },
          });
        }
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    res.status(500).json({ error: error.message });
  }
}
```

---

## 📊 Matriz de Estados

| Cenário | Inst1 Status | Inst2 Status | Order Status | Ação do Sistema |
|---------|-------------|-------------|-------------|-----------------|
| Criação | PENDING | PENDING | PENDING | Gerar QR1, aguardar pagamento |
| Inst1 Paga | PAID | PENDING | PENDING | Gerar QR2, notificar cliente |
| Inst1 Expirada | EXPIRED | PENDING | PENDING | Regenerar QR1 |
| Inst2 Paga | PAID | PAID | PAID | Confirmar pedido, iniciar envio |
| Inst1 Falha | FAILED | PENDING | FAILED | Permitir retry |
| Inst2 Falha | PAID | FAILED | PENDING | Permitir retry Inst2 |

---

## 🔍 Checklist de Implementação

- [ ] Criar entidade `PaymentInstallment` no Prisma
- [ ] Criar enum `InstallmentStatus`
- [ ] Atualizar indices de banco para performance
- [ ] Implementar `createOrderWithInstallments()` com transação
- [ ] Implementar `createMercadoPagoPreference()` com idempotência
- [ ] Implementar handler de webhook
- [ ] Implementar validação de integridade
- [ ] Implementar job de reconciliação
- [ ] Adicionar testes unitários para fluxos
- [ ] Adicionar testes de integração com MP
- [ ] Documentar endpoints da API
- [ ] Criar monitoramento de anomalias

---

## 🚀 Exemplo de Uso Completo

```typescript
// Frontend chama:
POST /api/orders
{
  "userId": "user123",
  "items": [...],
  "paymentMethod": "PIX",
  "paymentInstallments": 2,
  "shippingAddress": {...}
}

// Backend retorna:
{
  "orderId": "order456",
  "paymentStatus": "PENDING",
  "installment1": {
    "qrCode": "base64...",
    "amount": 50.00,
    "expiresIn": 1800 // segundos
  },
  "message": "Escaneie o QR Code para pagar a primeira parcela"
}

// Cliente paga
// MP chama webhook
// Sistema cria Parcela 2
// Frontend exibe novo QR

// Cliente paga segunda parcela
// MP chama webhook
// Sistema marca pedido como PAID
// Email confirmação enviado
```

---

**Última atualização:** 20/01/2026
**Versão:** 1.0
