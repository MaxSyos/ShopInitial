# Guia de Integração ImgBB para Upload de Imagens

## 📋 Visão Geral

A página de cadastro de produtos integra-se com o **ImgBB** para fazer upload de imagens. O ImgBB é um serviço gratuito de hospedagem de imagens que oferece:

- ✅ Plano gratuito sem limite de upload
- ✅ URLs permanentes para as imagens
- ✅ API REST simples
- ✅ Sem necessidade de criar conta (para uso com limite)

## 🚀 Como Usar

### Opção 1: Sem Chave de API (Recomendado para Testes)

Se você está usando a conta **gratuita** do ImgBB, pode usar o serviço sem chave API com as seguintes limitações:

- Upload até **32 MB** por imagem
- Limite de requisições por hora
- Útil para testes e desenvolvimento

**Nenhuma configuração adicional é necessária!** Apenas acesse a página de criar produto e comece a fazer upload.

### Opção 2: Com Chave de API (Para Produção)

Se deseja melhor performance e sem limitações de taxa, obtenha uma chave API:

#### Passo 1: Criar Conta no ImgBB

1. Acesse [https://imgbb.com](https://imgbb.com)
2. Clique em "Sign Up" e crie uma conta (gratuita)
3. Faça login em sua conta

#### Passo 2: Obter a Chave API

1. Vá para [https://api.imgbb.com](https://api.imgbb.com)
2. Clique em "API Key"
3. Copie sua chave API

#### Passo 3: Adicionar ao Projeto

Você pode usar a chave API de duas formas:

**a) Via Variável de Ambiente:**

Adicione ao arquivo `.env.local`:

```env
NEXT_PUBLIC_IMGBB_API_KEY=sua_chave_api_aqui
```

**b) Via Propriedade do Componente:**

No componente `ProductForm`, passe a chave assim:

```typescript
<ImageUploadComponent
  images={images}
  onImagesChange={setImages}
  maxImages={5}
  apiKey={process.env.NEXT_PUBLIC_IMGBB_API_KEY}
/>
```

## 📄 Estrutura da Implementação

### 1. Serviço ImgBB (`lib/services/imgbbService.ts`)

```typescript
uploadImageToImgBB(file, apiKey?) // Fazer upload de uma imagem
uploadMultipleImagesToImgBB(files, apiKey?) // Fazer upload de múltiplas imagens
```

**Características:**
- Validação de tipo de arquivo
- Suporte a múltiplos formatos (PNG, JPG, GIF, etc)
- Tratamento de erros robusto
- Retorna URL direta da imagem

### 2. Componente de Upload (`components/productForm/ImageUpload.tsx`)

- Preview local das imagens
- Upload progressivo e assíncrono
- Validação de tamanho (máx 5MB)
- Edição de texto alternativo (alt)
- Remoção de imagens
- Feedback visual de progresso

### 3. Formulário de Produto (`components/productForm/ProductForm.tsx`)

- Formulário completo com validação
- Integração com ImageUploadComponent
- Campos: Nome, Descrição, Preço, Estoque, SKU, Categoria, Marca
- Suporte a múltiplas imagens
- Requisições para criar marcas/categorias automaticamente

### 4. Página de Criar Produto (`pages/create-product.tsx`)

- Página protegida com autenticação
- Requer role "ADMIN"
- Layout responsivo
- Breadcrumb e navegação

### 5. APIs (`pages/api/products/create.ts`, `pages/api/brands/index.ts`, `pages/api/categories/index.ts`)

- Endpoints para criar produtos
- Validação de dados do servidor
- Relacionamento com banco de dados Prisma/MongoDB

## 🔒 Segurança

### Recomendações:

1. **Nunca** compartilhe sua chave API publicamente
2. Use `NEXT_PUBLIC_` apenas para valores que podem ser públicos
3. Para chave API sensível, implemente no backend:

```typescript
// pages/api/upload.ts
export default async function handler(req, res) {
  const apiKey = process.env.IMGBB_API_KEY; // Variável de servidor
  // ... upload logic
}
```

4. Valide sempre no servidor:
   - Tipo de arquivo
   - Tamanho do arquivo
   - Autenticação do usuário

## 📊 Fluxo de Upload

```
1. Usuário seleciona arquivo
   ↓
2. Validação local (tipo, tamanho)
   ↓
3. Preview local exibido
   ↓
4. Upload para ImgBB
   ↓
5. URL retornada e armazenada
   ↓
6. Armazenar no BD Prisma quando submeter form
```

## 🐛 Troubleshooting

### "Erro ao fazer upload: 413 Payload Too Large"
- A imagem é muito grande
- ImgBB tem limite de 32MB no plano gratuito
- Reduza o tamanho ou comprima a imagem

### "Falha no upload da imagem"
- Verifique sua conexão internet
- Tente novamente
- Verifique se o arquivo é realmente uma imagem

### "Timeout no upload"
- Imagem muito grande para sua conexão
- Tente uma imagem menor
- Verifique sua velocidade de internet

### Chave API inválida
- Regenere a chave em [https://api.imgbb.com](https://api.imgbb.com)
- Verifique se copiar e colar corretamente
- Sem espaços em branco extras

## 📈 Performance

### Otimizações Implementadas:

1. **Lazy Loading**: Imagens carregam sob demanda
2. **Validação Prévia**: Erros detectados antes do upload
3. **Upload Paralelo**: Múltiplas imagens simultaneamente (opcional)
4. **Compressão**: Consider usar ferramentas de compressão de imagem antes

### Para Melhorar Mais:

```typescript
// Adicione compressão de imagem
npm install next-image-export-optimizer
```

## 🎯 Casos de Uso

### 1. E-commerce
- Upload de múltiplas fotos do produto
- Validação automática
- Hospedagem permanente

### 2. Admin Dashboard
- Gerenciamento de imagens
- Preview imediato
- Histórico de uploads

### 3. Galeria de Produtos
- Suporta até 5 imagens por produto
- Lazy loading automático
- URLs otimizadas

## 📚 Recursos Adicionais

- [ImgBB API Docs](https://api.imgbb.com/)
- [Prisma Schema](../prisma/schema.prisma)
- [Componente ImageUpload](../components/productForm/ImageUpload.tsx)
- [Serviço ImgBB](../lib/services/imgbbService.ts)

## ✨ Próximos Passos

Para expandir a funcionalidade:

1. Adicionar edição de produtos
2. Reordenação de imagens
3. Crop/resize de imagens
4. Integração com CDN (CloudFront, Cloudflare)
5. Backup automático de imagens
6. Galeria de previews

---

**Criado em:** Dezembro 2025  
**Versão:** 1.0
