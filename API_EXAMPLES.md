# 📡 Exemplos de Requisições de API

## Base URL

```
http://localhost:3000/api
```

## 1️⃣ Criar Produto

### Endpoint

```
POST /products/create
```

### Request (cURL)

```bash
curl -X POST http://localhost:3000/api/products/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "iPhone 14 Pro",
    "description": "Smartphone com câmera profissional",
    "price": 4999.90,
    "stock": 50,
    "sku": "IPHONE-14-PRO-256GB",
    "categoryId": "507f1f77bcf86cd799439011",
    "brandId": "507f1f77bcf86cd799439012",
    "images": [
      {
        "url": "https://i.ibb.co/example1/image.jpg",
        "alt": "Foto frontal do iPhone 14 Pro"
      },
      {
        "url": "https://i.ibb.co/example2/image.jpg",
        "alt": "Foto traseira"
      }
    ]
  }'
```

### Request (JavaScript/Fetch)

```javascript
const productData = {
  name: "iPhone 14 Pro",
  description: "Smartphone com câmera profissional",
  price: 4999.90,
  stock: 50,
  sku: "IPHONE-14-PRO-256GB",
  categoryId: "507f1f77bcf86cd799439011",
  brandId: "507f1f77bcf86cd799439012",
  images: [
    {
      url: "https://i.ibb.co/example1/image.jpg",
      alt: "Foto frontal do iPhone 14 Pro"
    }
  ]
};

const response = await fetch('/api/products/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(productData)
});

const result = await response.json();
console.log(result);
```

### Request (Axios)

```typescript
import api from '@/lib/axiosClient';

const response = await api.post('/products/create', {
  name: "iPhone 14 Pro",
  description: "Smartphone com câmera profissional",
  price: 4999.90,
  stock: 50,
  sku: "IPHONE-14-PRO-256GB",
  categoryId: "507f1f77bcf86cd799439011",
  brandId: "507f1f77bcf86cd799439012",
  images: [
    {
      url: "https://i.ibb.co/example1/image.jpg",
      alt: "Foto frontal"
    }
  ]
});

console.log(response.data);
```

### Response (201 - Sucesso)

```json
{
  "message": "Produto criado com sucesso",
  "product": {
    "id": "507f1f77bcf86cd799439013",
    "name": "iPhone 14 Pro",
    "description": "Smartphone com câmera profissional",
    "price": 4999.90,
    "stock": 50,
    "sku": "IPHONE-14-PRO-256GB",
    "rating": 0,
    "isOffer": false,
    "createdAt": "2025-12-08T12:30:00.000Z",
    "updatedAt": "2025-12-08T12:30:00.000Z",
    "images": [
      {
        "id": "507f1f77bcf86cd799439014",
        "url": "https://i.ibb.co/example1/image.jpg",
        "alt": "Foto frontal do iPhone 14 Pro"
      }
    ],
    "brand": {
      "id": "507f1f77bcf86cd799439012",
      "name": "Apple",
      "logo": null
    },
    "category": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Celular",
      "description": "Smartphones e acessórios"
    }
  }
}
```

### Response (400 - Erro de Validação)

```json
{
  "message": "Nome, preço e estoque são obrigatórios"
}
```

### Response (500 - Erro do Servidor)

```json
{
  "message": "Erro ao criar produto"
}
```

## 2️⃣ Listar Marcas

### Endpoint

```
GET /brands
```

### Request (cURL)

```bash
curl -X GET http://localhost:3000/api/brands
```

### Request (JavaScript)

```javascript
const response = await fetch('/api/brands');
const data = await response.json();
console.log(data.items);
```

### Response (200)

```json
{
  "items": [
    {
      "id": "507f1f77bcf86cd799439012",
      "name": "Apple",
      "logo": "https://example.com/apple-logo.png"
    },
    {
      "id": "507f1f77bcf86cd799439013",
      "name": "Samsung",
      "logo": "https://example.com/samsung-logo.png"
    },
    {
      "id": "507f1f77bcf86cd799439014",
      "name": "Xiaomi",
      "logo": null
    }
  ],
  "total": 3
}
```

## 3️⃣ Listar Categorias

### Endpoint

```
GET /categories
```

### Request (cURL)

```bash
curl -X GET http://localhost:3000/api/categories
```

### Request (JavaScript)

```javascript
const response = await fetch('/api/categories');
const data = await response.json();
console.log(data.items);
```

### Response (200)

```json
{
  "items": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Celular",
      "description": "Smartphones e acessórios",
      "parentId": null,
      "children": [
        {
          "id": "507f1f77bcf86cd799439015",
          "name": "Smartphone",
          "description": "Celulares inteligentes",
          "parentId": "507f1f77bcf86cd799439011"
        },
        {
          "id": "507f1f77bcf86cd799439016",
          "name": "Acessórios",
          "description": "Acessórios para celulares",
          "parentId": "507f1f77bcf86cd799439011"
        }
      ]
    },
    {
      "id": "507f1f77bcf86cd799439017",
      "name": "Computador",
      "description": "Notebooks e computadores",
      "parentId": null,
      "children": []
    }
  ],
  "total": 2
}
```

