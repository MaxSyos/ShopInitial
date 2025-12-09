# 🎨 Interface Visual - Gerenciamento de Pedidos

## 📱 Tela Principal

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Gerenciar Pedidos                             [Meus Pedidos]   │
│                                                                  │
│  [Todos 15]  [⚠ Aguardando Pagamento 3]  [📦 Aguardando Entrega 8]  [✓ Entregues 4]
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ Pedido  │ Cliente          │ Data       │ Total   │ Pagamento    │
├─────────┼──────────────────┼────────────┼─────────┼──────────────┤
│ #99439  │ João Silva       │ 09/12/2024 │ R$ 499 │ Pago ✓       │
│         │ joao@email.com   │            │        │ Correios 📮  │
│         │                  │            │        │ [Editar]     │
├─────────┼──────────────────┼────────────┼─────────┼──────────────┤
│ #99438  │ Maria Santos     │ 09/12/2024 │ R$ 899 │ Pendente ⚠   │
│         │ maria@email.com  │            │        │ Pendente ⏳   │
│         │                  │            │        │ [Editar]     │
├─────────┼──────────────────┼────────────┼─────────┼──────────────┤
│ #99437  │ Pedro Costa      │ 08/12/2024 │ R$ 299 │ Pago ✓       │
│         │ pedro@email.com  │            │        │ Local ✓      │
│         │                  │            │        │ [Editar]     │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Modal de Edição - Correios

```
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║              Gerenciar Rastreamento                            ║
║                                                                ║
║  Tipo de Entrega:                                              ║
║  ┌──────────────────────────────────────────────┐              ║
║  │ ▼ Correios (com rastreamento)               │              ║
║  └──────────────────────────────────────────────┘              ║
║                                                                ║
║  Código de Rastreamento (Correios):                            ║
║  ┌──────────────────────────────────────────────┐              ║
║  │ AA999999999BR                               │              ║
║  └──────────────────────────────────────────────┘              ║
║                                                                ║
║  ℹ️ O status será atualizado automaticamente via API           ║
║     dos Correios com base no código de rastreamento.          ║
║                                                                ║
║                                                                ║
║  [Cancelar]                               [Salvar]            ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

---

## 🔄 Modal de Edição - Entrega Local

```
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║              Gerenciar Rastreamento                            ║
║                                                                ║
║  Tipo de Entrega:                                              ║
║  ┌──────────────────────────────────────────────┐              ║
║  │ ▼ Entrega Local (sem rastreamento)          │              ║
║  └──────────────────────────────────────────────┘              ║
║                                                                ║
║  ☐ Marcar como Entregue                                        ║
║                                                                ║
║  [Cancelar]                               [Salvar]            ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

---

## ☑️ Modal de Edição - Entrega Local (Confirmada)

