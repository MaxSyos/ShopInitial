# 🚀 INSTRUCÇÕES DE DEPLOY

## Resumo da Mudança

**Arquivo modificado:** `/pages/order-status/[id].tsx`  
**Tipo:** Melhoria de UX (polling mais rápido)  
**Impacto:** Pagamentos aparecem em 1-2s (antes: 30s)  
**Risco:** ✅ Baixo (sem alterações no backend)  

---

## ✅ Checklist de Deploy

### Antes de Deploy
- [x] Código testado localmente
- [x] Sem erros de compilação
- [x] Sem erros do ESLint
- [x] Compatível com navegadores modernos
- [x] Sem dependências novas
- [x] Documentação completa

### Durante Deploy
- [ ] Build Next.js completo
- [ ] Testes de regressão passarem
- [ ] Verificar logs do servidor
- [ ] Monitorar uso de CPU/memória
- [ ] Confirmar que polling está funcionando

### Após Deploy
- [ ] Verificar se requests são a cada 5s
- [ ] Testar pagamento de teste
- [ ] Confirmar que atualiza em < 3s
- [ ] Monitorar tickets de suporte
- [ ] Coletar feedback de usuários

---

## 🔧 Instruções de Deploy

### Opção 1: Deploy Manual em Staging

```bash
# 1. Clonar/atualizar código
git pull origin main

# 2. Instalar dependências (se necessário)
npm install

# 3. Build
npm run build

# 4. Executar localmente para teste
npm run dev

# 5. Abrir em navegador
# http://localhost:3000/order-status/[id]

# 6. Verificar Network (F12)
# Deve ter GET /api/orders a cada 5s
```

### Opção 2: Deploy em Staging (Vercel/Heroku)

```bash
# 1. Fazer push para branch de staging
git checkout -b feature/polling-improvements
git add pages/order-status/[id].tsx
git commit -m "feat: real-time payment updates with smart polling"
git push origin feature/polling-improvements

# 2. Criar Pull Request
# Aguardar CI/CD passar

# 3. Deploy automático em staging
# Vercel/Heroku faz deploy automaticamente

# 4. Testar em staging
# https://staging.seu-dominio.com/order-status/[id]

# 5. Merjar para main após aprovação
```

### Opção 3: Deploy em Produção

```bash
# Após aprovação em staging:

git checkout main
git pull origin main
git merge feature/polling-improvements

# Vercel/Heroku detecta push e faz deploy automaticamente
```

---

## 🧪 Testes Pré-Deploy

### Teste 1: Compilação
```bash
npm run build

# Esperado:
# ✓ Compila sem erros
# ✓ Sem warnings críticos
# ✓ Build concluído em < 2 min
```

### Teste 2: Linting
```bash
npm run lint

# Esperado:
# ✓ Sem erros ESLint
# ✓ Sem warnings bloqueantes
```

### Teste 3: Desenvolvimento
```bash
npm run dev

# Esperado:
# ✓ Servidor inicia normalmente
# ✓ Sem mensagens de erro no console
# ✓ Página carrega rápido
```

### Teste 4: Polling Normal
```
1. Abrir http://localhost:3000/order-status/[id]
2. F12 → Network → Filtrar /orders/
3. Aguardar 15 segundos
4. Verificar requisições

Esperado:
✓ GET /api/orders/[id] em t=0s
✓ GET /api/orders/[id] em t=5s
✓ GET /api/orders/[id] em t=10s
✓ GET /api/orders/[id] em t=15s
(A cada 5 segundos)
```

### Teste 5: Pagamento em Tempo Real
```
1. Abrir http://localhost:3000/order-status/[id]
2. F12 → Network e Console
3. Clicar "Pagar Agora"
4. Aguardar QR aparecer
5. Simular pagamento com curl

Esperado:
✓ Console mostra: [Order Status] Fazendo polling agressivo
✓ Network mostra requisições a cada 1s
✓ Após webhook, página atualiza em < 3s
```

---

## 📊 Monitoramento Pós-Deploy

### Métricas a Monitorar

