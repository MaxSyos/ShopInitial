# Gerenciamento de Conteúdo - Documentação de Implementação

## 📋 Resumo

Foi implementado um sistema completo de gerenciamento de conteúdo exclusivo para ADMINs, permitindo gerenciar **banners**, **imagens do carousel**, **ofertas** e **marcas** com persistência de dados no banco de dados MongoDB.

## 🎯 Funcionalidades Implementadas

### 1. **Schema Prisma - Novos Modelos**
Adicionados 3 novos modelos ao `prisma/schema.prisma`:

- **Banner**: Gerencia banners da página inicial
  - `id`: Identificador único
  - `title`: Título do banner (obrigatório)
  - `description`: Descrição opcional
  - `imageUrl`: URL da imagem (obrigatório) - persistida no banco
  - `buttonText`: Texto do botão do banner
  - `linkUrl`: URL para redirecionamento
  - `isActive`: Status de ativação
  - `order`: Ordem de exibição
  - `createdAt/updatedAt`: Timestamps

- **CarouselImage**: Gerencia imagens do carousel/slider
  - Mesma estrutura do Banner
  - Dados persistidos no MongoDB

- **Offer**: Gerencia ofertas/descontos de produtos
  - `id`: Identificador único
  - `productId`: ID do produto (obrigatório)
  - `discount`: Percentual de desconto (0-100)
  - `isActive`: Status da oferta
  - `startDate/endDate`: Datas de vigência da oferta
  - `createdAt/updatedAt`: Timestamps

### 2. **APIs RESTful** 
Criadas 3 novas rotas em `/pages/api/content/`:

#### `/api/content/banners` (GET, POST, PUT, DELETE)
- **GET**: Retorna todos os banners ordenados por `order`
- **POST**: Cria novo banner (requer autenticação ADMIN)
- **PUT**: Atualiza banner existente (requer autenticação ADMIN)
- **DELETE**: Remove banner (requer autenticação ADMIN)

#### `/api/content/carousel` (GET, POST, PUT, DELETE)
- **GET**: Retorna todas as imagens do carousel
- **POST**: Adiciona nova imagem (requer ADMIN)
- **PUT**: Atualiza imagem existente (requer ADMIN)
- **DELETE**: Remove imagem (requer ADMIN)

#### `/api/content/offers` (GET, POST, PUT, DELETE)
- **GET**: Retorna todas as ofertas
- **POST**: Cria nova oferta com validação de desconto (0-100%)
- **PUT**: Atualiza oferta (requer ADMIN)
- **DELETE**: Remove oferta (requer ADMIN)

**Autenticação**: Todas as operações de escrita verificam o token JWT e validam se o usuário tem role `ADMIN`

### 3. **Página Admin - `/pages/manage-content.tsx`**
Interface completa para gerenciar conteúdo com 4 abas:

#### **Aba Banners**
- Formulário para criar/editar banners
- Upload de imagem via ImgBB
- Lista de banners existentes com preview
- Botões para editar e deletar
- Controle de ativação

#### **Aba Carousel**
- Formulário para adicionar imagens ao carousel
- Upload de imagem via ImgBB
- Lista de imagens com preview
- Suporte a edição e exclusão
- Ordenação automática

#### **Aba Ofertas**
- Criação/edição de ofertas por ID de produto
- Campos de desconto (%), datas de início/fim
- Validação de desconto entre 0-100%
- Lista de ofertas ativas/inativas
- Gerenciamento completo

#### **Aba Marcas**
- Visualização de todas as marcas cadastradas
- Exibição de logos (se houver)
- Grid responsivo
- Apenas leitura (marcas gerenciadas em página separada)

### 4. **Controle de Acesso**
- Página `/manage-content` protegida por `PrivateRoute` com `requiredRole="ADMIN"`
- Links no menu do usuário aparecem apenas se `userInfo?.role === "ADMIN"`
- Novo ícone "Gerenciar Conteúdo" no menu do usuário (ícone `MdOndemandVideo`)
- Validação no backend de todas as operações de modificação

### 5. **Interface de Usuário**
- Design consistente com o padrão do projeto (Tailwind CSS)
- Responsivo em mobile, tablet e desktop
- Abas para organização do conteúdo
- Modo claro/escuro suportado
- Notificações com `react-toastify`
- Upload de imagens com validação:
  - Tipo de arquivo (apenas imagens)
  - Tamanho máximo (5MB)
  - Preview antes de salvar
  - Integração com ImgBB para armazenamento

### 6. **Internacionalização (i18n)**
Adicionadas strings em 3 idiomas:

- **Português (br.ts)**: Completo com todas as labels
- **English (en.ts)**: Versão em inglês
- **Farsi (fa.ts)**: Versão em persa