```
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║              Gerenciar Rastreamento                            ║
║                                                                ║
║  Tipo de Entrega:                                              ║
║  ┌──────────────────────────────────────────────┐              ║
║  │ ▼ Entrega Local (sem rastreamento)          │              ║
║  └──────────────────────────────────────────────┘              ║
║                                                                ║
║  ☑ Marcar como Entregue                                        ║
║                                                                ║
║  [Cancelar]                               [Salvar]            ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

---

## 👤 Menu do Usuário (ADMIN)

```
┌─────────────────────────────────────┐
│ 👤 Perfil                           │
├─────────────────────────────────────┤
│ 🛍️ Meus Pedidos                    │
├─────────────────────────────────────┤
│ ⊕ Criar Produto        [ADMIN]     │
├─────────────────────────────────────┤
│ 📁 Gerenciar Categorias e Marcas    │
│                        [ADMIN]      │
├─────────────────────────────────────┤
│ 📦 Gerenciar Pedidos   [ADMIN] ⬅️  │
├─────────────────────────────────────┤
│ ♥ Favoritos                         │
├─────────────────────────────────────┤
│ 🚪 Logout                           │
└─────────────────────────────────────┘
```

---

## 🎨 Cores e Estilos

### Badges

#### Status de Pagamento:
- **Pendente ⚠️** `bg-yellow-100 text-yellow-800`
  ```
  ┌──────────────┐
  │ Pendente ⚠️  │
  └──────────────┘
  ```

- **Pago ✓** `bg-green-100 text-green-800`
  ```
  ┌──────────────┐
  │ Pago ✓       │
  └──────────────┘
  ```

#### Status de Entrega:
- **Pendente ⏳** `bg-gray-100 text-gray-800`
  ```
  ┌──────────────┐
  │ Pendente ⏳  │
  └──────────────┘
  ```

- **Correios 📮** `bg-blue-100 text-blue-800`
  ```
  ┌──────────────┐
  │ Correios 📮  │
  └──────────────┘
  ```

- **Local 🚗** `bg-purple-100 text-purple-800`
  ```
  ┌──────────────┐
  │ Local 🚗     │
  └──────────────┘
  ```

- **Entregue ✓** `bg-green-100 text-green-800`
  ```
  ┌──────────────┐
  │ Entregue ✓   │
  └──────────────┘
  ```

### Botões

#### Botão Editar:
```
┌──────────────────────┐
│ ✏️ Editar            │
└──────────────────────┘
bg-blue-100 text-blue-700
hover:opacity-75
```

#### Botão Filtro Ativo:
```
┌──────────────────────┐
│ Todos (15)           │
└──────────────────────┘
bg-palette-primary text-palette-side
```

#### Botão Filtro Inativo:
```
┌──────────────────────┐
│ Aguardando Pag (3)   │
└──────────────────────┘
bg-gray-200 text-gray-800
hover:bg-gray-300
```

---

## 📱 Responsividade

### Desktop (≥1024px)
```
┌──────────────────────────────────────────────────────────────┐
│ Gerenciar Pedidos                                            │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ Pedido│ Cliente  │ Data │ Total │ Pagamento │ Entrega   │  │
│ ├─────────────────────────────────────────────────────────┤  │
│ │ #9943│ João... │ 09/12│ R$ 499│ Pago ✓   │ Correios  │  │
│ └─────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Tablet (768px - 1023px)
```
┌─────────────────────────────────────┐
│ Gerenciar Pedidos                   │
│ ┌─────────────────────────────────┐ │
│ │ Pedido  │ Cliente  │ Total      │ │
│ ├─────────────────────────────────┤ │
│ │ #9943   │ João    │ R$ 499     │ │
│ │ ────────────────────────────────│ │
│ │ Pago ✓  │ Correios│ [Editar]   │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Mobile (<768px)
```
┌──────────────────────┐
│ Gerenciar Pedidos    │
│ ┌──────────────────┐ │
│ │ Pedido: #9943    │ │
│ │ João Silva       │ │
│ │ 09/12/2024       │ │
│ │ R$ 499           │ │
│ │ Pago ✓           │ │
│ │ Correios         │ │
│ │ [Editar] [Mais]  │ │
│ └──────────────────┘ │
└──────────────────────┘
```

---

## 🌙 Dark Mode

### Modal em Dark Mode:
```
╔════════════════════════════════════════════════════════════════╗
║ (Fundo escuro: bg-gray-900)                                    ║
║                                                                ║
║ Gerenciar Rastreamento        (Texto: text-white)             ║
║                                                                ║
║ Tipo de Entrega:              (Labels: text-gray-300)          ║
║ ┌──────────────────────────────────────────────────────┐      ║
║ │ ▼ Correios (com rastreamento)                       │      ║
║ │ (Input: bg-gray-800 border-gray-600)               │      ║
║ └──────────────────────────────────────────────────────┘      ║
║                                                                ║
║ [Cancelar]                            [Salvar]                ║
║ (Botões: dark:bg-gray-800 dark:text-white)                   ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

---

## 🔄 Estados de Interação

### Hover em linha da tabela:
```
┌──────────────────────────────────────────┐
│ #99439 │ João  │ 09/12 │ R$ 499│ Pago   │  ← Fundo levemente alterado
└──────────────────────────────────────────┘
  hover:bg-palette-fill/50
```

### Hover em botão Editar:
```
┌──────────────────┐
│ ✏️ Editar        │  ← Opacidade reduzida
└──────────────────┘
  hover:opacity-75
```

### Hover em link do menu:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Gerenciar Pedidos  ← Cor primária
━━━━━━━━━━━━━━━━━━━━━━━━━━━
  hover:text-palette-primary