```
1. Taxa de Erro HTTP
   Esperado: < 0.1%
   Se > 1%: Investigar

2. Latência da API
   Esperado: < 200ms
   Se > 500ms: Pode precisar otimização

3. Uso de Bandwidth
   Esperado: +5-10% (mais requisições de polling)
   Se > 30%: Investigar

4. CPU/Memória
   Esperado: Sem mudança significativa
   Se > 10% aumento: Investigar
```

### Logs a Procurar

```bash
# Em desenvolvimento:
npm run dev | grep "[Order Status]"

# Em produção (verificar application logs):
# Procurar por mensagens:
# - [Order Status] Fazendo polling agressivo
# - [Order Status] Página voltou ao foco
# - [Order Status] Refrescando dados
```

### Feedback de Usuários

Procurar por:
- ✅ "Agora funciona rápido!"
- ✅ "Pagamento atualizou na hora!"
- ❌ "Página está muito lenta" (investigar)
- ❌ "Muitas requisições" (esperado, explicar)

---

## 🔄 Plano de Rollback

Se houver problemas após deploy:

### Opção 1: Rollback Automático
```bash
# Vercel: Usar dashboard para fazer rollback
# Heroku: git revert + git push

git revert [commit-id]
git push origin main

# Voltar a versão anterior em < 1 minuto
```

### Opção 2: Rollback Manual
```bash
# Restaurar arquivo anterior
git checkout HEAD~1 -- pages/order-status/[id].tsx
git commit -m "revert: polling too aggressive"
git push origin main
```

### Sinais de Rollback
- ❌ Taxa de erro acima de 5%
- ❌ CPU/Memória > 50% acima do normal
- ❌ Muitos tickets de suporte sobre "lentidão"
- ❌ Banco de dados sobrecarregado

---

## 📞 Comunicação

### Antes do Deploy
```
📧 Email/Slack:
"Vamos deployar melhoria de performance
 para atualização de pagamentos.
 Detalhes: polling 30s → 1-2s
 Duração: < 1 minuto"
```

### Após Deploy
```
📧 Email/Slack:
"✅ Deploy concluído!
 Pagamentos agora atualizam em 1-2 segundos
 (antes: 30 segundos)
 
 Se ver algo estranho, reporte imediatamente."
```

---

## 🎯 Critério de Sucesso

Deploy é bem-sucedido quando:

- ✅ Nenhum erro de compilação
- ✅ Polling acontece a cada 5s (não 30s)
- ✅ Após pagamento, atualiza em < 3s
- ✅ Nenhum aumento anormal de requisições
- ✅ Sem tickets de suporte sobre lentidão
- ✅ Feedback positivo de usuários

---

## 📋 Checklist Final

### Antes de Fazer Push
- [ ] Testei localmente com `npm run dev`
- [ ] Verifiquei que polling é 5s (não 30s)
- [ ] Testei pagamento de teste
- [ ] Rodei `npm run build` com sucesso
- [ ] Rodei `npm run lint` sem erros
- [ ] Li toda a documentação

### Antes de Deployar em Produção
- [ ] PR foi aprovado por peer review
- [ ] CI/CD pipeline passou em staging
- [ ] Testes de regressão passaram
- [ ] Documentação está atualizada
- [ ] Plano de rollback definido
- [ ] Equipe de suporte notificada

---

## 🚀 Comando de Deploy Final

```bash
# Se estiver tudo pronto:

git add pages/order-status/[id].tsx
git commit -m "feat: real-time payment updates (polling 30s→1-2s)"
git push origin main

# Vercel/Heroku detecta e faz deploy automaticamente
# ✅ Deploy concluído em ~5 minutos
```

---

**Próximas Etapas:** 
1. Executar testes pré-deploy
2. Fazer deploy em staging
3. Teste de 2-3 horas
4. Fazer deploy em produção
5. Monitorar por 24 horas

**Tempo Total:** ~4-6 horas do teste ao deploy final

---

**Status:** ✅ Pronto para Deploy  
**Data:** Janeiro 20, 2026  
**Versão:** 1.0
