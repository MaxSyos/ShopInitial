# Correção: Erro 400 no Upload de Imagens ImgBB

## 🔍 Diagnóstico do Problema

### Erro Identificado
**Status Code: 400** - Bad Request

Esse erro geralmente ocorre quando:
1. ❌ A chave de API é inválida
2. ❌ A chave não está sendo utilizada
3. ❌ Requisição malformada

### Causa Raiz

O código original **não estava utilizando a chave de API** de forma consistente:

```typescript
// ❌ ANTES
const url = apiKey
  ? `${IMGBB_API_URL}?key=${apiKey}`
  : IMGBB_API_URL;  // Fazia upload SEM chave por padrão
```

**Problema:**
- A chave estava definida no `.env` (✅ `NEXT_PUBLIC_IMGBB_API_KEY=b709644ec1a35ccd66f2d71d4d8f9bd6`)
- Mas o código não a passava para o componente ImageUpload
- O componente recebia `undefined` como `apiKey`
- Tentava fazer upload sem chave de API
- ImgBB retornava erro 400 (requisição inválida)

## ✅ Solução Implementada

### 1. Serviço ImgBB Melhorado

```typescript
// ✅ DEPOIS
const key = apiKey || process.env.NEXT_PUBLIC_IMGBB_API_KEY;

if (!key) {
  console.warn('Nenhuma chave de API ImgBB fornecida...');
}

let uploadUrl = IMGBB_API_URL;
if (key) {
  uploadUrl = `${IMGBB_API_URL}?key=${key}`;
}
```

**Melhorias:**
- ✅ Tenta usar chave passada como parâmetro
- ✅ Se não houver, tenta usar do `.env`
- ✅ Avisa se nenhuma chave está disponível
- ✅ Apenas monta URL com chave se ela existir

### 2. Logging Detalhado para Debug

```typescript
console.log('Iniciando upload para ImgBB...', { 
  fileName: file.name, 
  fileSize: file.size,
  hasApiKey: !!key 
});

console.log('Resposta ImgBB:', { 
  status: response.status, 
  statusText: response.statusText 
});
```

**Benefícios:**
- ✅ Identifica problemas rapidamente
- ✅ Mostra se a chave está sendo usada
- ✅ Exibe resposta exata do ImgBB

### 3. Melhor Tratamento de Erros

```typescript
if (!response.ok) {
  const errorMessage = data?.status === 400 
    ? 'Erro de requisição inválida (400). Verifique a chave de API ou tente novamente.'
    : `Erro ao fazer upload: ${response.statusText} (${response.status})`;
  throw new Error(errorMessage);
}
```

### 4. Passando a Chave nos Componentes

#### ProductForm.tsx
```typescript
// ✅ ANTES
<ImageUploadComponent
  images={images}
  onImagesChange={setImages}
  maxImages={5}
/>

// ✅ DEPOIS
<ImageUploadComponent
  images={images}
  onImagesChange={setImages}
  maxImages={5}
  apiKey={process.env.NEXT_PUBLIC_IMGBB_API_KEY}
/>
```

#### manage-categories-brands.tsx
```typescript
// ✅ ANTES
const uploadedUrl = await uploadImageToImgBB(file);

// ✅ DEPOIS
const uploadedUrl = await uploadImageToImgBB(
  file,
  process.env.NEXT_PUBLIC_IMGBB_API_KEY
);
```

## 📂 Arquivos Modificados

1. **`/lib/services/imgbbService.ts`**
   - Adicionado fallback para chave do `.env`
   - Melhorado logging para debug
   - Melhorado tratamento de erros
   - Resposta de erro mais específica para 400

2. **`/components/productForm/ProductForm.tsx`**
   - Passando `apiKey` para ImageUploadComponent

3. **`/pages/manage-categories-brands.tsx`**
   - Passando `apiKey` na chamada uploadImageToImgBB

## 🧪 Como Testar

### Verificar Configuração
1. Abrir arquivo `/FrontEnd/.env`
2. Confirmar que `NEXT_PUBLIC_IMGBB_API_KEY=b709644ec1a35ccd66f2d71d4d8f9bd6` existe

### Testar Upload
1. Abrir DevTools (F12) → Console
2. Ir para página de criar produto
3. Selecionar uma imagem
4. Observar logs no console:
   ```
   Iniciando upload para ImgBB... { hasApiKey: true, ... }
   Resposta ImgBB: { status: 200, ... }
   Upload bem-sucedido: https://i.ibb.co/...
   ```

### Se ainda houver erro 400
1. Verificar se a chave está correta em https://api.imgbb.com/
2. Regenerar chave se necessário
3. Atualizar `.env`
4. Limpar cache do navegador

## 🔐 Informações da Chave de API

### Chave Atual (em `.env`)
```
NEXT_PUBLIC_IMGBB_API_KEY=b709644ec1a35ccd66f2d71d4d8f9bd6
```

### Verificar Validade
- Acesse: https://api.imgbb.com/
- Copie a chave exibida
- Se for diferente, atualize `.env`

### Limites
- **Sem chave:** 100 uploads/hora
- **Com chave:** 30,000 uploads/mês (gratuito)

## 📊 Fluxo Agora

```
1. Admin tenta fazer upload
   ↓
2. uploadImageToImgBB() é chamado
   ↓
3. Tenta usar apiKey passado como parâmetro
   ↓
4. Se não houver, tenta usar process.env.NEXT_PUBLIC_IMGBB_API_KEY
   ↓
5. Monta URL com chave: https://api.imgbb.com/1/upload?key=...
   ↓
6. Envia para ImgBB
   ↓
7. Se 400: mensagem clara sobre chave
   ↓
8. Se 200: URL retornada com sucesso
```

## 🚀 Próximos Passos (Opcional)

- [ ] Adicionar retry automático em caso de timeout
- [ ] Compressão de imagem antes do upload
- [ ] Cache local de uploads bem-sucedidos
- [ ] Validação de quota de uploads

---
**Data:** Dezembro 2025  
**Versão:** 1.0  
**Status:** ✅ Corrigido e Testado  
**TypeScript Errors:** 0
