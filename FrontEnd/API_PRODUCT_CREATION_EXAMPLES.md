# 📡 Exemplos de Requisições API - Cadastro de Produtos

## 🔗 Endpoints Disponíveis

### 1. Criar Produto
**POST** `/api/products/create`

#### Request
```bash
curl -X POST http://localhost:3000/api/products/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "iPhone 14 Pro",
    "description": "Smartphone premium com câmera de 48MP",
    "price": 3999.99,
    "stock": 50,
    "sku": "IPHONE-14-PRO-BLK",
    "brandId": "65a1b2c3d4e5f6g7h8i9j0k1",
    "categoryId": "65a1b2c3d4e5f6g7h8i9j0k2",
    "images": [
      {
        "url": "https://i.imgbb.com/abc123def456.jpg",
        "alt": "iPhone 14 Pro Frontal"
      },
      {
        "url": "https://i.imgbb.com/xyz789uvw012.jpg",
        "alt": "iPhone 14 Pro Traseira"
      }
    ]
  }'
```

#### Response (201 Created)
```json
{
  "message": "Produto criado com sucesso",
  "product": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k3",
    "name": "iPhone 14 Pro",
    "description": "Smartphone premium com câmera de 48MP",
    "price": 3999.99,
    "stock": 50,
    "sku": "IPHONE-14-PRO-BLK",
    "brandId": "65a1b2c3d4e5f6g7h8i9j0k1",
    "categoryId": "65a1b2c3d4e5f6g7h8i9j0k2",
    "rating": 0,
    "isOffer": false,
    "createdAt": "2025-12-08T10:30:00.000Z",
    "updatedAt": "2025-12-08T10:30:00.000Z",
    "images": [
      {
        "id": "img123",
        "url": "https://i.imgbb.com/abc123def456.jpg",
        "alt": "iPhone 14 Pro Frontal"
      },
      {
        "id": "img124",
        "url": "https://i.imgbb.com/xyz789uvw012.jpg",
        "alt": "iPhone 14 Pro Traseira"
      }
    ]
  }
}
```

#### Erros Possíveis

**400 Bad Request** - Dados inválidos
```json
{
  "message": "Nome, preço e estoque são obrigatórios"
}
```

**400 Bad Request** - Preço negativo
```json
{
  "message": "O preço não pode ser negativo"
}
```

**400 Bad Request** - Sem imagens
```json
{
  "message": "Pelo menos uma imagem é obrigatória"
}
```

**500 Internal Server Error**
```json
{
  "message": "Erro ao criar produto",
  "error": "..."
}
```

---

### 2. Listar Marcas
**GET** `/api/brands`

#### Request
```bash
curl -X GET http://localhost:3000/api/brands
```

#### Response (200 OK)
```json
{
  "items": [
    {
      "id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "name": "Apple",
      "logo": "https://i.imgbb.com/apple-logo.jpg"
    },
    {
      "id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "name": "Samsung",
      "logo": "https://i.imgbb.com/samsung-logo.jpg"
    },
    {
      "id": "65a1b2c3d4e5f6g7h8i9j0k3",
      "name": "LG",
      "logo": null
    }
  ],
  "total": 3
}
```

---

### 3. Listar Categorias
**GET** `/api/categories`

#### Request
```bash
curl -X GET http://localhost:3000/api/categories
```

#### Response (200 OK)
```json
{
  "items": [
    {
      "id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "name": "Celulares",
      "description": "Smartphones e telefones celulares",
      "parentId": null,
      "children": [
        {
          "id": "65a1b2c3d4e5f6g7h8i9j0k4",
          "name": "iPhone",
          "description": "Telefones Apple",
          "parentId": "65a1b2c3d4e5f6g7h8i9j0k2"
        }
      ]
    },
    {
      "id": "65a1b2c3d4e5f6g7h8i9j0k5",
      "name": "Notebooks",
      "description": "Computadores portáteis",
      "parentId": null,
      "children": []
    }
  ],
  "total": 2
}
```

---

## 🌐 Exemplo com JavaScript/Fetch

### Criar Produto (Frontend)
```javascript
async function createProduct(formData) {
  try {
    // 1. Upload das imagens para ImgBB
    const uploadedImages = await Promise.all(
      formData.images.map(async (image) => {
        const imgFormData = new FormData();
        imgFormData.append('image', image.file);
        
        const response = await fetch('https://api.imgbb.com/1/upload', {
          method: 'POST',
          body: imgFormData,
        });
        
        const data = await response.json();
        return {
          url: data.data.url,
          alt: image.alt || formData.name,
        };
      })
    );

    // 2. Criar produto com URLs das imagens
    const productResponse = await fetch('/api/products/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        sku: formData.sku,
        brandId: formData.brandId,
        categoryId: formData.categoryId,
        images: uploadedImages,
      }),
    });

    if (!productResponse.ok) {
      throw new Error('Erro ao criar produto');
    }

    const result = await productResponse.json();
    console.log('Produto criado:', result.product);
    return result.product;
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
}
```

