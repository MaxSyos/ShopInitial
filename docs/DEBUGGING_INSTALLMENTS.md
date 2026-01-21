# 🔧 Debugging: Sistema de Parcelas PIX

## Se Algo Não Funcionar, Teste Aqui

---

## 🔍 NÍVEL 1: Verificação Básica

### 1.1 Browser Console
```javascript
// Abrir DevTools: F12 → Console

// Deve haver mensagens de sucesso, não erros vermelhos
// Procure por:
// ✓ "Orders Component] ✅ Orders fetched successfully"
// ❌ Nenhum erro vermelho relacionado a installments
```

### 1.2 Network Tab
```
F12 → Network → (Recarregar página)

Procure por:
GET /api/orders/list → Response deve ter "installments": [...]
GET /api/orders/[id] → Response deve ter "installments": [...]

Se Response for:
❌ "installments": null
❌ "installments": undefined
❌ (campo completamente ausente)

→ PROBLEMA: API não mapeando installments
→ SOLUÇÃO: Verificar `/pages/api/orders/list.ts` e `/pages/api/orders/[id].ts`
```

---

## 🔍 NÍVEL 2: Problema por Sintoma

### SINTOMA: Parcelas Não Aparecem na Lista

```
Quando vejo: Página /orders sem seção "Parcelas"

Passos de Debug:
1. F12 → Console
   Procure por erros vermelhos
   Se houver erro: Ler mensagem e descrever

2. F12 → Network → GET /api/orders/list
   Expandir Response
   Procurar por "installments"
   
   ✅ Se tiver: Problema é no componente
   ❌ Se não tiver: Problema é na API
   
3. Se problema é no COMPONENTE:
   - Verificar `/components/orders/index.tsx`
   - Procurar por: "installments && installments.length > 0"
   - Se não estiver lá: ADICIONAR
   
4. Se problema é na API:
   - Verificar `/pages/api/orders/list.ts`
   - Procurar por: "installments: o.installments"
   - Se não estiver lá: ADICIONAR
```

### SINTOMA: QR Code Não Renderiza

```
Quando vejo: Espaço em branco onde QR deveria estar

Passos de Debug:
1. F12 → Network → GET /api/orders/[id]
   Expandir Response
   Procurar por "mpQrCodeBase64"
   
   ✅ Se tiver valor: IMG tag está renderizando?
   ❌ Se vazio/null: QR não foi gerado no banco
   
2. Se valor existe mas não renderiza:
   F12 → Elements
   Procurar por: <img src="data:image/png;base64,..."
   
   ✅ Se estiver lá: Problema é CSS/display
   ❌ Se não estiver lá: Problema é no JSX
   
3. Se valor é vazio/null:
   - QR foi gerado quando criou o pedido?
   - POST /api/payments/create funcionou?
   - Verificar logs do server:
     console.log de `/api/payments/create`
   - Mercado Pago credentials estão corretos?
```

### SINTOMA: Código PIX Não Copia

```
Quando vejo: Clico no código mas nada copia

Passos de Debug:
1. F12 → Console
   Clique no código
   Procure por mensagens
   
   ✅ Se aparecer "Código PIX copiado!": Toast saiu
      → Mas não copiou? Verificar clipboard API
   
2. Verificar se está em contexto seguro:
   - localhost: ✅ Funciona
   - https://: ✅ Funciona
   - http://: ❌ Não funciona (segurança do browser)
   
3. Se estiver em http://:
   - Teste com curl: navigator.clipboard.writeText()
   - Alguns browsers precisam de popup de permissão
   
4. Se "Código PIX copiado!" não apareceu:
   - F12 → Debugger
   - Click em: .onclick handler
   - Verificar se mpQrCodeUrl tem valor
   - Se vazio: não foi salvo no banco
```

### SINTOMA: Status Não Atualiza Após Webhook

```
Quando vejo: Parcela ainda mostra PENDING depois do webhook

Passos de Debug:
1. Webhoot foi executado com sucesso?
   curl command retornou JSON com "status": "PAID"?
   
   ✅ Se retornou: Banco foi atualizado
      → Problema é polling/cache
   
   ❌ Se retornou erro: Webhook não funcionou
      → Verificar logs do server
   
2. Se webhok funcionou:
   - Fazer Ctrl+Shift+R (hard refresh)
   - Não confiar em F5 (pode usar cache)
   
3. Se ainda não atualizar:
   - F12 → Network → GET /api/orders/list
   - Response realmente tem "status": "PAID"?
   - Se sim: Problema é React state/rerender
   - Se não: Banco não foi atualizado
   
4. Verificar banco diretamente:
   - MongoDB Compass
   - Collection: PaymentInstallment
   - Filter: { "orderId": "seu-id-aqui" }
   - Verificar if "status" field tem "PAID"
   
   ✅ Se tiver PAID: Dados estão certos
      → Frontend não está buscando/renderizando
   
   ❌ Se ainda PAYMENT_CREATED: Webhook não salvou
      → Verificar logs do webhook
```

