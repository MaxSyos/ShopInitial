# 🧪 Teste: Atualização em Tempo Real

## Como Testar as Mudanças

### Setup Inicial
```bash
# Terminal 1: Servidor
cd /workspaces/ShopInitial
npm run dev

# Aguardar até: ▲ Next.js 14.x.x
# Local: http://localhost:3000
```

---

## Teste 1: Verificar Polling Normal (5 segundos)

### Passos:
1. Abrir http://localhost:3000/order-status/[id]
2. Abrir DevTools (F12)
3. Ir para aba **Network**
4. Filtrar por `/orders/` (GET requests)

### Esperado:
```
✅ Requisição a cada 5 segundos
   GET /api/orders/[id] → 200 OK
   GET /api/orders/[id] → 200 OK (5s depois)
   GET /api/orders/[id] → 200 OK (10s depois)
```

### Antes:
❌ Requisição a cada 30 segundos

---

## Teste 2: Polling Agressivo ao Clicar "Pagar Agora"

### Passos:
1. Abrir http://localhost:3000/order-status/[id]
2. Abrir DevTools (F12 → Console + Network)
3. Clicar em "🎫 Pagar Agora" da Parcela 1

### Esperado na Console:
```
[Order Status] Gerando QR para parcela 1 do pedido [id]
[Order Status] QR gerado com sucesso para parcela 1
[Order Status] Fazendo polling agressivo (1s) para capturar pagamentos...
[Order Status] Refrescando dados após geração de QR
```

### Esperado no Network:
```
✅ Requisições a CADA 1 SEGUNDO por 60 segundos
   GET /api/orders/[id] → 200 OK
   GET /api/orders/[id] → 200 OK (1s depois)
   GET /api/orders/[id] → 200 OK (2s depois)
   ... muito mais rápido que antes!
```

---

## Teste 3: Atualização em Tempo Real do Pagamento

### Cenário Completo:
```
1. Abrir http://localhost:3000/order-status/[id]
2. DevTools → Network (filtrar GET /api/orders/)
3. Clicar "Pagar Agora" Parcela 1
4. Aguardar QR aparecer
5. Em outra aba/janela: Fazer pagamento (simular webhook)
6. Voltar para a página do pedido
```

### Teste com Webhook de Teste:
```bash
# Terminal 2: Simular pagamento
curl -X POST http://localhost:3000/api/payments/trigger-webhook-test \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "696fdafa47cc7cb99a129f1f",
    "installmentNumber": 1
  }'
```

### Esperado:
```
Antes (sem mudanças):
❌ Página mostra "Não Iniciada"
❌ Espera 30 segundos
❌ Finalmente atualiza para "Paga"

Depois (com mudanças):
✅ Página mostra "Não Iniciada"
✅ Webhook marca como "Paga" no banco
✅ Após 1-2 segundos, página atualiza AUTOMATICAMENTE
✅ Você vê "Paga ✓" imediatamente
```

---

## Teste 4: Aba em Segundo Plano

### Passos:
1. Abrir http://localhost:3000/order-status/[id]
2. Abrir DevTools (F12 → Console)
3. Ir para outra aba (Google, etc)
4. Voltar para a aba do pedido em < 5 segundos

### Esperado:
```
Console mostra:
[Order Status] Página voltou ao foco, atualizando dados...

Network:
✅ Requisição imediata: GET /api/orders/[id]
(sem esperar 5 segundos)
```

---

## Métricas de Performance

### Teste: Tempo até Atualização Aparecer

#### Antes (30s polling):
```
Webhook recebe pagamento: 0s
Banco atualiza: 0.1s
Página se atualiza: 30s
━━━━━━━━━━━━━━━━━━━━
Total: ~30 segundos ❌
```

#### Depois (5s + agressivo 1s):
```
Cliente clica "Pagar Agora": 0s
Ativa polling agressivo: 0s
Webhook recebe pagamento: < 2s
Banco atualiza: 0.1s
Página se atualiza: 1-2s (próxima requisição)
━━━━━━━━━━━━━━━━━━━━
Total: ~1-2 segundos ✅
```

---

## Verificar Logs

### No Terminal (npm run dev):
```
✅ Procurar por logs:
   [Order Status] Fazendo polling agressivo
   [Order Status] Refrescando dados
   [Order Status] Página voltou ao foco
```

### No Browser Console (F12):
```javascript
// Copiar e colar no console para DEBUG:
const logs = window.__orderStatusLogs || [];
console.table(logs);
```

---

## Checklist de Teste

- [ ] **Normal Polling:** 5s intervalo (não 30s)
- [ ] **Aba com Foco:** Atualiza imediatamente
- [ ] **Após Pagar:** Polling 1s por 60s
- [ ] **Pagamento em Tempo Real:** < 3s para atualizar
- [ ] **Console:** Logs aparecendo corretamente
- [ ] **Network:** Requisições no intervalo esperado
- [ ] **UI Responsiva:** Não trava durante polling
- [ ] **Estado PAID:** Marcado corretamente após webhook

**Se TODOS passarem:** ✅ Atualização em tempo real funciona!

---

## Troubleshooting

### Problema: Página não atualiza
```
1. Verificar console (F12) - tem erros?
2. Verificar Network - requisições chegando?
3. Verificar banco de dados - status foi atualizado?
4. Limpar cache: Ctrl+Shift+Delete
5. Fazer refresh: Ctrl+Shift+R
```

### Problema: Polling muito agressivo (uso alto de CPU)
```
Normal: Não é esperado, polling só é agressivo por 60s
Solução: Esperar 60 segundos que volta ao normal (5s)
```

### Problema: Logs não aparecem
```
1. DevTools aberto? F12
2. Aba Console ativa?
3. Filtro "All" selecionado?
4. Procurar por "[Order Status]"
```

---

## Resumo das Mudanças

| Aspecto | Antes | Depois | Melhoria |
|--------|-------|--------|----------|
| **Polling Normal** | 30s | 5s | 6x mais rápido |
| **Após Pagamento** | 30s | 1s | 30x mais rápido |
| **Aba em Foco** | 30s de espera | Imediato | Instantâneo |
| **Tempo Total** | ~30s | ~1-2s | 15x melhor |

---

**Qualidade:** ⭐⭐⭐⭐⭐ Significativa melhoria na UX