## 4️⃣ Upload de Imagem (ImgBB)

### Direto do Frontend

```typescript
import { uploadImageToImgBB } from '@/lib/services/imgbbService';

const file = /* arquivo do input */;

try {
  const imageUrl = await uploadImageToImgBB(file);
  console.log('Imagem enviada:', imageUrl);
  
  // Usar a URL no formulário
  setImages([...images, { url: imageUrl }]);
} catch (error) {
  console.error('Erro:', error);
}
```

### Com Chave API

```typescript
const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
const imageUrl = await uploadImageToImgBB(file, apiKey);
```

### Response

```
https://i.ibb.co/abcdef123/image.jpg
```

## Exemplos Completos

### Exemplo 1: Criar Produto Simples

```typescript
// Apenas com dados essenciais
const response = await api.post('/products/create', {
  name: "Samsung Galaxy S24",
  price: 3999.90,
  stock: 25,
  images: [
    {
      url: "https://i.ibb.co/example/samsung.jpg",
      alt: "Samsung Galaxy S24"
    }
  ]
});
```

### Exemplo 2: Criar Produto Completo

```typescript
const response = await api.post('/products/create', {
  name: "MacBook Pro 14",
  description: "Laptop profissional com chip M3 Max. Tela Retina de 14 polegadas, 16GB RAM, 512GB SSD.",
  price: 12999.90,
  stock: 10,
  sku: "MACBOOK-PRO-14-2024",
  categoryId: "507f1f77bcf86cd799439011",
  brandId: "507f1f77bcf86cd799439012",
  images: [
    {
      url: "https://i.ibb.co/xyz1/macbook-front.jpg",
      alt: "MacBook Pro 14 - Vista frontal"
    },
    {
      url: "https://i.ibb.co/xyz2/macbook-side.jpg",
      alt: "MacBook Pro 14 - Vista lateral"
    },
    {
      url: "https://i.ibb.co/xyz3/macbook-keyboard.jpg",
      alt: "MacBook Pro 14 - Teclado"
    }
  ]
});

console.log('Produto criado:', response.data.product.id);
```

### Exemplo 3: Upload em Lote

```typescript
async function createMultipleProducts() {
  const products = [
    {
      name: "Produto 1",
      price: 99.90,
      stock: 50,
      images: [/* ... */]
    },
    {
      name: "Produto 2",
      price: 199.90,
      stock: 30,
      images: [/* ... */]
    },
    {
      name: "Produto 3",
      price: 299.90,
      stock: 20,
      images: [/* ... */]
    }
  ];

  const results = await Promise.all(
    products.map(product => api.post('/products/create', product))
  );

  console.log(`${results.length} produtos criados com sucesso!`);
}

createMultipleProducts();
```

## Códigos de Status HTTP

| Código | Significado | Ação |
|--------|-------------|------|
| 200 | OK | Requisição bem-sucedida |
| 201 | Created | Produto criado com sucesso |
| 400 | Bad Request | Dados inválidos ou incompletos |
| 405 | Method Not Allowed | Método HTTP não permitido (ex: GET em POST) |
| 500 | Internal Server Error | Erro no servidor |

## Erros Comuns

### "Nome, preço e estoque são obrigatórios"

**Causa**: Faltam campos obrigatórios

**Solução**: Verifique se está enviando:
- `name` (string)
- `price` (number)
- `stock` (number)
- `images` (array com pelo menos 1 item)

### "Preço não pode ser negativo"

**Causa**: Valor de preço é negativo ou zero

**Solução**: Use um valor > 0
```javascript
price: 99.90  // ✓ Correto
price: 0      // ✗ Errado
price: -10    // ✗ Errado
```

### "Estoque não pode ser negativo"

**Causa**: Valor de estoque é negativo

**Solução**: Use um valor >= 0
```javascript
stock: 50     // ✓ Correto
stock: 0      // ✓ Correto (sem estoque)
stock: -5     // ✗ Errado
```

### "Pelo menos uma imagem é obrigatória"

**Causa**: Array de imagens vazio

**Solução**: Envie pelo menos 1 imagem
```javascript
images: [
  {
    url: "https://i.ibb.co/example/image.jpg",
    alt: "Descrição"
  }
]
```

## Testar com Postman

1. **Criar nova requisição POST**
   - URL: `http://localhost:3000/api/products/create`
   - Method: POST

2. **Headers**
   ```
   Content-Type: application/json
   ```

3. **Body (JSON)**
   ```json
   {
     "name": "Produto Teste",
     "price": 99.90,
     "stock": 10,
     "images": [
       {
         "url": "https://i.ibb.co/example/test.jpg",
         "alt": "Teste"
       }
     ]
   }
   ```

4. **Clique em Send**

5. **Verifique Response**
   - Status: 201
   - Body: Dados do produto criado

---

**Dúvidas?** Consulte a documentação completa em `PRODUCT_CREATION_GUIDE.md`
