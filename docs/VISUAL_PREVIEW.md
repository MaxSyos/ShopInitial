# Visual Preview - Sistema de Faixas de Frete

## 📱 Interface do Admin - Gerenciador de Fretes

### Estado: Visualizando Tabelas Cadastradas

```
┌─────────────────────────────────────────────────────────────────┐
│  Gerenciar Valor de Envio                                       │
│                                    [+ Adicionar Nova Tabela] ▶️  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Até     │ Dimensões  │ Peso │ SEDEX     │ PAC       │  Ações    │
├─────────────────────────────────────────────────────────────────┤
│ 10 peç. │ 13×22×30cm │ 1.8kg│ R$ 105.00 │ R$ 55.00  │ Edt | Del │
│ 15 peç. │ 13×22×30cm │ 2.3kg│ R$ 130.00 │ R$ 67.50  │ Edt | Del │
│ 20 peç. │ 28×28×36cm │ 3.0kg│ R$ 165.00 │ R$ 85.00  │ Edt | Del │
│ 30 peç. │ 28×28×36cm │ 3.5kg│ R$ 190.00 │ R$ 97.50  │ Edt | Del │
│ 40 peç. │ 40×40×40cm │ 4.5kg│ R$ 240.00 │ R$122.50  │ Edt | Del │
└─────────────────────────────────────────────────────────────────┘
```

---

## ➕ Formulário: Adicionar Nova Faixa

```
┌────────────────────────────────────────────────────────┐
│  Adicionar Nova Tabela de Frete                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Quantidade Até (peças) *        Altura (cm) *        │
│  [15________________]            [13_______]          │
│                                                        │
│  Largura (cm) *                  Comprimento (cm) *   │
│  [22_______]                     [30________]         │
│                                                        │
│  Peso (kg) *                                          │
│  [2.3______________]             ◄─ NOVO CAMPO       │
│                                                        │
├────────────────────────────────────────────────────────┤
│  📍 Calcular Valor de Envio via Correios              │
│                                                        │
│  CEP Padrão Fixo: 39400-115 (não editável)           │
│                                                        │
│  [Calcular Frete via Correios ▶️]                     │
│                                                        │
│  Valor SEDEX (R$)               Valor PAC (R$)       │
│  [130.00 (auto)_]               [67.50 (auto)_]      │
│  ▲ Preenchido automaticamente                         │
│                                                        │
├────────────────────────────────────────────────────────┤
│                    [Cancelar]  [Criar Tabela ▶️]      │
└────────────────────────────────────────────────────────┘
```

---

## ✏️ Formulário: Editar Faixa Existente

```
┌────────────────────────────────────────────────────────┐
│  Editar Tabela de Frete                               │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Quantidade Até (peças) *        Altura (cm) *        │
│  [15________________]            [13_______]          │
│                                                        │
│  Largura (cm) *                  Comprimento (cm) *   │
│  [22_______]                     [30________]         │
│                                                        │
│  Peso (kg) *                                          │
│  [2.5______________]  ◄─ EDITADO de 2.3              │
│                                                        │
├────────────────────────────────────────────────────────┤
│  📍 Calcular Valor de Envio via Correios              │
│                                                        │
│  [Calcular Frete via Correios ▶️]                     │
│                                                        │
│  Valor SEDEX (R$)               Valor PAC (R$)       │
│  [140.00 (auto)_]               [72.50 (auto)_]      │
│  ▲ Atualizado: (2.5×50)+15=140 ; (2.5×25)+10=72.50  │
│                                                        │
├────────────────────────────────────────────────────────┤
│                    [Cancelar]  [Atualizar ▶️]         │
└────────────────────────────────────────────────────────┘
```

---

## 📋 Página /orders - Visualizando Fretes

