# 🧪 Guia de Teste - Sistema de Gerenciamento de Pedidos

## ✅ Checklist de Testes

### 🔐 Segurança

- [ ] **Teste 1:** Usuário não-ADMIN não consegue acessar `/manage-orders`
  - Esperado: Redirecionado para `/` com mensagem de erro

- [ ] **Teste 2:** Usuário não-ADMIN não consegue chamar API `/api/admin/orders`
  - Esperado: Retorna 403 Forbidden

- [ ] **Teste 3:** Não-autenticado não consegue acessar a página
  - Esperado: Redirecionado para `/login`

### 🎨 Interface

- [ ] **Teste 4:** Página carrega com lista de pedidos
  - Esperado: Tabela com todos os pedidos visível

- [ ] **Teste 5:** Contadores de filtros estão corretos
  - Esperado: Soma de cada categoria corresponde ao total

- [ ] **Teste 6:** Botão "Meus Pedidos" funciona
  - Esperado: Redireciona para `/orders`

- [ ] **Teste 7:** Todos os ícones carregam corretamente
  - Esperado: Ícone de inventário no menu, ícone de edição na tabela

- [ ] **Teste 8:** Dark mode funciona
  - Esperado: Cores adaptadas em modo escuro, texto legível

### 📊 Dados

- [ ] **Teste 9:** Tabela mostra todos os campos corretos
  - Esperado: ID, Cliente (nome+email), Data, Total, Pagamento, Entrega, Ações

- [ ] **Teste 10:** Datas formatadas corretamente em PT-BR
  - Esperado: Formato DD/MM/YYYY

- [ ] **Teste 11:** Valores monetários com 2 casas decimais
  - Esperado: R$ X.XX

### 🔄 Filtros

- [ ] **Teste 12:** Filtro "Todos" mostra todos os pedidos
  - Esperado: Quantidade = total de pedidos

- [ ] **Teste 13:** Filtro "Aguardando Pagamento" mostra apenas PENDING
  - Esperado: Apenas pedidos com paymentStatus === 'PENDING'

- [ ] **Teste 14:** Filtro "Aguardando Entrega" mostra apenas não entregues pagos
  - Esperado: isDelivered === false E paymentStatus === 'PAID'

- [ ] **Teste 15:** Filtro "Entregues" mostra apenas isDelivered === true
  - Esperado: Apenas pedidos com isDelivered === true

- [ ] **Teste 16:** Clicar em filtro muda a cor do botão
  - Esperado: Botão ativo com cor primária

### 🖱️ Modal - Abrir/Fechar

- [ ] **Teste 17:** Clique "Editar" abre o modal
  - Esperado: Modal aparece com sobreposição (overlay)

- [ ] **Teste 18:** Clique "Cancelar" fecha o modal
  - Esperado: Modal desaparece, página volta ao estado anterior

- [ ] **Teste 19:** ESC fecha o modal
  - Esperado: Modal desaparece

- [ ] **Teste 20:** Click fora do modal não o fecha
  - Esperado: Modal permanece aberto

### 🚚 Modal - Tipo Entregas

- [ ] **Teste 21:** Select "Tipo de Entrega" tem 3 opções
  - Esperado: "Selecione", "Correios (com rastreamento)", "Entrega Local"

- [ ] **Teste 22:** Selecionar "PENDING" mostra botão Salvar desabilitado
  - Esperado: Botão cinza e não responsivo

- [ ] **Teste 23:** Selecionar "CORREIOS" mostra campo de código
  - Esperado: Input para "Código de Rastreamento" aparece

- [ ] **Teste 24:** Campo de código aceita texto
  - Esperado: Aceita caracteres alfanuméricos

- [ ] **Teste 25:** Selecionar "LOCAL" mostra checkbox
  - Esperado: Checkbox "Marcar como Entregue" aparece

- [ ] **Teste 26:** Desselecionar "LOCAL" oculta checkbox
  - Esperado: Checkbox desaparece quando troca de tipo

### 💾 Validações

- [ ] **Teste 27:** Não pode salvar sem selecionar tipo
  - Esperado: Botão "Salvar" desabilitado

- [ ] **Teste 28:** Pode salvar com Correios + código preenchido
  - Esperado: Botão "Salvar" habilitado

- [ ] **Teste 29:** Pode salvar com Local sem checkbox
  - Esperado: Botão "Salvar" habilitado mesmo sem marcar

