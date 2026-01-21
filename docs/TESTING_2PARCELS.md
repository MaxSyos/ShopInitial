# Guia de Teste: Sistema de 2 Parcelas PIX

## 🎯 Objetivo
Validar que o sistema de 2 parcelas PIX está funcionando completamente do início ao fim.

---

## ✅ PASSO 1: Verificar Componente Renderiza

### 1.1 Abra o Browser
```
URL: http://localhost:3000/orders
Faça login se necessário
```

### 1.2 Procure pela seção "Parcelas"
```
Deve estar visível em cada pedido:

┌─────────────────────────────────────┐
│ Parcelas                            │
│ Parcela 1/2                         │
│ R$ XX,XX                            │
│ [Status Badge]                      │
│                                     │
│ Parcela 2/2                         │
│ R$ XX,XX                            │
│ [Status Badge]                      │
└─────────────────────────────────────┘
```

**✓ Se vir:** Componente renderizando corretamente
**✗ Se não vir:** 
- Verificar console (F12) para erros
- Verificar que o pedido tem installments na API

---

## ✅ PASSO 2: Criar Novo Pedido

### 2.1 Navegar para Produtos
```
URL: http://localhost:3000/products
```

### 2.2 Selecionar alguns produtos
```
Clique em "Adicionar ao Carrinho" (mínimo 2 produtos)
```

### 2.3 Ir para Carrinho
```
URL: http://localhost:3000/cart
Clique em "Continuar para Checkout"
```

### 2.4 Preencher Endereço
```
Endereço (CEP entre 39400-000 e 39409-999 para zona local)
Cidade, Estado, País
Clique "Continuar"
```

### 2.5 Confirmar Pedido
```
Revisar itens
Total: R$ XXXX,XX
Clique "Confirmar Pedido"
```

**✓ Esperado:**
- Pedido criado com sucesso
- Redirecionado para página de pagamento
- Vê 2 parcelas (cada uma com 50% do total)

---

## ✅ PASSO 3: Verificar Parcelas na API

### 3.1 Abra DevTools → Network
```
F12 ou Ctrl+Shift+I
Clique em aba "Network"
```

### 3.2 Recarregar página de pedidos
```
Ctrl+R
Procure por requisição "list" (GET /api/orders/list)
```

### 3.3 Verificar Response
```
Clique na requisição
Aba "Response" ou "Preview"
Procure por campo "installments"

Deve ter estrutura:
{
  "orders": [
    {
      "id": "...",
      "installments": [
        {
          "id": "...",
          "installmentNumber": 1,
          "status": "PENDING",
          "amount": 50,
          ...
        },
        {
          "id": "...",
          "installmentNumber": 2,
          "status": "PENDING",
          "amount": 50,
          ...
        }
      ]
    }
  ]
}
```

**✓ Se tiver:** Dados estão sendo retornados corretamente
**✗ Se não tiver:** 
- API não mapeando installments
- Verificar `/pages/api/orders/list.ts`

---

## ✅ PASSO 4: Gerar QR Code (Parcela 1)

### 4.1 Ir para página de pagamento
```
URL: http://localhost:3000/payment/[order-id]
OU clique em "Pagar" no pedido
```

### 4.2 Esperar carregar
```
Deve mostrar seção de pagamento com:
- Valor da Parcela 1
- QR Code
- Código PIX
```

### 4.3 Verificar QR Code
```
✓ QR Code deve estar visível
✓ Deve ser um quadrado com padrão preto e branco
✓ Código PIX deve estar na forma: 00020.1263...

Se vir "QR code indisponível":
- QR não foi gerado no banco de dados
- Verificar logs de `/api/payments/create`
- Pode ser credenciais Mercado Pago inválidas
```

---

## ✅ PASSO 5: Simular Pagamento Parcela 1

### 5.1 Copiar ID do Pedido
```
URL mostra: /payment/[AQUI_ESTÁ_O_ID]
Exemplo: /payment/696fdafa47cc7cb99a129f1f
Copie: 696fdafa47cc7cb99a129f1f
```

### 5.2 Abrir Terminal
```
Terminal (Ctrl+` no VS Code)
cd /workspaces/ShopInitial
```

### 5.3 Executar Webhook de Teste
```bash
curl -X POST http://localhost:3000/api/payments/trigger-webhook-test \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "696fdafa47cc7cb99a129f1f",
    "installmentNumber": 1
  }'
