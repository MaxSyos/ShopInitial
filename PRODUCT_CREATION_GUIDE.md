# 📦 Sistema de Cadastro de Produtos - Documentação Completa

## 🎯 Visão Geral

Um sistema completo de cadastro de produtos para sua loja online, integrado com **ImgBB** para hospedagem de imagens e **Prisma** para gerenciamento de dados.

### ✨ Características

- ✅ Interface responsiva e intuitiva
- ✅ Upload de múltiplas imagens via ImgBB
- ✅ Validação de formulário em tempo real
- ✅ Suporte a múltiplos idiomas (Português, Inglês, Persa)
- ✅ Proteção por autenticação e roles (apenas ADMIN)
- ✅ Integração com MongoDB via Prisma
- ✅ Feedback visual com notificações Toast
- ✅ Design consistente com o restante do e-commerce

## 🚀 Como Usar

### Passo 1: Acessar a Página de Cadastro

1. Acesse sua aplicação e faça login com uma conta **ADMIN**
2. Navegue até: `/create-product`

**URL direta:** `http://localhost:3000/create-product`

### Passo 2: Preencher o Formulário

#### **Informações Básicas**

- **Nome do Produto** *(Obrigatório)*
  - Exemplo: "iPhone 14 Pro"
  - Máximo de 255 caracteres recomendado

- **Descrição** *(Opcional)*
  - Descrição detalhada do produto
  - Suporta texto longo
  - Use quebras de linha conforme necessário

- **SKU** *(Opcional)*
  - Identificador único do produto no seu sistema
  - Exemplo: "IPHONE-14-PRO-256GB"

#### **Preço e Estoque**

- **Preço (R$)** *(Obrigatório)*
  - Use ponto (.) como separador decimal
  - Exemplo: 4999.90
  - Não pode ser negativo

- **Estoque** *(Obrigatório)*
  - Quantidade disponível
  - Números inteiros apenas
  - Não pode ser negativo

#### **Categorização**

- **Categoria** *(Opcional)*
  - Selecione uma categoria existente
  - Helps para organizar produtos
  - Múltiplas subcategorias disponíveis

- **Marca** *(Opcional)*
  - Selecione uma marca existente
  - Ajuda na filtragem e busca
  - Pode ser deixado em branco

#### **Imagens** *(Obrigatório - Mínimo 1)*

- Máximo de **5 imagens** por produto
- Formatos suportados: PNG, JPG, JPEG, GIF, BMP, WEBP
- Tamanho máximo: **5MB** por imagem
- As imagens são automaticamente hospedadas no ImgBB

### Passo 3: Fazer Upload de Imagens

#### **Método 1: Clique (Recomendado)**

1. Clique na área "Clique ou arraste imagens aqui"
2. Selecione um ou mais arquivos
3. Aguarde o processamento

#### **Método 2: Arrastar e Soltar**

1. Abra seu gerenciador de arquivos
2. Arraste as imagens diretamente para a área de upload
3. As imagens serão processadas automaticamente

### Passo 4: Editar Detalhes das Imagens

Após o upload:

1. **Editar Descrição (Alt Text)**
   - Clique no campo de descrição abaixo da imagem
   - Digite uma descrição que apareça se a imagem não carregar
   - Exemplo: "Foto frontal do iPhone 14 Pro"

2. **Remover Imagem**
   - Passe o mouse sobre a imagem
   - Clique no ícone de lixeira
   - A imagem será removida imediatamente

### Passo 5: Enviar Formulário

1. Revise todos os dados
2. Clique em **"Criar Produto"** na parte inferior
3. Aguarde a confirmação de sucesso

Após sucesso, você será redirecionado para a página de produtos.

## 🔐 Segurança e Permissões

### Requisitos de Acesso

- **Autenticação**: Você deve estar logado
- **Role**: Apenas usuários com role `ADMIN` podem acessar
- **Redirecionamento**: Usuários não autenticados são redirecionados para login

### Dados Enviados

Todos os dados são validados:

