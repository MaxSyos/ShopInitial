# Schema Prisma Atualizado - Pagamentos em 2 Parcelas

Este arquivo apresenta as ALTERAÇÕES propostas ao schema.prisma para suportar adequadamente o sistema de 2 parcelas PIX.

## Adições Necessárias

### 1. Novo Enum para Status de Parcelas

```prisma
enum InstallmentStatus {
  PENDING           // Parcela criada, aguardando pagamento
  PAYMENT_CREATED   // Preference criada no MP, QR gerado, aguardando confirmação
  PAID              // Pagamento confirmado
  FAILED            // Pagamento falhou
  EXPIRED           // QR Code expirou (apenas Parcela 1)
}
```

### 2. Nova Entidade - PaymentInstallment

```prisma
model PaymentInstallment {
  id                String              @id @map("_id") @default(auto()) @db.ObjectId
  orderId           String              @db.ObjectId
  order             Order               @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  // Identificação
  installmentNumber Int                 // 1 ou 2
  
  // Valores
  amount            Float               // Valor da parcela em reais
  
  // Integração Mercado Pago
  mpPreferenceId    String?             @unique // ID da preference no MP
  mpIdempotencyKey  String?             // Chave de idempotência
  mpQrCodeBase64    String?             // QR code em base64 (para exibição)
  mpQrCodeUrl       String?             // URL do QR code público
  
  // Status e datas
  status            InstallmentStatus   @default(PENDING)
  createdAt         DateTime            @default(now())
  paidAt            DateTime?           // Data/hora do pagamento confirmado
  expiresAt         DateTime?           // Data de expiração (apenas Inst1, Inst2 = null)
  
  // Auditoria e histórico
  webhookLog        Json?               // Registro de webhooks recebidos
  
  // Índices para queries frequentes
  @@unique([orderId, installmentNumber])
  @@index([orderId])
  @@index([status])
  @@index([mpPreferenceId])
  @@index([paidAt])
}
```

### 3. Modificações na Entidade Order

**Remover os campos antigos de parcelas:**
```prisma
// REMOVER ESTES CAMPOS (substituir pela relação com PaymentInstallment)
- paymentExpiresAt
- paymentExpiresAt2
- installment1Status
- installment1Amount
- installment1PaidAt
- mpPreferenceId2
- installment2Status
- installment2Amount
- installment2PaidAt
- mpQrCodeBase642
- mpQrCodeUrl2
```

**Adicionar nova estrutura:**
```prisma
model Order {
  id             String      @id @map("_id") @default(auto()) @db.ObjectId
  userId         String      @db.ObjectId
  user           User        @relation(fields: [userId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  items          OrderItem[]
  itemsJson      Json?
  externalId     String?
  
  // Endereços
  shippingAddress Json?
  billingAddress  Json?
  
  // Pagamento: sempre PIX 2x
  paymentMethod   PaymentMethod @default(PIX)
  paymentStatus   PaymentStatus @default(PENDING) // PAID só quando ambas as parcelas pagarem
  
  // RELACIONAMENTO COM PARCELAS (novo)
  installments    PaymentInstallment[]
  
  // Contagem (para queries rápidas)
  paymentInstallments Int @default(2) // Sempre 2
  
  // Valores
  subtotal        Float
  shippingCost    Float       @default(0)
  tax             Float       @default(0)
  total           Float
  
  // Status do pedido
  status          String      @default("PENDING") // PENDING, PAYMENT_PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
  
  // Rastreamento
  trackingCode    String?
  deliveryMethod  String      @default("PENDING") // PENDING, CORREIOS, LOCAL
  isDelivered     Boolean     @default(false)
  deliveredAt     DateTime?
  trackingUrl     String?
  isLocalPickup   Boolean     @default(false)
  
  // Timestamps
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  // Índices
  @@index([userId])
  @@index([paymentStatus])
  @@index([status])
}
```

## Migrations SQL Equivalentes (MongoDB)

Caso você precise fazer manualmente:

```javascript
// 1. Criar nova collection PaymentInstallment
db.createCollection("PaymentInstallment", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["orderId", "installmentNumber", "amount", "status"],
      properties: {
        _id: { bsonType: "objectId" },
        orderId: { bsonType: "objectId" },
        installmentNumber: { bsonType: "int" },
        amount: { bsonType: "double" },
        mpPreferenceId: { bsonType: "string" },
        mpIdempotencyKey: { bsonType: "string" },
        mpQrCodeBase64: { bsonType: "string" },
        mpQrCodeUrl: { bsonType: "string" },
        status: { enum: ["PENDING", "PAYMENT_CREATED", "PAID", "FAILED", "EXPIRED"] },
        createdAt: { bsonType: "date" },
        paidAt: { bsonType: ["date", "null"] },
        expiresAt: { bsonType: ["date", "null"] },
        webhookLog: { bsonType: ["object", "null"] }
      }
    }
  }
});

// 2. Criar índices
db.PaymentInstallment.createIndex({ orderId: 1, installmentNumber: 1 }, { unique: true });
db.PaymentInstallment.createIndex({ orderId: 1 });
db.PaymentInstallment.createIndex({ status: 1 });
db.PaymentInstallment.createIndex({ mpPreferenceId: 1 }, { unique: true, sparse: true });
db.PaymentInstallment.createIndex({ paidAt: 1 });

// 3. Migrar dados existentes (se houver)
db.Order.find({ paymentInstallments: { $exists: true } }).forEach(order => {
  const installments = [];
  
  // Parcela 1
  if (order.installment1Amount) {
    installments.push({
      orderId: order._id,
      installmentNumber: 1,
      amount: order.installment1Amount,
      status: order.installment1Status || "PENDING",
      mpPreferenceId: order.mpPreferenceId,
      mpQrCodeBase64: order.mpQrCodeBase64,
      mpQrCodeUrl: order.mpQrCodeUrl,
      createdAt: order.createdAt,
      paidAt: order.installment1PaidAt || null,
      expiresAt: order.paymentExpiresAt || null,
    });
  }
  
  // Parcela 2
  if (order.installment2Amount) {
    installments.push({
      orderId: order._id,
      installmentNumber: 2,
      amount: order.installment2Amount,
      status: order.installment2Status || "PENDING",
      mpPreferenceId: order.mpPreferenceId2,
      mpQrCodeBase64: order.mpQrCodeBase642,
      mpQrCodeUrl: order.mpQrCodeUrl2,
      createdAt: order.createdAt || new Date(),
      paidAt: order.installment2PaidAt || null,
      expiresAt: null, // Parcela 2 nunca expira
    });
  }
  
  db.PaymentInstallment.insertMany(installments);
});

// 4. Remover campos antigos de Order (CUIDADO: backup antes!)
db.Order.updateMany(
  {},
  {
    $unset: {
      paymentExpiresAt: "",
      paymentExpiresAt2: "",
      installment1Status: "",
      installment1Amount: "",
      installment1PaidAt: "",
      mpPreferenceId2: "",
      installment2Status: "",
      installment2Amount: "",
      installment2PaidAt: "",
      mpQrCodeBase642: "",
      mpQrCodeUrl2: "",
      mpPreferenceId: "",
      mpIdempotencyKey: "",
      mpQrCodeBase64: "",
      mpQrCodeUrl: ""
    }
  }
);
```

## Schema Completo Atualizado

Veja o arquivo `schema.prisma` atualizado com todas as alterações aplicadas.

