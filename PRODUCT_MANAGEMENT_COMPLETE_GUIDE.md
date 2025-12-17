# 📚 Guia Completo - Edição e Gerenciamento de Produtos

## 🎯 Visão Geral

Agora você pode **criar e editar produtos** na mesma página com suporte completo a:
- ✅ Múltiplas imagens por produto (até 10)
- ✅ Ordenação de imagens
- ✅ Definição de imagem principal (primeira a aparecer)
- ✅ Busca de produtos existentes para editar
- ✅ Gerenciamento completo de dados

---

## 🚀 Como Usar

### Acessar a Página

1. Autentique como **ADMIN**
2. Vá para: `/create-product`
3. Clique na **aba "Criar Novo Produto"** ou **"Editar Produto"**

---

## 📝 Criando um Novo Produto

### 1. Aba "Criar Novo Produto"

Na primeira aba, você vê um formulário vazio para criar do zero:

```
┌─────────────────────────────────────────────┐
│ Criar Novo Produto │ Editar Produto        │
└─────────────────────────────────────────────┘
```

### 2. Preencher Informações Básicas

- **Nome*** - Nome do produto (obrigatório)
- **Descrição** - Descrição detalhada
- **SKU** - Código único do produto

### 3. Preço e Estoque

- **Preço*** - Valor em R$ (deve ser > 0)
- **Estoque*** - Quantidade disponível (≥ 0)

### 4. Categorização

- **Categoria** - Selecione uma categoria
- **Marca** - Selecione uma marca

### 5. Gerenciar Imagens

#### Upload de Imagens

1. Clique na área tracejada ou arraste imagens
2. Máximo: **10 imagens** por produto
3. Formatos aceitos: PNG, JPG, GIF, WebP
4. Tamanho máximo: **5MB** por imagem

#### Grid de Imagens