```

---

## 📊 Informações em Tooltip (ao hover)

```
Pedido #99439
└─ Criado: 09/12/2024 às 10:30
└─ Cliente: João Silva (joao@email.com)
└─ Itens: 1 produto
└─ Total: R$ 499.90
```

---

## ⌨️ Atalhos

| Ação | Resultado |
|------|-----------|
| Click "Editar" | Modal abre com dados do pedido |
| ESC | Modal fecha (Cancelar) |
| Tab | Navega entre campos |
| Enter | Salva (se tudo validado) |

---

## 🔔 Notificações Toast

### Sucesso:
```
┌─────────────────────────────────────┐
│ ✓ Pedido atualizado com sucesso!   │
└─────────────────────────────────────┘
  bg-green-500 text-white
  Auto-hide em 3 segundos
```

### Erro:
```
┌─────────────────────────────────────┐
│ ✗ Erro ao carregar pedidos          │
└─────────────────────────────────────┘
  bg-red-500 text-white
  Requer click para fechar
```

---

## 🔃 Fluxo de Estados

```
INICIAL
  ├─ loading = true
  ├─ orders = []
  └─ editingOrder = null
      ↓
CARREGADO
  ├─ loading = false
  ├─ orders = [...]
  └─ editingOrder = null
      ↓
EDITANDO (Click "Editar")
  ├─ loading = false
  ├─ orders = [...]
  └─ editingOrder = {
       id, trackingCode, deliveryMethod, isDelivered
     }
  └─ Modal aparece
      ↓
SALVANDO (Click "Salvar")
  ├─ API Call em progresso
  └─ Modal fecha
      ├─ Sucesso
      │  ├─ Toast sucesso
      │  ├─ orders recarregado
      │  └─ Volta a CARREGADO
      │
      └─ Erro
         ├─ Toast erro
         ├─ Modal reabre
         └─ Volta a EDITANDO
```

---

## 🎯 Foco (Keyboard Navigation)

```
Tab na página:
1. Botão "Meus Pedidos"
2. [Todos]
3. [Aguardando Pagamento]
4. [Aguardando Entrega]
5. [Entregues]
6. [Editar] - Botão 1 da tabela
7. [Editar] - Botão 2 da tabela
...

Focus color: ring-2 ring-palette-primary
```

---

## 🏁 Loading State

```
Enquanto loading = true:

┌──────────────────────────────────────┐
│                                      │
│      ⟳ Carregando...               │
│                                      │
│   (Spinner animado)                 │
│                                      │
└──────────────────────────────────────┘
```

---

## 📊 Exemplo Completo - Fluxo Visual

```
1. MENU
   ┌─────────────────────────────┐
   │ 📦 Gerenciar Pedidos        │
   └─────────────────────────────┘
           ↓ Click

2. LOADING
   ┌─────────────────────────────┐
   │      ⟳ Carregando...       │
   └─────────────────────────────┘
           ↓ Pronto

3. TABELA CARREGADA
   ┌─────────────────────────────────┐
   │ [Filtros com contagens]         │
   │ ┌───────────────────────────┐   │
   │ │ Pedido│ Cliente│ Status  │   │
   │ ├───────────────────────────┤   │
   │ │ #9943 │ João   │ [Editar]│   │
   │ └───────────────────────────┘   │
   └─────────────────────────────────┘
           ↓ Click [Editar]

4. MODAL ABRE
   ╔─────────────────────────────╗
   ║ Gerenciar Rastreamento      ║
   ║ [Tipo Entrega Dropdown]     ║
   ║ [Campo Código ou Checkbox]  ║
   ║ [Cancelar] [Salvar]         ║
   ╚─────────────────────────────╝
           ↓ Click [Salvar]

5. SALVANDO
   ╔─────────────────────────────╗
   ║ 💾 Salvando...              ║
   ╚─────────────────────────────╝
           ↓ Sucesso

6. NOTIFICAÇÃO
   ┌─────────────────────────────┐
   │ ✓ Sucesso!                  │
   └─────────────────────────────┘
           ↓ Auto-close

7. VOLTAR À TABELA
   ┌─────────────────────────────────┐
   │ Tabela atualizada com novo      │
   │ status de entrega               │
   └─────────────────────────────────┘
```

---

**UI/UX Completa e Pronta! 🎨✨**
