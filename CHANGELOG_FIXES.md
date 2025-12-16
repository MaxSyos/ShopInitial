# Changelog - Correções de Redirecionamento e Performance (Dec 16, 2025)

## Resumo das Alterações

Corrigimos problemas de redirecionamento automático na página de pagamento e otimizamos chamadas desnecessárias à API.

---

## Arquivos Alterados

### 1. `FrontEnd/pages/login.tsx`
**Problema:** Redirecionamento para rotas dinâmicas template (ex: `/payment/[id]`) causava erro de interpolação.

**Solução:**
- Adicionar sanitização no `router.query.redirect` para detectar rotas dinâmicas template
- Fallback para `/` quando a rota contém `[` ou `]`
- Usar `router.asPath` em vez de `router.pathname` para preservar parâmetros reais

**Código:**
```typescript
const rawRedirect = (router.query.redirect as string) || '/';
// Se o redirect vier como uma rota dinâmica template (ex: /payment/[id])
// não tentar interpolar — fallback para raiz
const redirect = rawRedirect.includes('[') || rawRedirect.includes(']') ? '/' : rawRedirect;
router.push(redirect);
```

---

### 2. `FrontEnd/components/auth/PrivateRoute.tsx`
**Problema:** Rota dinâmica sem parâmetros sendo usada como `redirect` causava erro.

**Solução:**
- Usar `router.asPath` em vez de `router.pathname` 
- `asPath` preserva parâmetros reais (ex: `/payment/123`)
- `pathname` é apenas a template (ex: `/payment/[id]`)

**Código:**
```typescript
query: { redirect: router.asPath } // era router.pathname
```

---

### 3. `FrontEnd/pages/api/_utils/auth.ts`
**Problema:** Múltiplas verificações de autenticação por requisição, logs verbosos.

**Solução:**
- Adicionar cache no `req` (`req._cachedUser`) para reuso dentro da mesma requisição
- Controlar logs detalhados via variável de ambiente `DEBUG_AUTH`
- Reduzir noise de logs por padrão

**Código:**
```typescript
if (anyReq._cachedUser) {
  if (process.env.DEBUG_AUTH) console.log('Retornando user em cache');
  return anyReq._cachedUser;
}
// ... verificação
anyReq._cachedUser = user;
return user;
```

---

### 4. `FrontEnd/pages/payment/[id].tsx`
**Problemas:**
- Redirecionamento manual para `/login` (duplicado com `PrivateRoute`)
- `router.reload()` causava loops de redirect
- Verificação de status a cada 5 segundos (muitas chamadas API)
- Sem proteção contra múltiplas requisições simultâneas

**Soluções:**
- Remover redirecionamento manual (deixar `PrivateRoute` fazer)
- Remover `router.reload()` (trocar por atualização localizada)
- Aumentar intervalo de verificação para 15 segundos
- Adicionar `useRef` flags para evitar múltiplas requisições
- Adicionar debounce em `fetchOrderSummary` (5 segundos entre chamadas)

**Código:**
```typescript
const lastFetchOrderRef = React.useRef<number>(0);
const isCheckingPaymentRef = React.useRef<boolean>(false);

// Debounce em fetchOrderSummary
const now = Date.now();
if (now - lastFetchOrderRef.current < 5000) {
  console.log('Pulando fetchOrderSummary — chamada recente');
  return;
}
lastFetchOrderRef.current = now;

// Verificação de status a cada 15s (em vez de 5s)
statusInterval = setInterval(() => {
  checkPaymentStatus();
}, 15000);

// Proteção contra múltiplas verificações simultâneas
const checkPaymentStatus = async () => {
  if (!paymentData?.id || isCheckingPaymentRef.current) return;
  isCheckingPaymentRef.current = true;
  try {
    // ... fazer requisição
  } finally {
    isCheckingPaymentRef.current = false;
  }
};
```

---

### 5. `FrontEnd/pages/payment.tsx`
**Problemas:**
- `router.reload()` causava loops de redirect
- Verificação de status a cada 5 segundos
- Sem proteção contra múltiplas requisições simultâneas

**Soluções:**
- Remover `router.reload()`
- Aumentar intervalo para 15 segundos
- Adicionar `useRef` flag para evitar múltiplas requisições

**Código:** (igual ao `pages/payment/[id].tsx`)

---

## Impacto das Alterações

| Problema | Antes | Depois | Benefício |
|----------|-------|--------|-----------|
| Redirecionamentos infinitos | ✗ Ocorriam | ✓ Corrigidos | Fluxo linear, sem loops |
| Chamadas API desnecessárias | 12/min (5s intervalo) | 4/min (15s intervalo) | 67% menos chamadas |
| Múltiplas requisições simultâneas | ✗ Possível | ✓ Bloqueado | Sem race conditions |
| Logs verbosos | ✗ Sempre ativos | ✓ DEBUG_AUTH only | Menos noise em produção |
| Cache de auth por req | ✗ Sem cache | ✓ Com cache | Menos JWT verifications |

---

## Como Testar Localmente

### 1. Teste de Redirecionamento
```bash
cd FrontEnd
yarn dev
```
- Abra `/payment/123abc` sem estar logado
- Deve ir para `/login?redirect=/payment/123abc`
- Faça login
- Deve retornar para `/payment/123abc` **sem erro de interpolação**

### 2. Teste de Performance
```bash
DEBUG_AUTH=1 yarn dev
```
- Abra DevTools > Network
- Navegue para qualquer página que use `/api/*`
- Verifique que `getUserFromRequest` aparece **uma única vez** por requisição (não múltiplas vezes)

### 3. Teste de Verificação de Pagamento
- Abra `/payment/SEU_ID`
- Aguarde 15 segundos
- Network tab deve mostrar apenas **uma** requisição a `/payments/ID/pix-status` (não múltiplas)

---

## Comandos Git para Upload

```bash
# 1. Verificar alterações
git status

# 2. Adicionar todos os arquivos alterados
git add -A

# 3. Criar commit com mensagem descritiva
git commit -m "fix: corrigir redirecionamento automático e otimizar chamadas API

- Usar router.asPath em PrivateRoute para preservar params dinâmicos
- Sanitizar redirect em login para evitar rotas template inválidas
- Aumentar intervalo de verificação de pagamento de 5s para 15s
- Adicionar debounce em fetchOrderSummary (5s)
- Remover router.reload() para evitar loops
- Adicionar cache de auth no req para reduzir JWT verifications
- Controlar logs com DEBUG_AUTH para reduzir noise"

# 4. Fazer push para branch atual
git push origin $(git rev-parse --abbrev-ref HEAD)

# ou fazer push explícito para 'clothes'
git push origin clothes
```

---

## Verificação Final

Antes de fazer push, verifique:

- [ ] Servidor dev inicia sem erros: `yarn dev`
- [ ] Sem erros de compilação TypeScript
- [ ] Teste fluxo de login → pagamento → retorno funciona
- [ ] Network tab mostra menos chamadas de auth
- [ ] Não há loops de redirect no console

---

## Notas

- As alterações são **backward compatible** (sem breaking changes)
- Logs detalhados ainda disponíveis via `DEBUG_AUTH=1`
- Performance melhora significativamente em conexões lentas
- Comportamento do usuário permanece o mesmo (apenas mais rápido)