- [ ] **Teste 30:** Pode salvar com Local + checkbox marcado
  - Esperado: Botão "Salvar" habilitado

### 🔌 API - Requisições

- [ ] **Teste 31:** GET /api/admin/orders retorna array
  - Esperado: [{ id, status, user, items, ... }, ...]

- [ ] **Teste 32:** PATCH /api/admin/orders?id=X com Correios salva
  - Esperado: Order atualizado com trackingCode e deliveryMethod

- [ ] **Teste 33:** PATCH /api/admin/orders?id=X com LOCAL e isDelivered salva
  - Esperado: Order atualizado com isDelivered=true e deliveredAt=timestamp

- [ ] **Teste 34:** PATCH sem ID retorna erro 400
  - Esperado: { error: "ID do pedido é obrigatório" }

- [ ] **Teste 35:** PATCH com deliveryMethod inválido retorna erro 400
  - Esperado: { error: "Tipo de entrega inválido" }

### 🔄 Fluxo Completo - Correios

- [ ] **Teste 36:** Fluxo completo Correios
  1. Clica "Editar" em um pedido
  2. Seleciona "Correios"
  3. Insere código: "AA999999999BR"
  4. Clica "Salvar"
  - Esperado: 
     - Toast: "Pedido atualizado com sucesso!"
     - Modal fecha
     - Tabela atualiza
     - Status muda para "Correios"

### 🔄 Fluxo Completo - Local

- [ ] **Teste 37:** Fluxo completo Local sem checkbox
  1. Clica "Editar" em um pedido
  2. Seleciona "Entrega Local"
  3. Clica "Salvar"
  - Esperado:
     - Toast: "Pedido atualizado com sucesso!"
     - Modal fecha
     - Status muda para "Local"
     - isDelivered permanece false

- [ ] **Teste 38:** Fluxo completo Local com checkbox
  1. Clica "Editar" em um pedido
  2. Seleciona "Entrega Local"
  3. Marca checkbox "Marcar como Entregue"
  4. Clica "Salvar"
  - Esperado:
     - Toast: "Pedido atualizado com sucesso!"
     - Modal fecha
     - Tabela atualiza
     - Status muda para "Entregue"
     - Pedido move para aba "Entregues"

### 🎯 Menu

- [ ] **Teste 39:** Item "Gerenciar Pedidos" aparece no menu ADMIN
  - Esperado: Visível apenas para usuários com role === 'ADMIN'

- [ ] **Teste 40:** Item "Gerenciar Pedidos" não aparece para user normal
  - Esperado: Hidden para não-ADMIN

- [ ] **Teste 41:** Clique em "Gerenciar Pedidos" leva à página correta
  - Esperado: Navega para `/manage-orders`

### ⚠️ Erros e Edge Cases

- [ ] **Teste 42:** Página sem pedidos mostra mensagem
  - Esperado: "Nenhum pedido encontrado"

- [ ] **Teste 43:** Filtro sem resultados mostra mensagem
  - Esperado: "Nenhum pedido encontrado"

- [ ] **Teste 44:** Erro na API mostra toast
  - Esperado: Toast vermelho com mensagem de erro

- [ ] **Teste 45:** Reconexão após erro funciona
  - Esperado: Botão "Meus Pedidos" recarrega dados com sucesso

### 📱 Responsividade

- [ ] **Teste 46:** Desktop (≥1024px) - Tabela completa
  - Esperado: Todas as colunas visíveis

- [ ] **Teste 47:** Tablet (768-1023px) - Tabela com scroll
  - Esperado: Scroll horizontal se necessário

- [ ] **Teste 48:** Mobile (<768px) - Layout adaptado
  - Esperado: Informações principais visíveis, scroll conforme necessário

- [ ] **Teste 49:** Modal responsivo em mobile
  - Esperado: Modal ocupa ~90% da tela

- [ ] **Teste 50:** Texto legível em todos os tamanhos
  - Esperado: Font size apropriado para cada breakpoint

### 🌙 Dark Mode

- [ ] **Teste 51:** Página em dark mode tem contraste adequado
  - Esperado: Texto legível em fundo escuro

- [ ] **Teste 52:** Modal em dark mode é legível
  - Esperado: Inputs, labels e buttons visíveis

