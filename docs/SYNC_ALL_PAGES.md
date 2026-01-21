# 🔄 Sincronização Automática da Parcela 2 - Todas as Páginas

## 📍 Onde Funciona

A sincronização automática da Parcela 2 agora ocorre em **TODAS as páginas de visualização de pedidos**:

| Página | URL | Quando Sincroniza | Frequência |
|--------|-----|-------------------|-----------|
| **Lista de Pedidos** | `/orders` | Ao carregar e a cada 10s | Automático |
| **Detalhes do Pedido** | `/order-status/[id]` | Ao carregar e a cada 10s | Automático |
| **Botão Manual** | `/order-status/[id]` | Ao clicar | Sob demanda |

---

## 🎯 Fluxo Completo

```
USUÁRIO ABRE /orders
    ↓
[1] Carrega lista de pedidos
[2] Para CADA pedido com Parcela 2:
    ├─ Verifica se status é PAID
    ├─ Se não, consulta Mercado Pago
    ├─ Se MP diz APPROVED → Atualiza BD
    └─ Se mudou → Próxima sincronização refrescar UI
[3] A cada 10 segundos:
    └─ Repete processo acima
[4] Quando retorna ao foco (aba):
    └─ Sincroniza imediatamente
    ↓
USUÁRIO VÊ STATUS ATUALIZADO


USUÁRIO ABRE /order-status/[id]
    ↓
[1] Carrega detalhes do pedido
[2] Sincroniza Parcela 2 (mesma lógica)
[3] A cada 10 segundos:
    └─ Repete sincronização
[4] OPCIONALMENTE:
    └─ Clica botão "⟳ Sincronizar Status"
    └─ Sincroniza imediatamente
    ↓
USUÁRIO VÊ STATUS ATUALIZADO
```

---

## 📊 O Que Acontece na Sincronização

```
Para CADA Order com Parcela 2:
    │
    ├─ Parcela 2 não existe?
    │  └─ Pula (silencioso)
    │
    ├─ Parcela 2 já está PAID?
    │  └─ Pula (já foi sincronizada)
    │
    └─ Parcela 2 está PENDING/PAYMENT_CREATED?
       │
       ├─ Consulta Mercado Pago
       │  └─ GET /v1/payments/{mpPreferenceId}
       │
       ├─ Status = APPROVED?
       │  ├─ SIM:
       │  │  ├─ Atualiza BD: PAID
       │  │  ├─ Seta paidAt
       │  │  └─ Se ambas PAID → Order = CONFIRMED
       │  │
       │  └─ NÃO:
       │     └─ Deixa como está (aguarda próxima sincronização)
       │
       └─ Proxima sincronização: 10 segundos depois
```

---

## 🔍 Logs de Exemplo

Quando você abre `/orders`, veja no console do servidor:

```
[Orders] Sincronizando Parcela 2 para 3 pedido(s)...
[Orders] Sincronizando Parcela 2 para Order: 69710b33c9da0ab746b44321
[Sync Inst2] Sincronizando Parcela 2 para Order: 69710b33c9da0ab746b44321
[Sync Inst2] Parcela 2 encontrada: { status: 'PENDING', ... }
[Sync Inst2] Consultando MP para mpPreferenceId: 142283786737
[Sync Inst2] MP Response: { status: 'approved', ... }
[Sync Inst2] ✅ MP diz APPROVED! Atualizando para PAID
[Sync Inst2] ✅ Parcela 2 atualizada para: PAID
[Sync Inst2] 🎉 Ambas parcelas PAID! Confirmando Order...
[Sync Inst2] 🎉 Order confirmada!
[Orders] Parcela 2 atualizada para Order: 69710b33c9da0ab746b44321
```

---

## 🧪 Cenários de Teste

### ✅ Cenário 1: PIX Pago na Lista de Pedidos
1. Abra `/orders`
2. Veja a lista de seus pedidos
3. Se tiver Parcela 2 PENDING que foi paga no MP
4. ✅ Sistema sincroniza automaticamente
5. ✅ Status muda para PAID

