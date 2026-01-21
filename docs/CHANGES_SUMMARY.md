# Resumo de Mudanças - Sistema 2 Parcelas PIX

## 📋 Arquivos Modificados

### 1. **Prisma Schema** (`prisma/schema.prisma`)
- ✅ Adicionado `enum InstallmentStatus` com 5 estados
- ✅ Adicionada entidade `PaymentInstallment` com relacionamento 1:N com Order
- ✅ Removidos campos antigos de parcelas da Order
- ✅ Adicionado relacionamento `installments: PaymentInstallment[]` na Order

### 2. **API de Pedidos** (`pages/api/orders.ts`)
- ✅ Modificada criação de Order para usar transação atômica
- ✅ Adicionada criação automática de 2 `PaymentInstallment` ao criar Order
- ✅ Parcela 1: amount = 50% do total, expiresAt = 30 min
- ✅ Parcela 2: amount = 50% restante, expiresAt = NULL

### 3. **API de Pagamentos** (`pages/api/payments/create.ts`)
- ✅ Modificado para buscar e utilizar Parcela 1
- ✅ Criação de Preference no MP agora usa `external_reference: "ORDER_ID-INSTALLMENT-1"`
- ✅ Atualiza `PaymentInstallment.status = PAYMENT_CREATED` com dados do MP
- ✅ Retorna estrutura: `{ order, installment1, mp: { id, qr, qrBase64 } }`

### 4. **Webhook do MP** (`pages/api/payments/webhook.ts`)
- ✅ Parse de `external_reference` para identificar `(orderId, installmentNumber)`
- ✅ Busca `PaymentInstallment` ao invés de `Order`
- ✅ Ao confirmar Parcela 1: cria Parcela 2 automaticamente no MP
- ✅ Ao confirmar Parcela 2: marca Order como `PAID` e status = `CONFIRMED`
- ✅ Usa `prisma.$transaction()` para atomicidade

### 5. **Frontend - Payment** (`pages/payment.tsx`)
- ✅ Atualizado `createPaymentForOrder()` para trabalhar com `installment1`
- ✅ Alterado título para "Pagamento PIX - Parcela 1/2"
- ✅ Normaliza status: `PAYMENT_CREATED` → `WAITING_PAYMENT`
- ✅ Toast atualizado: "Pagamento PIX (Parcela 1/2) gerado com sucesso!"

### 6. **Frontend - Payment by ID** (`pages/payment/[id].tsx`)
- ✅ Mesmas alterações que `payment.tsx`
- ✅ Compatível com rota dinâmica `/payment/[id]`

## 📊 Fluxo de Dados

### Criação de Pedido
```
POST /api/orders
  ↓
Criar Order (tx)
  ├─ OrderItem[]
  ├─ PaymentInstallment 1 (PENDING, expiresAt = NOW + 30min)
  └─ PaymentInstallment 2 (PENDING, expiresAt = NULL)
  ↓
Retornar: { id: ORDER_ID, localOrder }
```

### Criação de Pagamento
```
POST /api/payments/create { orderId, amount }
  ↓
Buscar PaymentInstallment 1
  ↓
POST https://api.mercadopago.com/v1/payments
  - transaction_amount: installment1.amount
  - external_reference: "ORDER_ID-INSTALLMENT-1"
  - payment_method_id: "pix"
  ↓
Atualizar PaymentInstallment 1
  - status: PAYMENT_CREATED
  - mpPreferenceId: data.id
  - mpQrCodeBase64, mpQrCodeUrl
  ↓
Retornar: { order, installment1, mp: { id, qr, qrBase64 } }
```

### Webhook Parcela 1 Paga
```
POST /api/payments/webhook (external_reference: "ORDER_ID-INSTALLMENT-1", status: approved)
  ↓
Buscar PaymentInstallment 1 (tx)
  ├─ Atualizar status: PAID
  ├─ Atualizar paidAt: NOW
  │
  └─ Criar Preference Parcela 2 no MP (tx)
     - transaction_amount: installment2.amount
     - external_reference: "ORDER_ID-INSTALLMENT-2"
     - expires_in: [não definido = sem expiração]
     └─ Atualizar PaymentInstallment 2
        - status: PAYMENT_CREATED
        - mpPreferenceId, mpQrCodeBase64, mpQrCodeUrl
```

