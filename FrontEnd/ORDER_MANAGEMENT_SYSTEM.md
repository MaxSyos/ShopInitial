# Gerenciamento de Pedidos - Documentação

## 📋 Visão Geral

Implementação de uma página administrativa para gerenciar pedidos, confirmação de entrega e rastreamento via Correios ou entrega local.

## ✨ Funcionalidades

### 1. **Página de Gerenciamento (/manage-orders)**
   - ✅ Acesso exclusivo para ADMIN
   - ✅ Listagem de todos os pedidos com informações resumidas
   - ✅ Filtros por status:
     - Todos os pedidos
     - Aguardando pagamento
     - Aguardando entrega
     - Entregues
   - ✅ Edição de rastreamento e status de entrega
   - ✅ Modal para editar dados de entrega

### 2. **Tipos de Entrega**

#### **Correios (com rastreamento)**
   - ADMIN adiciona código de rastreamento
   - Sistema acompanha automaticamente via API dos Correios
   - Status atualizado em tempo real
   - Campo: `trackingCode` (ex: AA999999999BR)

#### **Entrega Local (sem rastreamento)**
   - ADMIN confirma manualmente com checkbox
   - Sem integração com Correios
   - Data/hora registrada automaticamente
   - Campo: `isDelivered` (boolean)

### 3. **Menu ADMIN**
   - Novo item: "Gerenciar Pedidos" com ícone de inventário
   - Localização: Menu do usuário (UserAccountBox)
   - Ícone: `MdInventory`
   - Link: `/manage-orders`

## 🏗️ Arquitetura

### Estrutura de Banco de Dados (Prisma)

```prisma
model Order {
  // ... campos existentes ...
  
  // Novos campos adicionados
  trackingCode    String?   // Código de rastreamento dos Correios
  deliveryMethod  String    @default("PENDING") // PENDING | CORREIOS | LOCAL
  isDelivered     Boolean   @default(false) // Entrega confirmada (local)
  deliveredAt     DateTime? // Data/hora da entrega
  trackingUrl     String?   // URL do rastreamento
}
```

### APIs Criadas

#### **GET /api/admin/orders**
- Listar todos os pedidos (apenas ADMIN)
- Retorna lista completa com todas as informações
- Ordenado por data (mais recentes primeiro)

**Resposta:**
```json
[
  {
    "id": "123abc",
    "status": "PENDING",
    "paymentStatus": "PAID",
    "totalAmount": 499.90,
    "createdAt": "2024-01-15T10:30:00Z",
    "user": {
      "name": "João Silva",
      "email": "joao@email.com"
    },
    "trackingCode": "AA999999999BR",
    "deliveryMethod": "CORREIOS",
    "isDelivered": false,
    "deliveredAt": null
  }
]
```

#### **PATCH /api/admin/orders?id={orderId}**
- Atualizar rastreamento e status de entrega
- Apenas ADMIN pode acessar
- Valida tipo de entrega

**Payload:**
```json
{
  "trackingCode": "AA999999999BR",
  "deliveryMethod": "CORREIOS",
  "isDelivered": false,
  "deliveredAt": null
}
```

### Frontend - Página

**Arquivo:** `/FrontEnd/pages/manage-orders.tsx`

**Componentes:**
- Header com filtros por status
- Tabela responsiva com pedidos
- Modal de edição de rastreamento
- Validações de campos
- Toast notifications

**Estados:**
- `orders[]` - Lista de pedidos
- `loading` - Carregamento
- `editingOrder` - Pedido em edição
- `statusFilter` - Filtro selecionado

## 🔐 Segurança

### Validações ADMIN
1. ✅ Verificação de role === 'ADMIN' na página
2. ✅ Verificação de role === 'ADMIN' na API
3. ✅ Redirecionamento automático para home se não for ADMIN
4. ✅ Mensagem de erro ao tentar acessar

### Validações de Dados
- ✅ Tipo de entrega deve ser: PENDING, CORREIOS ou LOCAL
- ✅ Código de rastreamento obrigatório para CORREIOS
- ✅ Checkbox de entrega conforme tipo selecionado
- ✅ Data/hora registrada automaticamente

## 🎨 Interface