Cada imagem mostra:
- **Número** (#1, #2, etc) - Ordem na grid
- **Setas de Movimento** - Reordenar imagens
- **Botão X** - Remover imagem
- **Campo de Descrição** - Alt text da imagem

```
┌─────────────────────────────────────────────┐
│  Gerenciar Imagens                          │
│                                             │
│  Clique para selecionar a imagem principal  │
│  Selecione a Imagem Principal ⭐            │
│                                             │
│  ┌──────┐  ┌──────┐  ┌──────┐            │
│  │ ⭐#1 │  │  #2  │  │  #3  │            │
│  │      │  │      │  │      │            │
│  └──────┘  └──────┘  └──────┘            │
│                                             │
└─────────────────────────────────────────────┘
```

### 6. Salvar Produto

Clique em **"Salvar Produto"**

✅ Se sucesso:
- Toast verde: "Produto criado com sucesso!"
- Redirecionamento para `/products`

❌ Se erro:
- Toast vermelho com mensagem de erro
- Formulário permanece preenchido para correção

---

## ✏️ Editando um Produto Existente

### 1. Aba "Editar Produto"

Clique na segunda aba:

```
┌─────────────────────────────────────────────┐
│ Criar Novo Produto │ Editar Produto        │
└─────────────────────────────────────────────┘
```

### 2. Buscar Produto

1. Digite o nome do produto ou SKU
2. A busca é **em tempo real**
3. Vê até **10 resultados** por vez

```
Buscar Produto *
[Digite aqui para buscar...]

João Encontrado(s):
┌─────────────────────────────────┐
│ Camiseta Azul                   │
│ SKU: CAM-001                    │
│ R$ 49.90                        │
│ 2 imagens | Estoque: 15         │
└─────────────────────────────────┘
```

### 3. Selecionar Produto

1. Clique no produto para carregar
2. Todas as informações pré-preenchem
3. Imagens já aparecem na grid

### 4. Editar Dados

Todos os campos podem ser modificados:
- ✏️ Nome
- ✏️ Descrição
- ✏️ Preço
- ✏️ Estoque
- ✏️ Categoria/Marca

### 5. Gerenciar Imagens (Edição)

#### Adicionar Novas Imagens

1. Clique na área de upload
2. Novas imagens são adicionadas ao final
3. Ordene conforme necessário

#### Reordenar Imagens

1. Passe o mouse sobre a imagem
2. Clique seta ⬆️ para mover para cima
3. Clique seta ⬇️ para mover para baixo
4. Ordene todas conforme desejado

#### Selecionar Imagem Principal

1. Veja todas as imagens na grid
2. Clique sobre a imagem que quer como **principal**
3. Aparece estrela ⭐ indicando seleção
4. A primeira imagem é sempre exibida no produto

```
Selecione a Imagem Principal ⭐

┌──────┐  ┌──────┐  ┌──────┐
│ ⭐#1 │  │  #2  │  │  #3  │  ← Clique em #2 para
│      │  │      │  │      │     trocar a principal
└──────┘  └──────┘  └──────┘
```

#### Remover Imagens

1. Passe mouse sobre imagem
2. Clique X para remover
3. Imagem é deletada (não pode recuperar)

### 6. Salvar Alterações

Clique em **"Salvar Alterações"**

✅ Se sucesso:
- Toast verde: "Produto atualizado com sucesso!"
- Redirecionamento para `/products`

❌ Se erro:
- Toast vermelho com mensagem
- Dados permanecem para correção

### 7. Voltar para Busca

Clique em **"Voltar"** para:
- Limpar formulário
- Voltar para tela de busca
- Selecionar outro produto

---

## 📊 Exemplos de Casos de Uso

### Caso 1: Produto com Múltiplas Fotos

**Cenário**: Produto com 5 fotos diferentes de ângulos

1. Aba "Editar" → Busca → Seleciona
2. Remove imagens ruins
3. Reordena para: frente, trás, detalhe, lado, uso
4. Define frente como principal
5. Salva

### Caso 2: Atualizar Preço e Estoque

**Cenário**: Produto teve grande venda, precisa atualizar

1. Aba "Editar" → Busca → Seleciona
2. Altera apenas Preço e Estoque
3. Mantém tudo do jeito que estava
4. Salva

### Caso 3: Produto Não Aparece no Catálogo

**Cenário**: Produto criado mas sem imagem principal

1. Aba "Editar" → Busca → Seleciona
2. Adiciona/seleciona nova imagem
3. Define como principal
4. Salva

### Caso 4: Duplicar Produto com Modificações

**Cenário**: Produto existente, criar variante com cor diferente

1. Aba "Editar" → Busca → Seleciona
2. Clica "Voltar"
3. Aba "Criar Novo" → Copia informações
4. Muda apenas cor/SKU
5. Upload imagens novas
6. Salva

---

## 🎨 Ordem das Imagens e Catálogo

### Como Funciona

- **Primeira Imagem (#1)** = Imagem que aparece no catálogo/listagem
- **Outras Imagens** = Aparecem na página de detalhes do produto
- **Ordem de Upload** = Mantida automaticamente
- **Reordenação** = Use as setas para mudar

### Boas Práticas

1. **Imagem 1** = Foto frontal do produto
2. **Imagem 2** = Foto traseira ou lateral
3. **Imagem 3** = Detalhe importante (textura, logo)
4. **Imagem 4+** = Produto em uso, embalagem, etc

---

## ⚙️ Dados Técnicos

### Limites

| Campo | Limite | Obrigatório |
|-------|--------|------------|
| Nome | 255 char | ✅ Sim |
| Descrição | ∞ | ❌ Não |
| Preço | Decimal | ✅ Sim (> 0) |
| Estoque | Inteiro | ✅ Sim (≥ 0) |
| SKU | Único | ❌ Não |
| Imagens | 10 máx | ✅ Sim (≥ 1) |
| Categoria | 1 | ❌ Não |
| Marca | 1 | ❌ Não |

### Formatos de Imagem Aceitos

- ✅ JPEG (.jpg, .jpeg)
- ✅ PNG (.png)
- ✅ GIF (.gif)
- ✅ WebP (.webp)

### Tamanhos

- Máximo por arquivo: **5MB**
- Máximo total: **50MB** (10 × 5MB)
- Recomendado: **800×800px** (quadrado)

---

## 🔒 Permissões

Apenas usuários com role **ADMIN** podem:
- ✅ Criar produtos
- ✅ Editar produtos
- ✅ Deletar imagens
- ✅ Gerenciar categorias/marcas

Usuários normais podem ver, mas não podem acessar `/create-product`

---

## 🐛 Troubleshooting

### Problema: Imagem não aparece depois de salvar

**Solução:**
1. Verifique se foi enviada via ImgBB
2. Aguarde a conclusão do upload (veja spinner)
3. Tente fazer upload novamente

### Problema: Busca não encontra produto

**Solução:**
1. Verifique se o nome está correto
2. Tente buscar por SKU
3. Certifique-se que o produto existe

### Problema: Não consigo trocar a imagem principal

**Solução:**
1. Clique diretamente na imagem na grid
2. Deve aparecer estrela ⭐
3. Se não aparecer, recarregue a página

### Problema: Erro ao salvar "SKU já em uso"

**Solução:**
1. Altere o SKU para um único
2. Ou deixe em branco se não usar

### Problema: Não tenho acesso à página

**Solução:**
1. Verifique se está autenticado como ADMIN
2. Usuários normais não podem acessar
3. Entre em contato com administrador

---

## 📱 Responsividade

A interface se adapta a:
- **Desktop** - Grid 4 colunas
- **Tablet** - Grid 3 colunas
- **Mobile** - Grid 2 colunas

Funcionalidades idênticas em todos os tamanhos.

---

## 💾 Backup de Imagens

Todas as imagens são armazenadas no **ImgBB** (hospedagem externa).

Para backup:
1. Acesse cada produto
2. Salve as URLs das imagens
3. Download local se necessário

---

**Última Atualização**: 17 de Dezembro de 2025  
**Status**: ✅ Pronto para Uso