Strings adicionadas:
- `manageContent`, `banners`, `carousel`, `offers`, `brands`
- `createNewBanner`, `createNewCarousel`, `createNewOffer`
- `editBanner`, `editCarousel`, `editOffer`
- `existingBanners`, `existingCarouselImages`, `existingOffers`
- Todas as labels de form, validações e mensagens de feedback

### 7. **Persistência de Dados**
Todas as URLs de imagens são armazenadas no MongoDB:
- As imagens são feitas upload para ImgBB (serviço externo)
- As URLs retornadas pelo ImgBB são salvas no banco
- Sem necessidade de alterar autenticação
- Dados persistem e são recuperáveis

## 📁 Arquivos Modificados/Criados

### Criados:
- `/pages/manage-content.tsx` - Página principal de gerenciamento
- `/pages/api/content/banners.ts` - API de banners
- `/pages/api/content/carousel.ts` - API de carousel
- `/pages/api/content/offers.ts` - API de ofertas

### Modificados:
- `prisma/schema.prisma` - Adicionados modelos Banner, CarouselImage, Offer
- `components/header/user/UserAccountBox.tsx` - Adicionado link "Gerenciar Conteúdo"
- `locales/br.ts` - Adicionadas strings em português
- `locales/en.ts` - Adicionadas strings em inglês
- `locales/fa.ts` - Adicionadas strings em persa

## 🚀 Como Usar

### Acessar a Página
1. Faça login como ADMIN
2. Clique no ícone de usuário no header
3. Procure por "Gerenciar Conteúdo"
4. Clique para acessar a página

### Gerenciar Banners
1. Selecione a aba "Banners"
2. Preencha o formulário com:
   - Título (obrigatório)
   - Descrição (opcional)
   - Selecione uma imagem
   - Texto do botão (opcional)
   - URL do link (opcional)
3. Clique em "Criar" ou "Atualizar"
4. A imagem será salva em ImgBB e a URL no MongoDB

### Gerenciar Carousel
1. Selecione a aba "Carousel"
2. Preencha o formulário com:
   - Título (obrigatório)
   - Descrição (opcional)
   - Selecione uma imagem
   - URL do link (opcional)
3. Clique em "Adicionar"
4. A imagem aparecerá na lista

### Gerenciar Ofertas
1. Selecione a aba "Ofertas"
2. Preencha com:
   - ID do Produto
   - Desconto em percentual (0-100)
   - Datas de início/fim (opcional)
3. Clique em "Criar"
4. Oferta será ativada

### Gerenciar Marcas
1. Selecione a aba "Marcas"
2. Visualize todas as marcas cadastradas
3. Para adicionar/editar, use a página `manage-categories-brands`

## 🔐 Segurança

- ✅ Autenticação obrigatória (token JWT)
- ✅ Validação de role ADMIN no backend
- ✅ Validação de tipo e tamanho de arquivo
- ✅ Validação de dados nos endpoints
- ✅ Não permite acesso à página sem role ADMIN
- ✅ Campos obrigatórios validados

## 📊 Estrutura de Dados no MongoDB

### Documento Banner
```json
{
  "_id": ObjectId,
  "title": "Black Friday",
  "description": "Grande desconto",
  "imageUrl": "https://imgbb.com/...",
  "buttonText": "Comprar Agora",
  "linkUrl": "/products",
  "isActive": true,
  "order": 1,
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

### Documento CarouselImage
```json
{
  "_id": ObjectId,
  "title": "Eletrônicos",
  "description": "Confira nossos eletrônicos",
  "imageUrl": "https://imgbb.com/...",
  "linkUrl": "/digital",
  "isActive": true,
  "order": 1,
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

### Documento Offer
```json
{
  "_id": ObjectId,
  "productId": "60d5ec49f1b2c72e8c8e4a1b",
  "discount": 15.5,
  "isActive": true,
  "startDate": ISODate,
  "endDate": ISODate,
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

## ✅ Requisitos Atendidos

- ✅ Página acessível apenas ao ADMIN
- ✅ Link no ícone do usuário (visível apenas para ADMIN)
- ✅ Gerenciamento de brands (visualização)
- ✅ Gerenciamento de banners
- ✅ Gerenciamento de carousel
- ✅ Gerenciamento de ofertas
- ✅ Persistência de URLs no banco de dados
- ✅ Sem alteração do modo de autenticação
- ✅ Interface similar à página `manage-categories-brands`
- ✅ Suporte a multilíngue (PT, EN, FA)
- ✅ Design responsivo

## 🎨 Estilo e UX

- Interface dark/light theme compatível
- Validações em tempo real
- Mensagens de erro e sucesso claras
- Loading states durante operações
- Preview de imagens antes de salvar
- Abas organizadas para fácil navegação
- Botões com ícones intuitivos
- Confirmação antes de deletar

## 📝 Próximas Melhorias Opcionais

- Drag & drop para reorganizar ordem de banners
- Busca/filtro de ofertas e banners
- Agendamento automático de ofertas
- Integração com analytics
- Histórico de alterações
- Bulk upload de imagens
