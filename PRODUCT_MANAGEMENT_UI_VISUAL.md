# 🎨 INTERFACE VISUAL - SISTEMA DE EDIÇÃO DE PRODUTOS

## 📱 Layout Final

### Página Principal (`/create-product`)

```
┌─────────────────────────────────────────────────────────────────┐
│ Breadcrumb > Gerenciar Produtos                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Gerenciar Produtos                                            │
│  Crie novos produtos ou edite os existentes                    │
│                                                                  │
│  ┌──────────────────────┬──────────────────┐                   │
│  │ ➕ Criar Novo        │ ✏️ Editar        │                   │
│  │    Produto           │    Produto       │                   │
│  └──────────────────────┴──────────────────┘                   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ [CONTEÚDO DA ABA SELECIONADA - VER ABAIXO]             │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Features: Benefits Grid                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📄 ABA 1: Criar Novo Produto

```
┌────────────────────────────────────────────────────────────┐
│                  CRIAR NOVO PRODUTO                        │
├────────────────────────────────────────────────────────────┤
│                                                             │
│ SEÇÃO 1: INFORMAÇÕES BÁSICAS                              │
│ ┌──────────────────────────────────────────────────────┐  │
│ │                                                       │  │
│ │ Nome do Produto *                                    │  │
│ │ [_________________________________]                  │  │
│ │                                                       │  │
│ │ Descrição                                            │  │
│ │ [_________________________________]                  │  │
│ │ [_________________________________]                  │  │
│ │ [_________________________________]                  │  │
│ │ [_________________________________]                  │  │
│ │                                                       │  │
│ │ SKU                                                  │  │
│ │ [_________________________________]                  │  │
│ │                                                       │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                             │
│ SEÇÃO 2: PREÇO E ESTOQUE                                  │
│ ┌──────────────────────────────────────────────────────┐  │
│ │                                                       │  │
│ │ Preço * │ Estoque *                                  │  │
│ │ [_____] │ [_____]                                    │  │
│ │                                                       │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                             │
│ SEÇÃO 3: CATEGORIZAÇÃO                                    │
│ ┌──────────────────────────────────────────────────────┐  │
│ │                                                       │  │
│ │ Categoria │ Marca                                    │  │
│ │ [select ▼] │ [select ▼]                             │  │
│ │                                                       │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                             │
│ SEÇÃO 4: IMAGENS                                          │
│ ┌──────────────────────────────────────────────────────┐  │
│ │                                                       │  │
│ │ Imagens do Produto                                  │  │
│ │                                                       │  │
│ │ ┌──────────────────────────────────────────────┐   │  │
│ │ │  📁 Clique ou arraste as imagens            │   │  │
│ │ │                                              │   │  │
│ │ │  Aceita PNG, JPG, GIF, WebP                │   │  │
│ │ │  Máximo 5MB | Máx 5 imagens (0/5)         │   │  │
│ │ └──────────────────────────────────────────────┘   │  │
│ │                                                       │  │
│ │ Grid de Imagens (2 col mobile, 3 tablet, 4 desktop) │  │
│ │ [###] [###] [###] [###]                            │  │
│ │                                                       │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                             │
│ BOTÕES                                                    │
│ [← Voltar] [💾 Salvar Produto]                          │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## ✏️ ABA 2: Editar Produto

### Tela 1: Busca (Primeira Vez)

```
┌────────────────────────────────────────────────────────────┐
│                  EDITAR PRODUTO                            │
├────────────────────────────────────────────────────────────┤
│                                                             │
│ Selecionar Produto para Editar                           │
│                                                             │
│ Buscar Produto *                                          │
│ [_____________________________________] [🔍 Buscando...] │
│                                                             │
│ 2 resultado(s) encontrado(s):                            │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Camiseta Azul                                        │  │
│ │ SKU: CAM-001                                         │  │
│ │ R$ 49.90                                             │  │
│ │ 2 imagens | Estoque: 15                             │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Camiseta Branca                                      │  │
│ │ SKU: CAM-002                                         │  │
│ │ R$ 49.90                                             │  │
│ │ 3 imagens | Estoque: 22                             │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                             │
└────────────────────────────────────────────────────────────┘

[Clique em um para editar]
```

### Tela 2: Edição (Após Seleção)

```
┌────────────────────────────────────────────────────────────┐
│                  EDITAR PRODUTO                            │
├────────────────────────────────────────────────────────────┤
│                                                             │
│ Editando: Camiseta Azul                           [✕]     │
│                                                             │
│ [+ ou edição automática dos mesmos campos de criar]       │
│                                                             │
│ SEÇÃO DE IMAGENS - ESPECIAL EDIÇÃO                        │
│ ┌──────────────────────────────────────────────────────┐  │
│ │                                                       │  │
│ │ Gerenciar Imagens                                    │  │
│ │                                                       │  │
│ │ [Upload area como na criação]                       │  │
│ │                                                       │  │
│ │ Grid de Imagens com REORDENAÇÃO:                    │  │
│ │                                                       │  │
│ │ ┌────┐ ┌────┐ ┌────┐                               │  │
│ │ │⭐ │ │    │ │    │   ← Clique para mudar         │  │
│ │ │#1 │ │#2 │ │#3 │     principal                  │  │
│ │ │ ↑  │ │ ↑↓  │ │ ↓  │                              │  │
│ │ │ X  │ │ X  │ │ X  │   ← Controles               │  │
│ │ └────┘ └────┘ └────┘                               │  │
│ │ [alt] [alt] [alt]                                  │  │
│ │                                                       │  │
│ │ Selecione a Imagem Principal ⭐                    │  │
│ │ ┌────┐ ┌────┐ ┌────┐                               │  │
│ │ │#1  │ │#2  │ │#3  │ ← Clique para selecionar    │  │
│ │ └────┘ └────┘ └────┘   (mostra estrela quando)    │  │
│ │                                                       │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                             │
│ BOTÕES                                                    │
│ [← Voltar] [💾 Salvar Alterações]                       │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## 🖼️ Grid de Imagens - Detalhado

### Criação (Simples)

```
Cada imagem mostra:

┌─────────────────────┐
│  ┌──────────────┐  │
│  │              │  │  ← Imagem preview
│  │   IMAGEM     │  │
│  │              │  │
│  └──────────────┘  │
│  #1                │  ← Número/ordem
│  [_descrição_]     │  ← Campo alt/descrição
│  [  X  ]           │  ← Botão remover (on hover)
└─────────────────────┘
```

### Edição (Com Controles)

```
Cada imagem mostra:

┌─────────────────────────────┐
│ ⭐ (se for principal)       │  ← Indicador
│  ┌──────────────────────┐  │
│  │                      │  │  ← Imagem preview
│  │     IMAGEM           │  │
│  │  [↑][↓][X]          │  │  ← Controles (on hover)
│  │                      │  │
│  └──────────────────────┘  │
│  #1                         │  ← Número
│  [_descrição_]              │  ← Campo alt
└─────────────────────────────┘
```

### Seleção de Principal

```
Grid de imagens abaixo do upload:

Selecione a Imagem Principal ⭐

Sem seleção:           Com seleção:
┌──────┐               ┌──────┐
│  #1  │               │ ⭐#1  │ ← Estrela aparece
└──────┘               └──────┘
┌──────┐               ┌──────┐
│  #2  │               │  #2  │
└──────┘               └──────┘

Clique em #2:
┌──────┐               ┌──────┐
│  #1  │               │  #1  │ ← Estrela desaparece
└──────┘               └──────┘
┌──────┐               ┌──────┐
│  #2  │       →       │ ⭐#2  │ ← Estrela aparece
└──────┘               └──────┘
```

---

## 🎯 Estados e Feedback

### Toast Notifications

```
SUCESSO - Verde
┌─────────────────────────────────────────┐
│ ✅ Produto criado com sucesso!          │
└─────────────────────────────────────────┘

SUCESSO - Verde
┌─────────────────────────────────────────┐
│ ✅ Produto atualizado com sucesso!      │
└─────────────────────────────────────────┘

ERRO - Vermelho
┌─────────────────────────────────────────┐
│ ❌ Erro ao criar produto                │
└─────────────────────────────────────────┘

INFO - Azul
┌─────────────────────────────────────────┐
│ ℹ️ Imagem removida                       │
└─────────────────────────────────────────┘
```

### Loading States

```
Botão salvando:
[💾 Salvando...]  ← Desabilitado, spinner

Busca em progresso:
[_________________________________] 🔍
Buscando...

Upload em progresso:
[Loading spinner] ← Nas imagens que estão subindo
```

---

## 📱 Responsividade

### Mobile (< 768px)

```
Formulário: Full width
Grid de imagens: 2 colunas
Botões: Empilhados
```

### Tablet (768px - 1024px)

```
Formulário: Margem lateral
Grid de imagens: 3 colunas
Botões: Lado a lado
```

### Desktop (> 1024px)

```
Formulário: Max-width 1200px
Grid de imagens: 4 colunas
Botões: Lado a lado
```

---

## 🎨 Cores e Temas

### Light Mode

```
Fundo: Branco/Cinza claro
Texto: Preto/Cinza escuro
Primária: Azul (palette-primary)
Borda: Cinza claro
Card: Branco
```

### Dark Mode

```
Fundo: Cinza escuro
Texto: Branco/Cinza claro
Primária: Azul (mais claro)
Borda: Cinza escuro
Card: Cinza ligeiramente claro
```

---

## ⌚ Interações Principais

### 1. Hover sobre Imagem

```
Normal:
┌─────────────────┐
│                 │
│    IMAGEM       │
│                 │
└─────────────────┘

Ao passar mouse:
┌─────────────────┐
│  OVERLAY PRETO  │  ← Escurece
│  ↑   ↓   X      │  ← Aparecem controles
└─────────────────┘
```

### 2. Clique em Resultado de Busca

```
Lista:
[Produto 1]  ← Normal

Ao clicar:
[Produto 1]  ← Carrega dados
│
└→ Formulário se preenche automaticamente
└→ Imagens aparecem na grid
└→ Tela muda para modo edição
```

### 3. Reordenação de Imagens

```
Posição inicial:
[#1] [#2] [#3]

Clica seta ↑ em #2:
[#1] [↑] [#3]
      ↑
     #2

Após movimento:
[#2] [#1] [#3]
```

---

## 📊 Flow Completo

```
┌──────────────┐
│  /create-    │
│  product     │
└──────────────┘
       │
       ├─→ ┌──────────────────────┐
       │   │ Criar Novo Produto   │
       │   │ (Aba 1)              │
       │   │ ┌────────────────────┤
       │   │ │ Preenche formulário │
       │   │ │ Upload imagens      │
       │   │ │ Clica Salvar        │
       │   │ └─┬──────────────────┘
       │   │   │
       │   │   └→ POST /products/create
       │   │        │
       │   │        └→ ✅ Sucesso
       │   │           (Redireciona /products)
       │   │
       │   └─→ ❌ Erro (fica na página)
       │
       └─→ ┌──────────────────────┐
           │ Editar Produto       │
           │ (Aba 2)              │
           │ ┌────────────────────┤
           │ │ Busca produto      │
           │ │ Seleciona resultado│
           │ │ Edita dados        │
           │ │ Reordena imagens   │
           │ │ Seleciona principal│
           │ │ Clica Salvar       │
           │ └─┬──────────────────┘
           │   │
           │   └→ PUT /products/{id}
           │        │
           │        └→ ✅ Sucesso
           │           (Redireciona /products)
           │
           └─→ ❌ Erro (fica na página)
```

---

## 🔄 Estados da UI

### Inicial
- Formulário vazio (criar) ou tela de busca (editar)
- Botão salvar habilitado
- Sem imagens

### Preenchendo
- Campos se validam em tempo real
- Botão salvar permanece habilitado
- Imagens aparecem conforme upload

### Salvando
- Botão muda texto e fica desabilitado
- Spinner aparece no botão
- Resto da UI congelada

### Sucesso
- Toast verde aparece
- Redirecionamento em 1.5s
- Página navega para `/products`

### Erro
- Toast vermelho com mensagem
- Formulário permanece preenchido
- Usuário pode corrigir

---

**Design Final:** ✅ Pronto para Desenvolvimento  
**Data:** 17 de Dezembro de 2025  
**Status:** Documentação Visual Completa