- **No cliente**: Validação básica para UX
- **No servidor**: Validação completa antes de salvar
- **Banco de dados**: Constraints do Prisma

## 📋 Estrutura de Dados

### Produto (Schema Prisma)

```prisma
model Product {
  id          String    @id @map("_id") @default(auto()) @db.ObjectId
  name        String
  description String?
  price       Float
  stock       Int
  sku         String?   @unique
  images      Image[]
  brandId     String?   @db.ObjectId
  categoryId  String?   @db.ObjectId
  rating      Float     @default(0)
  isOffer     Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Image {
  id        String  @id @map("_id") @default(auto()) @db.ObjectId
  url       String  // URL do ImgBB
  alt       String? // Texto alternativo
  productId String  @db.ObjectId
  product   Product @relation(fields: [productId], references: [id])
}
```

## 🖼️ Integração ImgBB

### Como Funciona

1. **Upload Local**: Você seleciona as imagens no navegador
2. **Validação**: Sistema valida tipo e tamanho
3. **Upload para ImgBB**: Imagens são enviadas para o servidor ImgBB
4. **URL Retornada**: ImgBB retorna uma URL permanente
5. **Armazenamento**: URL é salva no banco de dados junto com o produto

### Plano Gratuito vs. Pago

#### **Plano Gratuito** (Recomendado)
- ✅ Sem limite de imagens
- ✅ Até 32MB por imagem
- ✅ URLs permanentes
- ⚠️ Pode ter limite de requisições/hora

#### **Plano com Chave API** (Produção)
- ✅ Limite maior de requisições
- ✅ Melhor performance
- ✅ Suporte prioritário
- 💰 Requer cadastro na conta ImgBB

### Configuração da Chave API (Opcional)

Se desejar usar a chave API para melhor performance:

1. **Obter Chave API:**
   - Visite: https://api.imgbb.com
   - Clique em "API Key"
   - Copie sua chave

2. **Adicionar ao Projeto:**

```env
# .env.local
NEXT_PUBLIC_IMGBB_API_KEY=sua_chave_aqui
```

3. **Usar no Código:**

O componente detectará automaticamente a variável de ambiente.

## 🛠️ Troubleshooting

### Problema: "Erro ao fazer upload: Timeout"

**Causa**: Imagem muito grande ou conexão lenta

**Solução**:
- Reduza o tamanho da imagem
- Use um compressor online
- Verifique sua conexão de internet

### Problema: "Falha ao fazer upload da imagem"

**Causa**: Servidor ImgBB indisponível ou arquivo inválido

**Solução**:
- Tente novamente mais tarde
- Verifique se o arquivo é realmente uma imagem
- Tente um formato diferente (PNG em vez de JPG)

### Problema: "Máximo de 5 imagens permitidas"

**Causa**: Tentativa de adicionar mais imagens que o limite

**Solução**:
- Remova imagens desnecessárias
- Clique no ícone de lixeira sobre as imagens
- Adicione novas imagens

### Problema: "Acesso negado" ao tentar acessar a página

**Causa**: Sua conta não tem role ADMIN

**Solução**:
- Solicite permissão de administrador
- Verifique seu role no banco de dados
- Contate o desenvolvedor

### Problema: Categoria ou Marca não aparecem

**Causa**: Banco de dados vazio

**Solução**:
- Crie categorias e marcas primeiro
- Visite a página de administração
- Ou deixe vazio (campos opcionais)

## 📚 Arquivos Criados

```
FrontEnd/
├── pages/
│   ├── create-product.tsx          # Página principal
│   └── api/
│       ├── products/create.ts      # API para criar produtos
│       ├── brands/index.ts         # API para listar marcas
│       └── categories/index.ts     # API para listar categorias
├── components/
│   └── productForm/
│       ├── ProductForm.tsx         # Formulário principal
│       └── ImageUpload.tsx         # Componente de upload
├── lib/
│   └── services/
│       └── imgbbService.ts        # Serviço ImgBB
├── locales/
│   └── br.ts                       # Traduções (atualizado)
└── IMGBB_GUIDE.md                  # Guia do ImgBB
```