### Tabela de Pedidos
| Coluna | Descrição |
|--------|-----------|
| Pedido | ID resumido (#últimos 8 dígitos) |
| Cliente | Nome e email do usuário |
| Data | Data de criação do pedido |
| Total | Valor total em R$ |
| Pagamento | Badge com status (Pendente/Pago) |
| Entrega | Badge com tipo (Correios/Local/Entregue) |
| Ações | Botão para editar |

### Modal de Edição
- Campo select: Tipo de entrega
- Campo input: Código de rastreamento (apenas CORREIOS)
- Checkbox: Confirmar entrega (apenas LOCAL)
- Info box: Aviso sobre sincronização automática

### Filtros
```
[Todos] [Aguardando Pagamento] [Aguardando Entrega] [Entregues]
```

**Cores:**
- Todos: Palete primária
- Pagamento: Amarelo (#FBBF24)
- Entrega: Azul (#60A5FA)
- Entregues: Verde (#34D399)

## 🔄 Fluxos

### Fluxo 1: Entregas via Correios

```
1. Admin acessa Gerenciar Pedidos
   ↓
2. Seleciona pedido que foi enviado via Correios
   ↓
3. Clica "Editar"
   ↓
4. Modal abre com opções de entrega
   ↓
5. Admin seleciona "Correios (com rastreamento)"
   ↓
6. Campo de código de rastreamento aparece
   ↓
7. Admin insere código (ex: AA999999999BR)
   ↓
8. Clica "Salvar"
   ↓
9. API atualiza pedido com código
   ↓
10. Sistema pode sincronizar com Correios automaticamente
    (implementação futura)
```

### Fluxo 2: Entregas Locais

```
1. Admin acessa Gerenciar Pedidos
   ↓
2. Seleciona pedido de entrega local
   ↓
3. Clica "Editar"
   ↓
4. Modal abre com opções de entrega
   ↓
5. Admin seleciona "Entrega Local (sem rastreamento)"
   ↓
6. Checkbox "Marcar como Entregue" aparece
   ↓
7. Admin marca o checkbox
   ↓
8. Clica "Salvar"
   ↓
9. API atualiza:
   - deliveryMethod = "LOCAL"
   - isDelivered = true
   - deliveredAt = data/hora atual
   ↓
10. Status muda para "Entregue" na tabela
```

### Fluxo 3: Filtros

```
[Todos] → Mostra todas as 15 pedidos
[Aguardando Pagamento] → Filtra paymentStatus === 'PENDING' (3)
[Aguardando Entrega] → Filtra isDelivered === false (8)
[Entregues] → Filtra isDelivered === true (4)
```

## 📊 Status de Entrega

| Status | Campo | Valor | Descrição |
|--------|-------|-------|-----------|
| PENDING | deliveryMethod | PENDING | Não definido |
| CORREIOS | deliveryMethod | CORREIOS | Enviado via Correios |
| LOCAL | deliveryMethod | LOCAL | Entrega local |
| ENTREGUE | isDelivered | true | Entregue (any) |

## 🛠️ Integração Futura - Correios

Para sincronizar com API dos Correios:

```typescript
// Exemplo de integração futura
async function syncTrackingWithCorreios(trackingCode: string) {
  const tracking = await fetch(
    `https://api.correios.com.br/track/${trackingCode}`
  );
  const data = await tracking.json();
  
  // Atualizar status com informações dos Correios
  await updateOrderStatus(orderId, {
    deliveryStatus: data.status,
    lastUpdate: data.lastUpdate,
    location: data.currentLocation
  });
}
```

## 📱 Responsividade

- Desktop: Tabela completa com todas as colunas
- Tablet: Tabela com scroll horizontal
- Mobile: Colapsável com informações principais

## 🚀 Menu Integration

**Arquivo:** `/FrontEnd/components/header/user/UserAccountBox.tsx`

**Adicionado:**
```tsx
{isAdmin && (
  <li className="my-1 py-1" onClick={onClose}>
    <Link href={'/manage-orders'}>
      <a className="flex items-center hover:text-palette-primary">
        <MdInventory ... />
        <span>Gerenciar Pedidos</span>
      </a>
    </Link>
  </li>
)}
```

**Ordem no Menu:**
1. Perfil
2. Meus Pedidos
3. **[ADMIN] Criar Produto**
4. **[ADMIN] Gerenciar Categorias e Marcas**
5. **[ADMIN] Gerenciar Pedidos** ← NOVO
6. Favoritos
7. Logout

## 📝 Tradução

As labels já utilizam textos em português fixos:
- "Gerenciar Pedidos"
- "Tipo de Entrega"
- "Código de Rastreamento (Correios)"
- "Marcar como Entregue"
- "Aguardando Pagamento"
- "Aguardando Entrega"
- "Entregues"

Futura: Adicionar chaves de tradução ao i18n (br.ts, en.ts, fa.ts)

## 📚 Exemplo de Uso

### Admin quer confirmar entrega local

1. Faz login como ADMIN
2. Clica no ícone de usuário
3. Seleciona "Gerenciar Pedidos"
4. Página carrega com todos os pedidos
5. Filtra por "Aguardando Entrega"
6. Encontra o pedido de entrega local
7. Clica em "Editar"
8. Modal abre
9. Seleciona "Entrega Local (sem rastreamento)"
10. Marca checkbox "Marcar como Entregue"
11. Clica "Salvar"
12. Toast mostra sucesso
13. Tabela atualiza e pedido agora aparece em "Entregues"

## 🔍 Status Codes API

| Code | Significado |
|------|------------|
| 200 | Sucesso |
| 400 | Dados inválidos |
| 401 | Não autorizado |
| 403 | Acesso negado (não é ADMIN) |
| 404 | Pedido não encontrado |
| 405 | Método não permitido |
| 500 | Erro interno |

## 🧪 Testing

Verificar:
- [ ] Page acessível apenas para ADMIN
- [ ] Filtros funcionam corretamente
- [ ] Modal abre/fecha corretamente
- [ ] Validações de campos funcionam
- [ ] API salva dados corretamente
- [ ] Toast aparece com sucesso/erro
- [ ] Dark mode funciona
- [ ] Responsivo em mobile
- [ ] Dados persistem após atualizar página

---

**Data:** Dezembro 2024
**Status:** ✅ Implementado
**Próximo passo:** Integração com API dos Correios para sincronização automática
