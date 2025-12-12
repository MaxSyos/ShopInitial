# Mapeamento de Dados - CategoryGrid Seed

## Schema CategoryGrid (Prisma)

```prisma
model CategoryGrid {
  id              String    @id @map("_id") @default(auto()) @db.ObjectId
  name            String    @unique
  title           String
  description     String?
  href            String?
  imgSrc          String?
  imgWidth        Int       @default(190)
  imgHeight       Int       @default(240)
  backgroundColor String?
  flexDirection   String?
  paddingBlock    String?
  paddingInline   String?
  gridColumn      String?
  isCentered      Boolean   @default(false)
  isSmall         Boolean   @default(false)
  order           Int       @default(0)
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

## Mapeamento de Entrada (dados do usuário → schema)

| Campo Schema | Fonte Dados | Valor Padrão |
|---|---|---|
| `id` | Auto-gerado (MongoDB) | - |
| `name` | `name` | - |
| `title` | `title` | - |
| `description` | `description` | `null` |
| `href` | `href` | `null` |
| `imgSrc` | `imgSrc` | `null` |
| `imgWidth` | `imgWidth` | `190` |
| `imgHeight` | `imgHeight` | `240` |
| `backgroundColor` | `styles.backgroundColor` | `null` |
| `flexDirection` | `styles.flexDirection` | `'row'` |
| `paddingBlock` | `styles.paddingBlock` | `'1rem'` |
| `paddingInline` | `styles.paddingInline` | `'1rem'` |
| `gridColumn` | `styles.gridColumn` | `'span 3 / span 3'` |
| `isCentered` | `isCentered` | `false` |
| `isSmall` | `isSmall` (não usado nos dados) | `false` |
| `order` | Índice do array + 1 | - |
| `isActive` | Sempre `true` | - |
| `createdAt` | Auto-gerado | `now()` |
| `updatedAt` | Auto-gerado | `now()` |

## Categorias a Serem Inseridas

### 1. Digital
- **name**: `digital`
- **title**: `digitalCategoryTitle`
- **description**: `digitalCategoryDescription`
- **href**: `/digital`
- **imgSrc**: `/images/category-img/digital-category.webp`
- **imgWidth**: `190` | **imgHeight**: `240`
- **Estilos**: `row`, `0.75rem`, `1rem`, `span 3 / span 12`
- **order**: `1`

### 2. Fashion
- **name**: `fashion`
- **title**: `fashionCategoryTitle`
- **href**: `/fashion`
- **imgWidth**: `240` | **imgHeight**: `250`
- **Estilos**: `row`, `1rem`, `1rem`, `span 3 / span 3`
- **order**: `2`

### 3. Beauty
- **name**: `beauty`
- **title**: `beautyCategoryTitle`
- **href**: `/beauty`
- **imgWidth**: `170` | **imgHeight**: `150`
- **Estilos**: `row`, `1rem`, `1rem`, `span 3 / span 3`
- **order**: `3`

### 4. Sport
- **name**: `sport`
- **title**: `sportCategoryTitle`
- **href**: `/sport`
- **imgWidth**: `130` | **imgHeight**: `150`
- **Estilos**: `row-reverse`, `1rem`, `1rem`, `span 3 / span 3`
- **order**: `4`

### 5. House
- **name**: `house`
- **title**: `houseCategoryTitle`
- **href**: `/house`
- **imgWidth**: `320` | **imgHeight**: `240`
- **Estilos**: `row`, `1rem`, `1rem`, `span 3 / span 6`
- **order**: `5`

### 6. Toy
- **name**: `toy`
- **title**: `toyCategoryTitle`
- **href**: `/toy`
- **imgWidth**: `130` | **imgHeight**: `110`
- **Estilos**: `column`, `1rem`, `1rem`, `span 3 / span 6` (textAlign: center)
- **order**: `6`

### 7. Stationery
- **name**: `stationery`
- **title**: `stationeryCategoryTitle`
- **href**: `/stationery`
- **imgWidth**: `130` | **imgHeight**: `250`
- **Estilos**: `row`, `1rem`, `1rem`, `span 6 / span 6`
- **isCentered**: `true` ✓
- **order**: `7`

## Comandos para Executar

```bash
# Navegar para a pasta FrontEnd
cd FrontEnd

# Executar o seed script
node prisma/seedCategoryGrid.js
```

## Notas Importantes

✅ **Campos mapeados corretamente:**
- O objeto `styles` foi decomposto em campos individuais do schema
- `isCentered` extraído corretamente apenas para "stationery"
- `order` gerado automaticamente baseado na posição no array
- `isActive` sempre `true` para todas as categorias

🔄 **Operação:**
- Usa `upsert` com `name` como chave única (idempotente)
- Se a categoria já existe, atualiza os dados
- Se não existe, cria uma nova entrada