## 🎨 Personalização

### Alterar Número Máximo de Imagens

No arquivo `components/productForm/ProductForm.tsx`:

```typescript
<ImageUploadComponent
  images={images}
  onImagesChange={setImages}
  maxImages={10}  // Mude para o desejado
/>
```

### Alterar Validações

No arquivo `components/productForm/ProductForm.tsx`, método `validateForm()`:

```typescript
// Exemplo: permitir preço zero
if (!formData.price) {  // em vez de <= 0
  newErrors.price = 'Preço é obrigatório';
}
```

### Adicionar Novos Campos

1. Adicione o campo ao schema Prisma
2. Atualize a API `/api/products/create.ts`
3. Adicione ao formulário no `ProductForm.tsx`
4. Adicione traduções em `locales/`

## 📊 Exemplo de Resposta API

### Request

```bash
POST /api/products/create
Content-Type: application/json

{
  "name": "iPhone 14 Pro",
  "description": "Melhor câmera de smartphone",
  "price": 4999.90,
  "stock": 50,
  "sku": "IPHONE-14-PRO",
  "categoryId": "507f1f77bcf86cd799439011",
  "brandId": "507f1f77bcf86cd799439012",
  "images": [
    {
      "url": "https://i.ibb.co/xxxxx/image1.jpg",
      "alt": "Foto frontal"
    },
    {
      "url": "https://i.ibb.co/xxxxx/image2.jpg",
      "alt": "Foto lateral"
    }
  ]
}
```

### Response (201)

```json
{
  "message": "Produto criado com sucesso",
  "product": {
    "id": "507f1f77bcf86cd799439013",
    "name": "iPhone 14 Pro",
    "description": "Melhor câmera de smartphone",
    "price": 4999.90,
    "stock": 50,
    "sku": "IPHONE-14-PRO",
    "rating": 0,
    "isOffer": false,
    "createdAt": "2025-12-08T10:30:00.000Z",
    "updatedAt": "2025-12-08T10:30:00.000Z",
    "images": [
      {
        "id": "507f1f77bcf86cd799439014",
        "url": "https://i.ibb.co/xxxxx/image1.jpg",
        "alt": "Foto frontal"
      },
      {
        "id": "507f1f77bcf86cd799439015",
        "url": "https://i.ibb.co/xxxxx/image2.jpg",
        "alt": "Foto lateral"
      }
    ]
  }
}
```

## 🔄 Fluxo Completo

```
┌─────────────────────┐
│  Usuário Acessa     │
│ /create-product     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Verifica Auth +     │
│ Role ADMIN          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Carrega Categorias  │
│ e Marcas            │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Usuário Preenche    │
│ Formulário          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Faz Upload para     │
│ ImgBB               │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Valida Dados        │
│ (Cliente + Servidor)│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Salva no MongoDB    │
│ via Prisma          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Redireciona para    │
│ /products           │
└─────────────────────┘
```

## 🚀 Próximas Melhorias

- [ ] Editar produtos existentes
- [ ] Deletar produtos
- [ ] Reordenação de imagens
- [ ] Crop/resize de imagens
- [ ] Previsualização antes de enviar
- [ ] Importação em lote via CSV
- [ ] Backup automático de imagens
- [ ] Integração com CDN (CloudFront)
- [ ] Analytics de produtos criados

## 📞 Suporte

Para mais informações sobre ImgBB:
- [ImgBB API Docs](https://api.imgbb.com/)
- [ImgBB Oficial](https://imgbb.com)

Para questões sobre Prisma:
- [Prisma Docs](https://www.prisma.io/docs/)
- [Prisma MongoDB](https://www.prisma.io/docs/concepts/database-connectors/mongodb)

---

**Versão**: 1.0  
**Última atualização**: Dezembro 2025  
**Desenvolvido com**: Next.js, React, TypeScript, Tailwind CSS, Prisma