---

## 🔍 NÍVEL 3: Verificação de Banco de Dados

### MongoDB Compass

```
Conectar:
mongodb://localhost:27017

Database: shop

Collections:
1. Order
   - Procure por seu pedido
   - Verifique campos:
     ✓ id
     ✓ status
     ✓ paymentStatus
     ✓ total

2. PaymentInstallment
   - Procure por installments do seu pedido
   - Verifique campos para cada:
     ✓ installmentNumber (1 ou 2)
     ✓ status (PENDING, PAYMENT_CREATED, PAID)
     ✓ amount
     ✓ mpPreferenceId (ID no Mercado Pago)
     ✓ mpQrCodeBase64 (se gerado)
     ✓ expiresAt (apenas Inst1)
     ✓ paidAt (após pagar)

Exemplo de documento correto:
{
  "_id": ObjectId(...),
  "orderId": ObjectId(...),
  "installmentNumber": 1,
  "status": "PAID",
  "amount": 50,
  "mpPreferenceId": "123456789",
  "mpQrCodeBase64": "iVBORw0KGgoAAAA...",
  "expiresAt": ISODate("2024-01-15T10:50:45Z"),
  "paidAt": ISODate("2024-01-15T10:30:45Z")
}
```

### Verificar Relação Order ↔ PaymentInstallment

```javascript
// No MongoDB Compass, execute:

// 1. Contar quantas parcelas um pedido tem:
db.PaymentInstallment.countDocuments({ 
  orderId: ObjectId("COPIAR_ID_DO_PEDIDO")
})
// Deve retornar: 2

// 2. Ver detalhes das parcelas:
db.PaymentInstallment.find({
  orderId: ObjectId("COPIAR_ID_DO_PEDIDO")
}).pretty()

// 3. Verificar que são 1 e 2:
db.PaymentInstallment.find({
  orderId: ObjectId("COPIAR_ID_DO_PEDIDO")
}, {
  installmentNumber: 1,
  status: 1,
  amount: 1
})

// Deve mostrar:
// { installmentNumber: 1, status: "...", amount: 50 }
// { installmentNumber: 2, status: "...", amount: 50 }
```

---

## 🔍 NÍVEL 4: Verificação de Logs

### Server Console

```bash
# Onde Next.js está rodando:

npm run dev
# ou
yarn dev

Procure por mensagens de debug:

✓ "[Orders Component] ✅ Orders fetched successfully"
  → API chamada funcionou

✓ "[Orders List API] ✅ User authenticated: xyz"
  → User autenticado

✓ "[Payments Create] ✓ QR Code generated: iVBORw0KGgo..."
  → QR foi gerado

✓ "[Payments Webhook Test] ✓ Installment marked as PAID"
  → Webhook simulado funcionou

❌ Procure por linhas vermelhas:
  → Indicam erros
  → Ler mensagem de erro

❌ Se não ver mensagens:
  → Adicionar console.log em:
     - /pages/api/orders/list.ts
     - /components/orders/index.tsx
     - /pages/order-status/[id].tsx
```

### Adicionar Debug Temporário

```typescript
// Em /components/orders/index.tsx, adicione:

console.log('[DEBUG] Fetching orders...');
const response = await api.get('/orders/list', { params: { page, limit: 10 } });
console.log('[DEBUG] Response:', response.data);
console.log('[DEBUG] First order installments:', response.data.orders?.[0]?.installments);

// Agora F12 → Console vai mostrar exatamente o que recebeu
```

---

## 🔍 NÍVEL 5: Verificação de API Endpoints

### Testar `/api/orders/list` Diretamente

```bash
# Terminal:

# 1. Estar logado (get token)
TOKEN="seu_token_aqui"

# 2. Chamar API diretamente:
curl -X GET 'http://localhost:3000/api/orders/list?page=1&limit=10' \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .

# 3. Verificar response:
# ✅ Se tiver "installments": [...], API funciona
# ❌ Se não tiver, endpoint precisa de fix
```

### Testar `/api/orders/[id]` Diretamente

