# Atualização da UI para Parcelas PIX (Installments)

## Resumo das Mudanças

Implementado o suporte completo de exibição de parcelas PIX (2 parcelas) na interface do usuário. Os dados já estavam sendo retornados pelos endpoints da API, mas os componentes não estavam renderizando-os corretamente.

## Arquivos Modificados

### 1. `/components/orders/index.tsx` (Página de Lista de Pedidos)

**Mudanças:**
- Adicionada interface `Installment` com campos de parcela
- Atualizada interface `Order` para incluir campo `installments?: Installment[]`
- Adicionada seção de renderização de parcelas no grid de pedidos
- Cada parcela exibe:
  - Número da parcela (1/2 ou 2/2)
  - Valor em R$
  - Status com cores:
    - 🟢 Paga (verde)
    - 🔵 Pendente/Aguardando Pagamento (azul)
    - 🟡 Não Iniciada (amarelo)
    - 🔴 Expirada/Falhou (vermelho)
  - Clique na parcela pendente redireciona para página de detalhes

**Layout:**
- Grid expandido de 6 para 7 colunas para acomodar seção de parcelas
- Seção responsiva em dispositivos móveis

### 2. `/pages/order-status/[id].tsx` (Página de Detalhes do Pedido)

**Mudanças:**
- Adicionada seção "Parcelas PIX" com renderização detalhada
- Para cada parcela, exibe:
  - Número e valor
  - Status com badge colorido
  - **Se PAYMENT_CREATED (pendente):**
    - QR code em base64 renderizado como imagem
    - Código PIX copiável
    - Tempo de expiração para Parcela 1 (30 minutos)
  - **Se PAID (paga):**
    - Data e hora do pagamento
    - Confirmação visual com checkmark ✓

**Funcionalidades:**
- Copiar código PIX ao clicar no código
- Toast de confirmação "Código PIX copiado!"
- Detecção automática de QR code base64 e renderização
- Responsivo em todos os tamanhos de tela

### 3. `/pages/api/orders/list.ts` (Listar Pedidos)

**Mudanças:**
- Adicionado mapeamento de `installments` na resposta
- Campo `installments` agora incluído no JSON retornado
- Estrutura: `installments: o.installments || []`

### 4. `/pages/api/orders/[id].ts` (Detalhes de Ordem)

**Mudanças:**
- Adicionado mapeamento de `installments` na resposta GET
- Adicionado mapeamento de `installments` na resposta PATCH/PUT
- Campo `installments` agora incluído em ambas as respostas

## Fluxo de Dados

```
Banco de Dados (MongoDB + Prisma)
    ↓
API Endpoints (/api/orders/list, /api/orders/[id])
    ↓ (agora com installments mapeado)
Componente React recebe dados
    ↓
- /components/orders/index.tsx renderiza lista com parcelas
- /pages/order-status/[id].tsx renderiza detalhes com QR codes
```

## Como Usar

### Na Página de Pedidos (`/orders`)
1. Ver lista de pedidos
2. Cada pedido mostra seção "Parcelas" com status
3. Clique em uma parcela pendente para ir aos detalhes

### Na Página de Detalhes (`/order-status/[id]`)
1. Ver seção "Parcelas PIX" com todos os detalhes
2. Para parcela pendente:
   - Escanear QR code com celular
   - OU copiar código PIX (clique no código)
   - Colar código em seu banco/app PIX
   - Efetuar pagamento
3. Status atualiza em tempo real com polling a cada 30s

## Testes Recomendados

1. **Criar novo pedido com PIX**
   - Verificar que Parcela 1 aparece com status PAYMENT_CREATED
   - Verificar QR code renderiza corretamente
   - Verificar código PIX é copiável

2. **Executar webhook de teste**
   ```bash
   curl -X POST http://localhost:3000/api/payments/trigger-webhook-test \
     -H "Content-Type: application/json" \
     -d '{"orderId": "[order-id]", "installmentNumber": 1}'
   ```
   - Verificar que Parcela 1 muda para PAID
   - Verificar que Parcela 2 aparece com status PAYMENT_CREATED

3. **Executar segundo webhook**
   ```bash
   curl -X POST http://localhost:3000/api/payments/trigger-webhook-test \
     -H "Content-Type: application/json" \
     -d '{"orderId": "[order-id]", "installmentNumber": 2}'
   ```
   - Verificar que Parcela 2 muda para PAID
   - Verificar que Order status muda para apropriado

## Status de Implementação

✅ **Completo:**
- Schema Prisma com PaymentInstallment
- API endpoints retornando dados
- Componentes renderizando parcelas
- QR codes exibindo corretamente
- Status visual com cores
- Polling automático a cada 30s

⏳ **Próximos Passos:**
- Webhook automático do Mercado Pago (quando MP chamar nossa callback)
- Notificações por email ao confirmar pagamento
- Dashboard de administrador com estatísticas

## Debugging

### Parcelas não aparecem na lista
1. Verificar console do browser para erros
2. Verificar Network tab → `/api/orders/list` resposta tem `installments`?
3. Executar webhook de teste para criar parcelas
4. Fazer refresh (F5) ou esperar polling de 30s

### QR code não renderiza
1. Verificar que `mpQrCodeBase64` tem valor no banco
2. Verificar que campo começa com dados válidos de PNG base64
3. Abrir DevTools → Elements → inspecionar img tag

### Código PIX não copia
1. Verificar console para erros
2. Verificar que `mpQrCodeUrl` tem valor
3. Tentar com HTTPS (clipboard só funciona em HTTPS/localhost)

## Referências

- [Instâncias de Parcelas](/docs/SHIPPING_RATES_SYSTEM.md)
- [Webhook de Pagamentos](/pages/api/payments/webhook.ts)
- [Teste Manual de Webhook](/pages/api/payments/trigger-webhook-test.ts)