### Webhook Parcela 2 Paga
```
POST /api/payments/webhook (external_reference: "ORDER_ID-INSTALLMENT-2", status: approved)
  ↓
Buscar PaymentInstallment 2 (tx)
  ├─ Atualizar status: PAID
  ├─ Atualizar paidAt: NOW
  │
  └─ Validar ambas as parcelas
     └─ if (installment1.PAID && installment2.PAID)
        ├─ Order.paymentStatus = PAID
        └─ Order.status = CONFIRMED ✅
```

## 🔑 Mudanças Chave de Lógica

### Antes (Antigo)
- ❌ 1 Payment por Order
- ❌ Sem suporte a parcelas
- ❌ Campos duplicados: `mpPreferenceId`, `installment1Status`, `installment2Status`, etc.

### Depois (Novo)
- ✅ 2+ Payments por Order via `PaymentInstallment`
- ✅ Suporte completo a parcelamento
- ✅ Estrutura normalizada: 1 `PaymentInstallment` = 1 linhas com tudo que precisa
- ✅ `external_reference` inclui número da parcela
- ✅ Webhook trata cada parcela independentemente

## 🧮 Validações Implementadas

1. **Soma de Parcelas**: `sum(installment.amount) === order.total` (tolerância: 0.01)
2. **Parcela 2 só após Parcela 1**: Status deve ser PAID antes de criar Parcela 2
3. **Expiração Parcela 2**: Sempre NULL (sem expiração)
4. **Order status**: Apenas PAID quando ambas as parcelas estão PAID
5. **Idempotência**: Mesma chave nunca cria 2 preferences

## 🚨 Impacto em Outras Áreas

### Queries que precisam atualizar

- ❌ `Order.mpPreferenceId` → use `Order.installments[0].mpPreferenceId`
- ❌ `Order.paymentExpiresAt` → use `Order.installments[0].expiresAt`
- ❌ `Order.paidAt` → use `max(Order.installments[*].paidAt)` ou check paymentStatus
- ✅ `Order.paymentStatus` → mantém o mesmo significado

### Endpoints que precisam atualizar

- [ ] `GET /api/orders/[id]` - Incluir installments na resposta
- [ ] `GET /api/orders/list` - Incluir installments na resposta
- [ ] `/api/payments/[id]/pix-status` - Buscar status da Parcela 1 (ou especificar qual)
- [ ] Dashboard Admin - Exibir status de parcelas separadamente

## 📚 Documentação Adicionada

1. **PAYMENT_INSTALLMENTS_LOGIC.md** - Lógica completa + boas práticas
2. **SCHEMA_UPDATES.md** - Mudanças do schema + migrations SQL
3. **IMPLEMENTATION_GUIDE.md** - Guia passo a passo para deploy
4. **paymentInstallmentsService.ts** - Implementação pronta em TypeScript

---

**Data**: 20/01/2026  
**Versão**: 1.0
**Arquivo**: `/pages/manage-shipping-rates.tsx`

```diff
interface ShippingRate {
  id?: string;
- quantity: number;
+ quantityUpTo: number;
  height: number;
  width: number;
  length: number;
+ weight: number;      // NOVO
  sedexValue?: number;
  pacValue?: number;
}
```

### 3. Página de Gerenciamento
**Arquivo**: `/pages/manage-shipping-rates.tsx`

#### Campo Adicionado
- **Peso (kg)**: Campo numérico para definir peso do pacote
- Exemplo: `1.8`, `2.3`, `3.0`, `4.5`

#### Validação Atualizada
```typescript
// ANTES: precisava de altura, largura, comprimento
// AGORA: precisa também de peso
if (!newRate.quantityUpTo || !newRate.height || !newRate.width || !newRate.length || !newRate.weight)
```

#### Labels Atualizados
| Antes | Depois |
|-------|--------|
| "Quantidade de Peças" | "Quantidade Até (peças)" |
| "Tamanho da Caixa (A×C×L)" | "Dimensões (A×L×C)" |
| (sem peso) | "Peso (kg)" |