```

### 5.4 Verificar Resposta
```
Deve retornar JSON com:
{
  "order": {
    "id": "...",
    "status": "...",
    "paymentStatus": "...",
    "installments": [
      {
        "installmentNumber": 1,
        "status": "PAID",  // ← Mudou de PENDING!
        "paidAt": "2024-..."
      },
      {
        "installmentNumber": 2,
        "status": "PAYMENT_CREATED",  // ← Criada!
        "mpQrCodeBase64": "iVBOR..."
      }
    ]
  }
}
```

**✓ Se tiver:**
- Parcela 1 agora está PAID
- Parcela 2 agora está PAYMENT_CREATED
- QR code foi gerado para Parcela 2

**✗ Se não tiver:**
- Verificar logs do server
- Verificar banco de dados diretamente

---

## ✅ PASSO 6: Verificar Mudanças na UI

### 6.1 Voltar para `/orders`
```
URL: http://localhost:3000/orders
Ctrl+R para recarregar (ou esperar 30s pelo polling)
```

### 6.2 Procurar Pedido
```
Procure por ID do pedido
Verifique seção "Parcelas"

Deve mostrar:
┌─────────────────────────────┐
│ Parcela 1/2                 │
│ R$ 50,00                    │
│ [Paga] ✓ VERDE              │
└─────────────────────────────┘
┌─────────────────────────────┐
│ Parcela 2/2                 │
│ R$ 50,00                    │
│ [Pendente] AZUL             │
└─────────────────────────────┘
```

**✓ Se vir assim:** UI está atualizando corretamente
**✗ Se não atualizar:**
- Fazer Ctrl+R (full refresh)
- Verificar console para erros
- Pode ser cache do browser

---

## ✅ PASSO 7: Verificar Detalhes da Parcela 2

### 7.1 Ir para Detalhes do Pedido
```
URL: http://localhost:3000/order-status/[order-id]
OU clique em "Visualizar Detalhes"
```

### 7.2 Procurar Seção "Parcelas PIX"
```
Deve mostrar:

┌────────────────────────────────────────┐
│ Parcela 1/2              [PAGA ✓]     │
│ Valor: R$ 50,00                       │
│ ✓ Paga em 15/01/2024 10:30:45        │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ Parcela 2/2          [PENDENTE]        │
│ Valor: R$ 50,00                       │
│ Vence em: 15/01/2024 11:50:45        │
│                                        │
│ Código PIX para pagar:                │
│ ┌──────────────┐  00020.1263...      │
│ │ [QR Code]    │  [Copiar]           │
│ │              │                      │
│ └──────────────┘                      │
└────────────────────────────────────────┘
```

### 7.3 Testar Copiar Código PIX
```
Clique no código PIX (ou em "Copiar")
Deve mostrar toast "Código PIX copiado!"
Ctrl+V em um notepad para verificar que copiou
```

**✓ Se funcionar:**
- UI renderizando corretamente
- Código PIX copiável

**✗ Se não funcionar:**
- Verificar console para erros
- Pode ser restrição de HTTPS (clipboard)

---

## ✅ PASSO 8: Simular Pagamento Parcela 2

### 8.1 Executar Webhook para Parcela 2
```bash
curl -X POST http://localhost:3000/api/payments/trigger-webhook-test \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "696fdafa47cc7cb99a129f1f",
    "installmentNumber": 2
  }'
```

### 8.2 Verificar Resposta
```
Deve retornar JSON com:
{
  "order": {
    "id": "...",
    "status": "IN_PROCESS",  // ← Status mudou!
    "paymentStatus": "COMPLETED",  // ← Pago!
    "installments": [
      {
        "installmentNumber": 1,
        "status": "PAID"
      },
      {
        "installmentNumber": 2,
        "status": "PAID",  // ← Mudou!
        "paidAt": "2024-..."
      }
    ]
  }
}
```

---

## ✅ PASSO 9: Verificar Conclusão

### 9.1 Voltar para `/order-status/[id]`
```
Ctrl+R para recarregar (ou esperar 30s)
```

### 9.2 Verificar Ambas Parcelas Pagas
```
┌────────────────────────────────────────┐
│ Parcela 1/2              [PAGA ✓]     │
│ Valor: R$ 50,00                       │
│ ✓ Paga em 15/01/2024 10:30:45        │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ Parcela 2/2              [PAGA ✓]     │
│ Valor: R$ 50,00                       │
│ ✓ Paga em 15/01/2024 11:30:45        │
└────────────────────────────────────────┘
```

### 9.3 Verificar Status do Pedido
```
Deve mostrar:
Status: Em Processamento (ou Concluído)
Pagamento: Pago ✓
```

**✓ Se tudo estiver assim:** ✅ TUDO FUNCIONANDO PERFEITAMENTE!

---

## ❌ Troubleshooting

### Problema: Parcelas não aparecem na lista
```
1. Verificar console (F12) → aba Console
   Procurar por erros vermelhos
   
