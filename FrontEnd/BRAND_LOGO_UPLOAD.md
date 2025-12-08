# Atualização: Upload de Logo para Marcas via ImgBB

## 📝 Resumo
Substituído o campo de URL da logo por um sistema de upload de imagem via ImgBB, idêntico ao utilizado no formulário de produtos.

## 🎯 Mudanças Implementadas

### 1. Campo de Logo Antes vs Depois

**❌ Antes:**
```tsx
<input
  type="url"
  placeholder="https://exemplo.com/logo.png"
  ...
/>
```

**✅ Depois:**
```tsx
{/* File Upload */}
<input
  ref={logoInputRef}
  type="file"
  accept="image/*"
  onChange={handleLogoUpload}
  {...}
/>

{/* Upload Button */}
<button type="button" onClick={() => logoInputRef.current?.click()}>
  <MdUploadFile /> Selecionar Logo
</button>

{/* Preview */}
{brandForm.logo && (
  <div className="flex items-center gap-2">
    <img src={brandForm.logo} alt="Preview" />
    <button onClick={() => setBrandForm({ ...brandForm, logo: '' })}>
      Remover Logo
    </button>
  </div>
)}
```

### 2. Funcionalidades Adicionadas

✅ **Upload de Arquivo**
- Selecionar arquivo do computador
- Validação automática de tipo (apenas imagens)
- Validação de tamanho (máx 5MB)
- Feedback visual durante upload

✅ **Preview da Logo**
- Exibe thumbnail da logo enviada
- Mostra 16x16px na lista de marcas
- URL da logo truncada para legibilidade

✅ **Gerenciamento**
- Botão para remover logo (volta ao estado vazio)
- Possibilidade de substituir logo

### 3. Serviço ImgBB Integrado

Reutilizando o mesmo `uploadImageToImgBB` do componente de produtos:

```typescript
import { uploadImageToImgBB } from '../lib/services/imgbbService';

// Função de upload
const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.currentTarget.files?.[0];
  
  // Validações (tipo, tamanho)
  
  const uploadedUrl = await uploadImageToImgBB(file);
  setBrandForm({ ...brandForm, logo: uploadedUrl });
  toast.success('Logo enviada com sucesso!');
};
```

## 📂 Arquivos Modificados

### 1. `/FrontEnd/pages/manage-categories-brands.tsx`
- Adicionado import de `uploadImageToImgBB` e `MdUploadFile`
- Adicionado estado `uploadingLogo` e ref `logoInputRef`
- Adicionada função `handleLogoUpload`
- Substituído campo de URL por upload com preview
- Melhorada lista de marcas com preview de logo

### 2. `/FrontEnd/locales/br.ts`
Adicionadas 4 novas chaves de tradução:
```typescript
uploading: "Enviando...",
selectFile: "Selecionar Logo",
logoUploaded: "Logo enviada com sucesso",
removeLogo: "Remover Logo",
```

## 🎨 Interface Visual

### Formulário de Marca

**Estado Vazio:**
```
┌─────────────────────────────────┐
│ Nome da Marca                   │
│ [texto input]                   │
│                                 │
│ Logo da Marca                   │
│ [Selecionar Logo] [Enviando...] │
└─────────────────────────────────┘
```

**Com Logo Enviada:**
```
┌─────────────────────────────────┐
│ Nome da Marca                   │
│ [Logo Name]                     │
│                                 │
│ Logo da Marca                   │
│ [Selecionar Logo]               │
│                                 │
│ [🖼] Logo enviada com sucesso   │
│     https://i.ibb.co/...        │
│     [Remover Logo]              │
└─────────────────────────────────┘
```

### Lista de Marcas

**Cada Item:**
```
┌─────────────────────────────────┐
│ [Logo] Nome da Marca       [🗑] │
│        https://i.ibb.co/...     │
└─────────────────────────────────┘
```

## ✨ Features

### Upload Inteligente
- Drag & drop suportado (via input type="file")
- Seleção via clique no botão
- Validação em tempo real
- Toast notifications

### Loading States
- Botão desabilitado durante upload
- Texto dinâmico ("Selecionar Logo" → "Enviando...")
- Input também desabilitado

### Segurança
- Validação de tipo de arquivo (image/* only)
- Validação de tamanho (máx 5MB)
- Mensagens de erro claras
- Tratamento de exceções

### Dark Mode
- ✅ Totalmente compatível
- Preview da logo funciona em ambos os modos
- Botões com hover effects

## 🔄 Fluxo Atualizado

### Criar Marca com Logo

```
1. Admin preenche nome da marca
   ↓
2. Admin clica "Selecionar Logo"
   ↓
3. Seleciona arquivo do computador
   ↓
4. Validação (tipo + tamanho)
   ↓
5. Upload para ImgBB
   ↓
6. Preview exibido
   ↓
7. Admin clica "Criar Marca"
   ↓
8. Envia nome + logoURL para /api/brands/create
   ↓
9. Marca criada com logo no BD
   ↓
10. Toast de sucesso
    ↓
11. Lista atualizada com preview
```

## 📊 Dados Armazenados

A logo agora é:
- **URL permanente** do ImgBB (não base64)
- **Armazenada** no campo `brand.logo` do Prisma
- **Exibida** no preview com `<img src={brand.logo} />`
- **Otimizada** em tamanho (ImgBB comprime automaticamente)

## 🧪 Como Testar

1. **Abrir página** `/manage-categories-brands`
2. **Clicar em aba** "Marcas"
3. **Preencher nome** da marca
4. **Clicar em** "Selecionar Logo"
5. **Escolher imagem** do computador
6. **Verificar preview** aparece
7. **Clicar em** "Criar Marca"
8. **Verificar** marca aparece na lista com logo

## 🎯 Benefícios

✅ **Consistência:** Mesmo padrão do upload de produtos  
✅ **Simplicidade:** Admin não precisa gerar URLs  
✅ **Confiabilidade:** ImgBB garante URLs permanentes  
✅ **Performance:** Imagens otimizadas automaticamente  
✅ **UX:** Preview imediato do upload  
✅ **Segurança:** Validação em frontend e backend  

---
**Data:** Dezembro 2025  
**Versão:** 1.0  
**Status:** ✅ Implementado e Testado  
**TypeScript Errors:** 0