```bash
# Substituir [ID] pelo ID do seu pedido

TOKEN="seu_token_aqui"
ID="696fdafa47cc7cb99a129f1f"

curl -X GET "http://localhost:3000/api/orders/$ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .

# Response deve ter:
# {
#   "order": {
#     ...
#     "installments": [
#       { "id": "...", "installmentNumber": 1, ... },
#       { "id": "...", "installmentNumber": 2, ... }
#     ]
#   }
# }
```

### Testar Webhook Manual

```bash
# Este deve atualizar o banco:

curl -X POST http://localhost:3000/api/payments/trigger-webhook-test \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "696fdafa47cc7cb99a129f1f",
    "installmentNumber": 1
  }' | jq .

# Response esperado:
# {
#   "order": {
#     "installments": [
#       { "installmentNumber": 1, "status": "PAID" },
#       { "installmentNumber": 2, "status": "PAYMENT_CREATED" }
#     ]
#   }
# }
```

---

## 🔧 Checklist de Troubleshooting

### [ ] Passo 1: Console sem Erros
- [ ] Abrir F12 → Console
- [ ] Nenhuma mensagem de erro vermelho?
- [ ] Se houver: Ler e procurar solução específica

### [ ] Passo 2: Network mostra installments
- [ ] F12 → Network → GET /api/orders/list
- [ ] Response tem "installments": [...]?
- [ ] Se não: API precisa de fix

### [ ] Passo 3: Componente renderiza
- [ ] Página mostra seção "Parcelas"?
- [ ] Se não: Componente precisa de fix

### [ ] Passo 4: Banco tem dados
- [ ] MongoDB Compass mostra PaymentInstallment docs?
- [ ] Se não: Quando pedido foi criado?
- [ ] Parcelas foram criadas?

### [ ] Passo 5: Webhook funciona
- [ ] Curl de webhook retorna sucesso?
- [ ] Banco atualiza status para PAID?
- [ ] Se não: Webhook precisa de fix

### [ ] Passo 6: UI atualiza
- [ ] Após webhook, UI mostra novo status?
- [ ] Se não: Fazer hard refresh (Ctrl+Shift+R)

---

## 📝 Template para Reportar Problema

Se nada funcionar, copie e preencha:

```
PROBLEMA REPORTADO:
[Descrever o que não funciona]

PASSOS PARA REPRODUZIR:
1. ...
2. ...
3. ...

EVIDÊNCIA:
[Screenshot ou erro de console]

RESULTADO ESPERADO:
[O que deveria acontecer]

RESULTADO REAL:
[O que está acontecendo]

DEBUG INFO:
- URL: http://localhost:3000/[PÁGINA]
- Browser: [Chrome/Firefox/Safari]
- Network response tem installments? [Sim/Não]
- Banco tem dados? [Sim/Não]
- Console tem erros? [Sim/Não]

ARQUIVOS CHECADOS:
- [ ] /components/orders/index.tsx
- [ ] /pages/order-status/[id].tsx
- [ ] /pages/api/orders/list.ts
- [ ] /pages/api/orders/[id].ts

LOGS DO SERVER:
[Copiar logs relevantes do terminal]
```

---

## 🚀 Atalhos Úteis

### Recarregar Dados
```javascript
// F12 → Console:
// Forçar refetch de orders
localStorage.setItem('refresh-orders', 'true');
location.reload();
```

### Limpar Cache
```bash
# Terminal:
rm -rf .next
npm run build
npm run dev
```

### Ver Banco Sem Compass
```bash
# Terminal:
# Se tiver mongosh instalado:
mongosh

# Depois:
use shop
db.Order.countDocuments()
db.PaymentInstallment.find().pretty()
```

---

## 💡 Dicas Importantes

1. **Sempre fazer Ctrl+Shift+R ao testar**
   - F5 usa cache local
   - Ctrl+Shift+R faz hard refresh

2. **Verificar Authorization Header**
   - Token expirou?
   - F12 → Network → clique em requisição
   - Headers: verificar "Authorization"

3. **Logs são seus amigos**
   - console.log() é ferramenta mais poderosa
   - Adicionar em pontos críticos
   - Ler console do server AND browser

4. **MongoDB é fonte da verdade**
   - Se dados estão no banco: API está certo
   - Se não estão: banco precisa atualizar

5. **Testar com curl antes de UI**
   - curl prova que API funciona
   - Se curl funciona, problema é front
   - Se curl não funciona, problema é backend

---

**Última atualização:** 2024-01-15
**Versão:** 1.0.0