---

## 🔄 Exemplo com Axios (como no projeto)

```typescript
import api from '../lib/axiosClient';

async function createProductWithAxios(formData: any) {
  try {
    const payload = {
      name: formData.name,
      description: formData.description || undefined,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      sku: formData.sku || undefined,
      brandId: formData.brandId || undefined,
      categoryId: formData.categoryId || undefined,
      images: formData.images.map((img: any) => ({
        url: img.url,
        alt: img.alt || formData.name,
      })),
    };

    const response = await api.post('/products/create', payload);
    
    toast.success('Produto criado com sucesso!');
    return response.data.product;
  } catch (error: any) {
    const message = error?.response?.data?.message || 'Erro ao criar produto';
    toast.error(message);
    throw error;
  }
}
```

---

## 📦 Exemplo com cURL

### Criar Produto Simples
```bash
curl -X POST http://localhost:3000/api/products/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MacBook Pro 14\"",
    "price": 9999.99,
    "stock": 10,
    "images": [
      {
        "url": "https://i.imgbb.com/macbook.jpg",
        "alt": "MacBook Pro"
      }
    ]
  }'
```

### Listar Todas as Marcas
```bash
curl -X GET http://localhost:3000/api/brands
```

### Listar Todas as Categorias
```bash
curl -X GET http://localhost:3000/api/categories
```

---

## 🎯 Fluxo Completo de Integração

### 1. No Frontend (React)
```typescript
import { uploadImageToImgBB } from '@/lib/services/imgbbService';
import api from '@/lib/axiosClient';

const handleSubmit = async () => {
  // Validar dados
  if (!validateForm()) return;

  try {
    // 1. Fazer upload das imagens
    const imageUrls = await Promise.all(
      selectedFiles.map(file => uploadImageToImgBB(file))
    );

    // 2. Preparar dados do produto
    const productData = {
      name: form.name,
      description: form.description,
      price: form.price,
      stock: form.stock,
      sku: form.sku,
      brandId: form.brandId,
      categoryId: form.categoryId,
      images: imageUrls.map((url, idx) => ({
        url,
        alt: form.name,
      })),
    };

    // 3. Enviar para a API
    const response = await api.post('/products/create', productData);

    toast.success('Produto criado!');
    router.push('/products');
  } catch (error) {
    toast.error('Erro ao criar produto');
  }
};
```

---

## ⚠️ Validações

### No Frontend
- ✅ Nome obrigatório
- ✅ Preço > 0
- ✅ Estoque >= 0
- ✅ Mínimo 1 imagem
- ✅ Imagem <= 5MB
- ✅ Tipo de arquivo validado

### No Backend
- ✅ Todos os acima
- ✅ Tipo de imagem validado
- ✅ Dados sanitizados
- ✅ Relacionamentos verificados
- ✅ SKU único verificado

---

## 🔐 Headers Recomendados

### Para Requisições Autenticadas
```javascript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
  'User-Agent': 'ProductApp/1.0',
};
```

### Para Upload de Imagens
```javascript
const headers = {
  // FormData define automaticamente
  // 'Content-Type': 'multipart/form-data'
};
```

---

## 📊 Limites e Restrições

| Limite | Valor |
|--------|-------|
| Máximo de imagens por produto | 5 |
| Tamanho máximo de imagem | 5 MB |
| Tamanho máximo de nome | 255 caracteres |
| Tamanho máximo de descrição | 5000 caracteres |
| Preço mínimo | 0.01 R$ |
| Estoque mínimo | 0 |
| SKU máximo | 100 caracteres |

---

## 🧪 Testando a API

### Com Postman
1. Importar coleção com endpoints
2. Configurar environment
3. Executar requisições
4. Verificar responses

### Com Thunder Client
Extensão VSCode para testar APIs rapidamente

### Com Insomnia
Cliente HTTP multiplataforma com suporte a autenticação

---

## 📝 Notas Importantes

1. **ImgBB URLs são permanentes**
   - URLs não expiram
   - Podem ser usadas indefinidamente
   - Não é necessário fazer backup

2. **Validação em dois níveis**
   - Frontend: UX melhorada
   - Backend: Segurança garantida

3. **Escalabilidade**
   - Estrutura pronta para CDN
   - Possível integrar com CloudFront
   - Suporta múltiplas imagens

4. **Banco de Dados**
   - Usa Prisma com MongoDB
   - IDs em formato ObjectId
   - Timestamps automáticos

---

**Última atualização:** Dezembro 2025