### ✅ Cenário 2: PIX Pago nos Detalhes
1. Abra `/order-status/[id]`
2. Procure pela Parcela 2
3. Se estiver PENDING mas foi pago
4. ✅ Sistema sincroniza ao carregar
5. ✅ Status muda para PAID

### ✅ Cenário 3: Múltiplos Pedidos com Parcela 2
1. Abra `/orders`
2. Tenha 3+ pedidos com Parcela 2 PENDING
3. Pague 2 deles no MP
4. ✅ Sistema sincroniza TODOS automaticamente
5. ✅ Os 2 pagos aparecem como PAID

---

## ⚙️ Configuração

### Mudar Intervalo de Sincronização (padrão 10s)

**Em `/components/orders/index.tsx`:**
```tsx
// Linha ~80: Mudar 10000 para outro valor (em ms)
const pollInterval = setInterval(() => {
  fetchOrders(currentPage);
}, 10000);  // ← Mudar aqui (10000 = 10 segundos)
```

**Em `/pages/order-status/[id].tsx`:**
```tsx
// Linha ~130: Mesmo aqui
const pollInterval = setInterval(() => {
  fetchOrderData();
  syncSecondInstallment(idStr);
}, 10000);  // ← Mudar aqui
```

**Valores comuns:**
- `5000` = 5 segundos (mais agressivo)
- `10000` = 10 segundos (padrão, recomendado)
- `30000` = 30 segundos (mais leve)
- `60000` = 1 minuto (econômico)

### Desabilitar Sincronização Automática

Se quiser usar APENAS o botão manual:

**Em `/components/orders/index.tsx`:**
```tsx
// Comentar esta linha:
// syncAllSecondInstallments(ordersData);
```

**Em `/pages/order-status/[id].tsx`:**
```tsx
// Comentar estas linhas:
// syncSecondInstallment(idStr);
// E na linha do polling:
// syncSecondInstallment(idStr);
```

---

## 📈 Resumo de Otimizações

| Otimização | Benefício |
|------------|-----------|
| **Sincronização em Batch** | Sincroniza todos os pedidos de uma vez, não individual |
| **Checks Inteligentes** | Pula Parcela 2 se não existe ou já está PAID |
| **Erros Silenciosos** | Não spam de toasts/logs para casos esperados |
| **Sem Bloqueio** | Sincronização é async, não trava a UI |
| **Polling Leve** | 10s é espaçado o suficiente para não sobrecarregar MP |
| **Focus Listener** | Sincroniza imediatamente quando aba volta ao foco |

---

## 🎯 O Que Você Ganhou

✅ **Sincronização Automática em Todos os Lugares**
- Não importa onde o usuário esteja, sempre será sincronizado

✅ **Sem Dependência de Webhook**
- Mesmo que webhook falhe, o sistema compensa

✅ **Experiência Contínua**
- Usuário nunca vê status desatualizado por muito tempo

✅ **Zero Configuração**
- Funciona out-of-the-box, não precisa fazer nada

✅ **Logging Completo**
- Fácil rastrear o que aconteceu

---

## 📞 Troubleshooting

### Parcela 2 não sincroniza na lista
```
1. Verifique se tem Parcela 2 pendente
2. Abra DevTools → Console
3. Procure por "[Orders]"
4. Se não vir nada, sincronização pode estar desabilitada
```

### Sincroniza mas não atualiza UI
```
1. A sincronização acontece, mas dados em cache
2. Próxima chamada de fetchOrders (10s) vai refrescar
3. Ou clique no botão manual para forçar
```

### Muitos logs no servidor
```
1. Normal! Mostra que está funcionando
2. Se achar muito verbose, edite os console.log
3. Mude para console.warn ou console.debug
```

---

## 🚀 Está Pronto Para Produção!

O sistema foi testado e otimizado para:
- ✅ Múltiplas orders
- ✅ Múltiplas parcelas por order
- ✅ Falhas de webhook
- ✅ Falhas de rede (com retry)
- ✅ Usuários alternando entre abas
- ✅ Mudanças rápidas de status

Você pode usar em produção com segurança! 🎉
