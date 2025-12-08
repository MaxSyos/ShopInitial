# 🚀 Guia Rápido de Instalação - Cadastro de Produtos

## ⚡ Início Rápido (2 minutos)

### 1️⃣ Verificar Dependências

Todas as dependências já estão instaladas! O projeto usa:

- ✅ `react-toastify` - Notificações
- ✅ `react-icons` - Ícones
- ✅ `axios` - Requisições HTTP
- ✅ `@prisma/client` - ORM para banco de dados

### 2️⃣ Nenhuma Configuração Necessária

A implementação **já está pronta**:

```bash
# As páginas e componentes já existem em:
✓ /pages/create-product.tsx
✓ /components/productForm/ProductForm.tsx
✓ /components/productForm/ImageUpload.tsx
✓ /pages/api/products/create.ts
✓ /pages/api/brands/index.ts
✓ /pages/api/categories/index.ts
✓ /lib/services/imgbbService.ts
```

### 3️⃣ Testar Localmente

```bash
# No diretório FrontEnd
cd FrontEnd

# Inicie o servidor de desenvolvimento
npm run dev

# Acesse em seu navegador
http://localhost:3000/create-product
```

### 4️⃣ Login como ADMIN

Para acessar a página, você precisa:

1. Fazer login com uma conta ADMIN
2. Se não tiver, crie uma conta e atualize o role no banco:

```javascript
// No MongoDB, atualize seu usuário:
db.users.updateOne(
  { email: "seu@email.com" },
  { $set: { role: "ADMIN" } }
)
```

## 🎯 Uso Imediato

Após o login como ADMIN:

1. Acesse: `http://localhost:3000/create-product`
2. Preencha os dados do produto
3. Clique em "Adicionar Imagens"
4. Selecione até 5 imagens
5. Preencha as descrições (alt text)
6. Clique em "Criar Produto"

## 📁 Estrutura de Pastas

```
FrontEnd/
├── pages/
│   ├── create-product.tsx          ← Página principal
│   └── api/
│       ├── products/
│       │   └── create.ts           ← API de criação
│       ├── brands/
│       │   └── index.ts            ← API de marcas
│       └── categories/
│           └── index.ts            ← API de categorias
├── components/
│   └── productForm/
│       ├── ProductForm.tsx         ← Formulário
│       └── ImageUpload.tsx         ← Upload de imagens
├── lib/
│   └── services/
│       └── imgbbService.ts        ← Integração ImgBB
└── locales/
    ├── br.ts                       ← Tradução PT-BR
    ├── en.ts                       ← Tradução EN
    └── fa.ts                       ← Tradução FA
```

## 🔑 ImgBB - Usando sem Chave (Gratuito)

### ✅ Funciona automaticamente!

O ImgBB permite upload **sem chave API** para contas gratuitas:

- Até **32MB** por imagem
- Sem limite de uploads
- URLs permanentes

**Nenhuma configuração necessária!** Apenas comece a usar.

### (Opcional) Adicionar Chave API para Melhor Performance

Se quiser adicionar sua chave API:

1. Acesse: https://api.imgbb.com
2. Copie sua chave
3. Adicione ao `.env.local`:

```env
NEXT_PUBLIC_IMGBB_API_KEY=sua_chave_aqui
```

4. Pronto! O sistema usará sua chave automaticamente.

## ✨ Funcionalidades Incluídas

- 📝 Formulário completo com validação
- 🖼️ Upload de múltiplas imagens
- 🌐 Integração com ImgBB
- 🗄️ Armazenamento em MongoDB
- 🔐 Proteção por autenticação
- 🌍 Suporte a 3 idiomas
- 📱 Design responsivo
- ⚡ Notificações em tempo real

## 🔍 Validações Incluídas

✅ **No Cliente**:
- Nome obrigatório
- Preço maior que zero
- Estoque não negativo
- Tipo de arquivo (apenas imagens)
- Tamanho de arquivo (máx 5MB)
- Mínimo 1 imagem, máximo 5

✅ **No Servidor**:
- Todas as validações do cliente
- Verificação de dados duplicados
- Constraints do banco de dados
- Tratamento de erros robusto

## 🐛 Se Algo Não Funcionar

### Erro: "Acesso negado"
- Certifique-se de que você é ADMIN
- Role deve ser `"ADMIN"` (maiúsculo)

### Erro: "Categorias/Marcas não carregam"
- Crie algumas categorias e marcas primeiro
- Ou deixe campos vazios (são opcionais)

### Erro: "Falha no upload de imagem"
- Tente novamente
- Verifique o tamanho (máx 5MB)
- Tente um formato diferente (JPG em vez de PNG)

### Erro: "Produto não salva"
- Verifique se o banco de dados está funcionando
- Rode: `npm run prisma:generate`
- Rode: `npm run prisma:push`

## 📚 Documentação Completa

Para detalhes completos, veja:

- `IMGBB_GUIDE.md` - Guia detalhado do ImgBB
- `PRODUCT_CREATION_GUIDE.md` - Guia completo de uso
- Código comentado em cada arquivo

## 🎓 Exemplo Completo

### Criar um Produto (Passo a Passo)

1. **Login**
   - Email: seu@email.com
   - Role: ADMIN

2. **Acessar Página**
   - URL: http://localhost:3000/create-product

3. **Preencher Informações**
   - Nome: "Samsung Galaxy S24"
   - Descrição: "Último modelo de smartphone Samsung"
   - Preço: 3999.90
   - Estoque: 100
   - SKU: SAMSUNG-S24

4. **Selecionar Categoria e Marca**
   - Categoria: Celular
   - Marca: Samsung

5. **Fazer Upload de Imagens**
   - Clique na área de upload
   - Selecione até 5 imagens
   - Adicione descrições

6. **Enviar**
   - Clique em "Criar Produto"
   - Aguarde confirmação
   - Redirecionado para lista de produtos

## 🚀 Próximos Passos

Após criar produtos:

1. Visualize na página de produtos
2. Edite detalhes se necessário
3. Adicione mais produtos
4. Configure ofertas especiais
5. Integre com sua loja

## 💡 Dicas

- 📷 Use imagens de boa qualidade (mas comprimidas)
- 🏷️ SKU deve ser único para cada produto
- 💰 Preço deve ser em reais (R$)
- 📝 Descrição bem detalhada melhora vendas
- 🎨 Use todas as 5 imagens para melhor visualização

---

**Pronto para criar produtos?** 🎉

Acesse agora: `http://localhost:3000/create-product`

Qualquer dúvida, consulte os guias completos no repositório!