2. Verificar Network (F12) → aba Network
   GET /api/orders/list responde corretamente?
   Response tem "installments"?
   
3. Fazer full refresh: Ctrl+Shift+R
   
4. Verificar banco de dados
   Pedido tem registros em PaymentInstallment?
```

### Problema: QR Code não renderiza
```
1. Verificar se mpQrCodeBase64 tem valor
   Network → GET /api/orders/[id] → Response
   Procurar por "mpQrCodeBase64"
   
2. Se vazio: QR não foi gerado
   POST /api/payments/create funcionou?
   Mercado Pago credentials válidas?
   
3. Verificar logs do server:
   POST /api/payments/create
   Procurar por erros
```

### Problema: Status não atualiza após webhook
```
1. Verificar resposta do webhook de teste
   Mostrou status PAID?
   
2. Fazer Ctrl+Shift+R (full refresh)
   Polling a cada 30s pode não atualizar de imediato
   
3. Verificar banco de dados
   MongoDB Compass
   Collection: PaymentInstallment
   Verificar if status mudou
```

### Problema: Código PIX não copia
```
1. Verificar se está em HTTPS ou localhost
   Clipboard API só funciona nesses contextos
   
2. Abrir DevTools → Console
   Procurar por erros ao clicar
   
3. Verificar se mpQrCodeUrl tem valor
   Não é string vazia?
```

---

## 📊 Resumo do Fluxo Esperado

```
┌─────────────────────────────────────────┐
│ 1. Pedido Criado                        │
│    Inst1: PENDING, Inst2: PENDING       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 2. Cliente Clica "Pagar"                │
│    POST /api/payments/create            │
│    Inst1: PAYMENT_CREATED + QR Code     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 3. Cliente Escaneía QR / Copia PIX      │
│    Realiza pagamento no banco           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 4. Webhook Inst1 (Manual ou Real)       │
│    Inst1: PAID + paidAt                 │
│    Inst2: PAYMENT_CREATED + QR Code     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 5. Cliente Escaneía QR / Copia PIX      │
│    Realiza pagamento no banco           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 6. Webhook Inst2 (Manual ou Real)       │
│    Inst1: PAID                          │
│    Inst2: PAID + paidAt                 │
│    Order: PAID, IN_PROCESS             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 7. Cliente Vê Pedido 100% Pago          │
│    Ambas parcelas com ✓ PAGA            │
│    Pronto para entrega                  │
└─────────────────────────────────────────┘
```

---

## 🎓 Comandos Úteis

### Ver Banco de Dados
```bash
# Abrir MongoDB Compass
# Conectar a mongodb://localhost:27017
# Database: shop
# Collection: Order e PaymentInstallment
```

### Ver Logs do Server
```bash
# Terminal onde Next.js está rodando
# Procurar por:
# - "[Orders List API]"
# - "[Orders API]"
# - "[Payments Create]"
# - "[Webhook Test]"
```

### Recriar Dados
```bash
# Se algo der errado, limpar banco:
# npm run clean:database

# Recriar com dados de teste:
# npm run seed
```

---

## ✅ CHECKLIST FINAL

- [ ] Passo 1: Componente renderiza na lista
- [ ] Passo 2: Novo pedido criado com sucesso
- [ ] Passo 3: API retorna installments
- [ ] Passo 4: QR Code gerado para Inst1
- [ ] Passo 5: Webhook Inst1 funciona
- [ ] Passo 6: UI atualiza status Inst1→PAID
- [ ] Passo 7: Detalhes mostram Parcela 2 com QR
- [ ] Passo 8: Webhook Inst2 funciona
- [ ] Passo 9: Ambas parcelas mostram PAGA

**Se marcar TODOS:** 🎉 Sistema 100% funcional!

---

## 📞 Suporte

Se algo não funcionar:
1. Verificar console do browser (F12 → Console)
2. Verificar logs do server
3. Verificar banco de dados (MongoDB Compass)
4. Verificar se endpoints existem em `/pages/api/orders/`
5. Verificar se componentes existem em `/components/orders/`