```
┌─────────────────────────────────────────────────────────────┐
│  Meus Pedidos                                               │
│  Acompanhe o status de seus pedidos                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Pedido #A1B2C3D4                 5 itens            │   │
│  │ Data: 15/01/2026                                    │   │
│  │                                                     │   │
│  │ Produtos:                  Status:       Frete:     │   │
│  │ • Camiseta Azul x2         ✅ Em Proc. │ SEDEX: ✅   │   │
│  │ • Calça Jeans x2           (Pago)      │ R$105.00   │   │
│  │ • Meia Branca x1           ──────────  │ PAC:       │   │
│  │                                        │ R$55.00    │   │
│  │                          Total:        │            │   │
│  │                          R$125.00 ✅   │ [Detalhes]│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Pedido #B2C3D4E5                12 itens           │   │
│  │ Data: 10/01/2026                                    │   │
│  │                                                     │   │
│  │ Produtos:                  Status:       Frete:     │   │
│  │ • Vestido Vermelho x4      ✅ Entreg.   │ Frete na  │   │
│  │ • Blusa Preta x5           (Pago)      │ zona      │   │
│  │ • Shorts x3                ──────────  │ local     │   │
│  │                                        │           │   │
│  │                          Total:        │ CEP:      │   │
│  │                          R$350.00 ✅   │ 39400-115 │   │
│  │                                        │ [Detalhes]│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Pedido #C3D4E5F6                18 itens           │   │
│  │ Data: 05/01/2026                                    │   │
│  │                                                     │   │
│  │ Produtos:                  Status:       Frete:     │   │
│  │ • Jaqueta Preta x8         ⏳ Proc.     │ SEDEX:    │   │
│  │ • Gorro Azul x10           (Pendente)   │ R$165.00  │   │
│  │                            ──────────  │ PAC:       │   │
│  │                                        │ R$85.00    │   │
│  │                          Total:        │            │   │
│  │                          R$600.00 ❌   │ [Detalhes]│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Legenda:
✅ = Pago/Entregue
❌ = Não Pago
⏳ = Aguardando
```

---

## 🔍 Coluna "Frete" - Detalhes

### Caso 1: Frete Normal (Fora zona restrita)
```
┌─────────────────┐
│ Frete:          │
├─────────────────┤
│ SEDEX:          │
│ R$105.00        │
│                 │
│ PAC:            │
│ R$55.00         │
└─────────────────┘
```

### Caso 2: Zona Restrita (CEP 39400-000 a 39409-999)
```
┌─────────────────┐
│ Frete:          │
├─────────────────┤
│ Frete na zona   │
│ local           │
│                 │
│ (sem valores)   │
└─────────────────┘
```

### Caso 3: Erro de Cálculo
```
┌─────────────────┐
│ Frete:          │
├─────────────────┤
│ ❌ Erro ao      │
│ calcular        │
└─────────────────┘
```

---

## 📊 Comparação: Antes vs Depois

### ANTES (Sistema Antigo - Cancelado)

```
Tabela SEM peso:
┌──────┬──────────────┬────────┬────────┐
│ Qtd  │ Dimensões    │ SEDEX  │ PAC    │
├──────┬──────────────┬────────┬────────┤
│ 10   │ 7×16×19 cm   │ ?      │ ?      │
│ 15   │ 7×16×19 cm   │ ?      │ ?      │
│ 20   │ 28×28×36 cm  │ ?      │ ?      │
└──────┴──────────────┴────────┴────────┘

Cálculo:
- Volume calculado do tamanho da caixa
- Peso estimado (volume / 6000)
- Problema: Não preciso, calcula errado
```

### DEPOIS (Sistema Novo - Implementado)

```
Tabela COM peso:
┌────────┬──────────────┬────────┬────────┬────────┐
│ Até    │ Dimensões    │ Peso   │ SEDEX  │ PAC    │
├────────┼──────────────┼────────┼────────┼────────┤
│ 10     │ 13×22×30 cm  │ 1.8kg  │ 105.00 │ 55.00  │
│ 15     │ 13×22×30 cm  │ 2.3kg  │ 130.00 │ 67.50  │
│ 20     │ 28×28×36 cm  │ 3.0kg  │ 165.00 │ 85.00  │
└────────┴──────────────┴────────┴────────┴────────┘

Cálculo:
- Admin define o peso exatamente
- SEDEX = (peso × 50) + 15
- PAC = (peso × 25) + 10
- Resultado: Preciso e exato
```