#### Tabela
```
Antes: Quantidade | Tamanho | SEDEX | PAC | Ações
Depois: Até (peças) | Dimensões | Peso | SEDEX | PAC | Ações
```

### 4. API de Cálculo Admin
**Arquivo**: `/pages/api/admin/calculate-shipping.ts`

#### Request
```diff
- { height, width, length, cep }
+ { height, width, length, weight, cep }
```

#### Fórmula
```diff
- volume = h × w × l
- peso = max(0.3, volume / 6000)  // Calculado do volume
+ peso = Math.max(0.3, weight)    // Usa peso informado
  SEDEX = (peso × 50) + 15
  PAC = (peso × 25) + 10
```

#### Response
```diff
  {
    sedex: number,
    pac: number,
    cep: string,
-   volume: number,
-   peso: number,
+   height: number,
+   width: number,
+   length: number,
+   weight: number,
  }
```

### 5. API de Cálculo para Pedidos
**Arquivo**: `/pages/api/orders/calculate-shipping.ts`

#### Lógica Alterada
```typescript
// ANTES: 
// Busca rate onde quantity >= orderQuantity

// AGORA:
// Busca rate onde quantityUpTo >= orderQuantity
// Exemplo: Se ordem tem 12 itens, busca a menor faixa >= 12
// Resultado: Usa "Até 15" (pois 15 >= 12 e é a menor)
```

#### Cálculo
```typescript
// ANTES:
const peso = Math.max(0.3, volume / 6000)

// AGORA:
const peso = shippingRate.weight  // Usa peso da tabela
```

#### Response Expandido
```diff
{
  sedex: number,
  pac: number,
  cep: string,
  quantity: number,
+ quantityUpTo: number,
+ height: number,
+ width: number,
+ length: number,
+ weight: number,
  shippingRateId: string,
}
```

### 6. Página de Pedidos
**Arquivo**: `/components/orders/index.tsx`

#### Lógica de Cálculo
```typescript
// Calcula frete para cada pedido ao carregar
for (const order of orders) {
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Se CEP em zona restrita (39400-000 a 39409-999)
  if (cepNumber >= 39400000 && cepNumber <= 39409999) {
    shippingCalcs[order.id] = { sedex: 0, pac: 0 };  // Mostra "Frete na zona local"
  } else {
    // Calcula usando nova API
    const response = await api.post('/orders/calculate-shipping', {
      quantity: totalItems,
      cep: order.shippingAddress.postalCode
    });
    shippingCalcs[order.id] = response.data;  // Agora inclui peso, dimensões, etc
  }
}
```

## 📊 Exemplos de Migração

### Tabela Antiga (Cancelada)
```
ID: 1, quantity: 10,  height: 7,  width: 16,  length: 19
ID: 2, quantity: 15,  height: 7,  width: 16,  length: 19
ID: 3, quantity: 20,  height: 28, width: 28,  length: 36
```

### Tabela Nova (Esperada)
```
ID: 1, quantityUpTo: 10,  height: 13, width: 22, length: 30, weight: 1.8
ID: 2, quantityUpTo: 15,  height: 13, width: 22, length: 30, weight: 2.3
ID: 3, quantityUpTo: 20,  height: 28, width: 28, length: 36, weight: 3.0
ID: 4, quantityUpTo: 30,  height: 28, width: 28, length: 36, weight: 3.5
ID: 5, quantityUpTo: 40,  height: 40, width: 40, length: 40, weight: 4.5
```

## 🔄 Fluxo de Cálculo (Novo)

### Admin Criando Faixa
```
Admin preenche: até 15, altura 13, largura 22, comprimento 30, peso 2.3
↓
Clica em "Calcular Frete via Correios"
↓
API calcula: SEDEX = (2.3 × 50) + 15 = R$130, PAC = (2.3 × 25) + 10 = R$67.50
↓
Admin clica "Criar Tabela de Frete"
↓
Registrado: { quantityUpTo: 15, height: 13, width: 22, length: 30, weight: 2.3, sedexValue: 130, pacValue: 67.50 }
```