- [ ] **Teste 53:** Badges de status visíveis em dark mode
  - Esperado: Cores adaptadas (cores mais claras/escuras)

- [ ] **Teste 54:** Ícones visíveis em dark mode
  - Esperado: Contraste adequate

### 🔃 Performance

- [ ] **Teste 55:** Página carrega em <2s
  - Esperado: Loading spinner desaparece rapidamente

- [ ] **Teste 56:** Filtros respondem instantaneamente
  - Esperado: Clique em filtro atualiza tabela imediatamente

- [ ] **Teste 57:** Modal abre sem lag
  - Esperado: Animação suave

- [ ] **Teste 58:** Scroll da tabela é suave
  - Esperado: Sem travamentos

- [ ] **Teste 59:** Não há memory leaks
  - Esperado: DevTools mostra consumo estável de memória

## 🚀 Teste de Stress

- [ ] **Teste 60:** 100+ pedidos na tabela
  - Esperado: Página responsiva, sem travamentos

- [ ] **Teste 61:** Mudanças rápidas de filtro
  - Esperado: Interface responde corretamente

- [ ] **Teste 62:** Múltiplos edits em sequência
  - Esperado: API processa corretamente

## 📋 Dados de Teste

### Cenários de Pedidos Recomendados

```json
{
  "pedidos_teste": [
    {
      "id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "status": "PENDING",
      "paymentStatus": "PENDING",
      "user": { "name": "João Silva", "email": "joao@test.com" },
      "total": 299.90,
      "deliveryMethod": "PENDING"
    },
    {
      "id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "status": "PENDING",
      "paymentStatus": "PAID",
      "user": { "name": "Maria Santos", "email": "maria@test.com" },
      "total": 499.90,
      "deliveryMethod": "PENDING"
    },
    {
      "id": "65a1b2c3d4e5f6g7h8i9j0k3",
      "status": "PENDING",
      "paymentStatus": "PAID",
      "user": { "name": "Pedro Costa", "email": "pedro@test.com" },
      "total": 899.90,
      "deliveryMethod": "CORREIOS",
      "trackingCode": "AA999999999BR",
      "isDelivered": false
    },
    {
      "id": "65a1b2c3d4e5f6g7h8i9j0k4",
      "status": "PENDING",
      "paymentStatus": "PAID",
      "user": { "name": "Ana Lima", "email": "ana@test.com" },
      "total": 199.90,
      "deliveryMethod": "LOCAL",
      "isDelivered": true,
      "deliveredAt": "2024-12-09T15:30:00Z"
    }
  ]
}
```

## 📝 Relatório de Teste

### Template para Documentar Resultados

```
┌────────────────────────────────────────┐
│ TESTE #[Número]                        │
├────────────────────────────────────────┤
│ Descrição: [Teste 1 - ...]            │
│ Status: [✓ PASSOU / ✗ FALHOU]        │
│ Data: [DD/MM/YYYY]                    │
│ Navegador: [Chrome/Firefox/Safari]    │
│ Tester: [Nome]                        │
│                                        │
│ Resultado:                             │
│ [Descrever o que aconteceu]           │
│                                        │
│ Notas:                                 │
│ [Observações adicionais]              │
└────────────────────────────────────────┘
```

## 🔧 Como Executar os Testes

### 1. Setup Inicial
```bash
cd /workspaces/ShopInitial/FrontEnd
npm install
npm run dev
```

### 2. Acessar a Página
```
http://localhost:3000
- Login como ADMIN
- Navegue para "Gerenciar Pedidos"
```

### 3. Executar Testes
```
Siga cada item do checklist acima
Documetre resultados no template
```

### 4. Relatório Final
```
Compile todos os testes
Identifique falhas
Priorize correções
Documente aprendizados
```

## 🎯 Critério de Sucesso

**Todos os 62 testes devem passar para considerar a implementação pronta.**

- ✅ 100% dos testes passando = PRODUÇÃO PRONTA
- ⚠️ 95-99% = CORREÇÕES MENORES NECESSÁRIAS
- ❌ <95% = REVISÃO SIGNIFICATIVA NECESSÁRIA

## 📞 Suporte

Se encontrar problemas:
1. Verifique se você é ADMIN
2. Limpe cache do navegador
3. Verifique console para erros
4. Reinicie o servidor
5. Verifique conexão com banco de dados

---

**Boa sorte nos testes! 🚀**