---

## 🎨 Menu Admin - Link Adicionado

```
┌──────────────────────┐
│  👤 Minha Conta      │
├──────────────────────┤
│ ✎ Editar Perfil     │
│ 🎯 Meus Pedidos     │
│ ❤️  Favoritos        │
├──────────────────────┤
│ [ADMIN]              │
│ 📦 Gerenciar Prod.  │
│ 📂 Gerenciar Cont.  │
│ 📋 Gerenciar Pedidos│
│ 🚚 Gerenciar Fretes │ ◄─ NOVO
│ 👥 Gerenciar Users  │
├──────────────────────┤
│ 🚪 Sair             │
└──────────────────────┘
```

---

## 📈 Fluxo de Dados

### Criação de Faixa
```
Admin Form
    ↓
    │ (Quantidade, Altura, Largura, Comprimento, Peso)
    ↓
API: POST /admin/calculate-shipping
    ↓
    │ Calcula SEDEX e PAC
    │ SEDEX = (peso × 50) + 15
    │ PAC = (peso × 25) + 10
    ↓
Retorna valores
    ↓
Admin confirma "Criar"
    ↓
Prisma.ShippingRate.create()
    ↓
Banco de Dados (MongoDB)
```

### Cálculo de Frete em Pedido
```
Usuário acessa /orders
    ↓
Para cada pedido:
    │ - Total de itens
    │ - CEP de destino
    ↓
API: POST /orders/calculate-shipping
    ↓
    │ Valida CEP (8 dígitos)
    │ Verifica se está em zona restrita
    ↓
Se zona restrita (39400-000 a 39409-999):
    │ return null
    ↓
Senão:
    │ Busca faixa: quantityUpTo >= quantity (ASC)
    │ Pega o peso da faixa
    │ Calcula SEDEX/PAC usando peso da faixa
    ↓
Retorna valores
    ↓
Frontend renderiza:
    │ SEDEX: R$X.XX
    │ PAC: R$Y.YY
    ↓
Usuário vê no card do pedido
```

---

## 📱 Responsividade

### Desktop (>768px)
```
┌────────────────────────────────────────────────────────────────┐
│ Até │ Dimensões │ Peso │ SEDEX  │ PAC    │ Ações         │
│ 10  │ 13×22×30  │ 1.8  │ 105.00 │ 55.00  │ [Edt] [Del]   │
└────────────────────────────────────────────────────────────────┘
```

### Mobile (<768px)
```
┌──────────────────────────┐
│ Até 10 peças             │
├──────────────────────────┤
│ Dimensões: 13×22×30 cm   │
│ Peso: 1.8kg              │
│ SEDEX: R$ 105.00         │
│ PAC: R$ 55.00            │
├──────────────────────────┤
│ [Editar]  [Deletar]      │
└──────────────────────────┘
```

---

## 🎬 Animações e Feedback

### Loading
```
┌─────────────────────┐
│  ⏳ Calculando...    │
│  (spinner giratório) │
└─────────────────────┘
```

### Sucesso
```
┌─────────────────────────────────────────┐
│ ✅ Frete calculado com sucesso!         │
│ Faixa criada: até 15 peças              │
└─────────────────────────────────────────┘
(desaparece em 3 segundos)
```

### Erro
```
┌─────────────────────────────────────────┐
│ ❌ Erro ao calcular frete               │
│ Preencha as dimensões e peso            │
└─────────────────────────────────────────┘
(permanece até fechar)
```

---

## 🎯 Validações Visuais

### Campo Obrigatório Vazio
```
Quantidade Até (peças) *
[_________________________]
^ (borda vermelha ou mensagem de erro)
"Preencha todos os campos obrigatórios"
```

### Cálculo Sem Preenchimento
```
[Calcular Frete via Correios]
(desabilitado/opacity reduzida se faltam campos)
```

### Salvamento Sem Cálculo
```
[Criar Tabela de Frete]
(desabilitado se SEDEX/PAC vazios)
"Calcule o frete antes de salvar"
```

---

Este é o visual completo e funcional do novo sistema de faixas de frete! 🎉