### Usuário Vendo Pedidos
```
Pedido com 12 itens, CEP 85300-000
↓
Sistema calcula quantidade total: 12 itens
↓
Busca faixa: quantityUpTo >= 12 (ASC)
↓
Encontra: "Até 15" (2.3kg)
↓
Calcula: SEDEX = 130, PAC = 67.50
↓
Exibe no card do pedido
```

## 🚀 Como Usar

### Criar Nova Faixa
1. Ir para `/manage-shipping-rates`
2. Clicar "+ Adicionar Nova Tabela"
3. Preencher:
   - Quantidade Até: `15`
   - Altura: `13`
   - Largura: `22`
   - Comprimento: `30`
   - Peso: `2.3`
4. Clicar "Calcular Frete via Correios"
5. Valores SEDEX/PAC preenchem automaticamente
6. Clicar "Criar Tabela de Frete"

### Editar Faixa
1. Na tabela, clicar "Editar"
2. Modificar valores
3. Se mudar peso/dimensões, clicar "Calcular Frete" novamente
4. Clicar "Atualizar Tabela de Frete"

### Deletar Faixa
1. Na tabela, clicar "Deletar"
2. Confirmar exclusão

## ⚠️ Mudanças Quebradoras (Breaking Changes)

Se você tinha faixas de frete cadastradas **ANTES** dessa alteração:

1. **As faixas antigas precisam ser recriadas** - o banco de dados mudou
2. **Campo `quantity` virou `quantityUpTo`** - semântica diferente
3. **Novo campo obrigatório `weight`** - todas as faixas precisam dele
4. **Campos removidos `cep` e `destination`** - não são mais usados

### Como Migrar Dados Antigos

Se você tinha faixas antigas e quer migrar:

```javascript
// Script de migração (pseudo-código)
const oldRates = [
  { quantity: 10, height: 7, width: 16, length: 19 },
  { quantity: 15, height: 7, width: 16, length: 19 },
  { quantity: 20, height: 28, width: 28, length: 36 }
];

const newRates = oldRates.map(rate => ({
  quantityUpTo: rate.quantity,        // Renomeia quantity
  height: rate.height,
  width: rate.width,
  length: rate.length,
  weight: 2.0,                        // NOVO: estima peso
  sedexValue: 0,                      // Será calculado
  pacValue: 0,                        // Será calculado
}));

// Depois de inserir, recalcular todos os sedexValue/pacValue no admin
```

## 📝 Checklist de Implementação

- [x] Atualizar Prisma schema (`quantityUpTo`, adicionar `weight`)
- [x] Atualizar interface TypeScript
- [x] Atualizar página `/manage-shipping-rates`
  - [x] Adicionar campo Peso
  - [x] Validações
  - [x] Labels
  - [x] Tabela com nova estrutura
- [x] Atualizar API `/admin/calculate-shipping` (aceitar weight)
- [x] Atualizar API `/orders/calculate-shipping` (nova lógica de faixa)
- [x] Atualizar `/components/orders` (cálculo de frete)
- [x] Documentação criada

## 📚 Documentação Relacionada

- `SHIPPING_RATES_SYSTEM.md` - Guia completo do novo sistema
- `CORREIOS_INTEGRATION.md` - Como integrar com API real dos Correios

## 🔧 Troubleshooting

Se você encontrar erros:

1. **"quantityUpTo não existe no tipo 'ShippingRate'"**
   - Seu TypeScript está desatualizado
   - Execute: `npm run dev` e aguarde a regeneração
   - Ou: `npx prisma generate`

2. **"Nenhuma tabela de frete encontrada"**
   - Não há faixas cadastradas
   - Acesse `/manage-shipping-rates` e crie uma

3. **"Erro ao calcular frete"**
   - Verifique se todos os campos (altura, largura, comprimento, peso) foram preenchidos
   - Verifique o console do servidor para mais detalhes

## 🎯 Resultado Final

✅ Admin pode criar faixas com dimensões e peso específicos
✅ Sistema busca a faixa correta baseado na quantidade de itens
✅ Cálculo de frete é baseado no peso definido na faixa
✅ Usuários veem SEDEX/PAC nos pedidos
✅ CEPs restritos mostram "Frete na zona local"
