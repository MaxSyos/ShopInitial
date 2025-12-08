# Correção: Cores dos Selects em Modo Dark

## 📝 Problema
Os selects de categoria e marca no formulário de criação de produtos não estavam acompanhando as cores do modo dark, resultando em texto branco em fundo branco ou outros problemas de legibilidade.

## ✅ Solução Implementada

### 1. CSS Customizado Global (`styles/globals.css`)
Adicionado CSS para controlar o estilo dos `<select>` e `<option>` no modo dark:

```css
/* Select styling for dark mode */
select {
  color-scheme: light;
}

.dark select {
  color-scheme: dark;
  background-color: rgb(var(--color-bg-side));
  color: rgb(var(--color-text-base));
}

.dark select option {
  background-color: rgb(var(--color-bg-side));
  color: rgb(var(--color-text-base));
}

.dark select option:checked {
  background-color: rgb(var(--color-primary) / 1);
  color: white;
}
```

**O que isso faz:**
- `color-scheme: light/dark` - Informa ao navegador qual esquema de cores usar
- No modo dark: background usa `--color-bg-side` e texto usa `--color-text-base`
- Options (itens do select) também herdam as cores corretas
- Opção selecionada `:checked` usa a cor primária com texto branco para destaque

### 2. Classes Tailwind no ProductForm
Adicionado `dark:bg-palette-card` aos selects para garantir background correto:

**Antes:**
```tsx
className="w-full px-4 py-2 border border-palette-primary rounded-lg bg-palette-fill text-palette-base focus:outline-none focus:ring-2 focus:ring-palette-primary transition"
```

**Depois:**
```tsx
className="w-full px-4 py-2 border border-palette-primary rounded-lg bg-palette-fill text-palette-base focus:outline-none focus:ring-2 focus:ring-palette-primary transition dark:bg-palette-card"
```

## 🎨 Resultado

### Modo Light
- Background branco suave (`bg-palette-fill`)
- Texto escuro (`text-palette-base`)
- Border primária

### Modo Dark
- Background dark (`bg-palette-card` = `#1e293b`)
- Texto claro (`text-palette-base` = `#e2e8f0`)
- Border primária
- Opção selecionada com fundo primário e texto branco

## 🔧 Arquivos Modificados

1. **`/FrontEnd/styles/globals.css`**
   - Adicionado CSS para select dark mode no final do arquivo

2. **`/FrontEnd/components/productForm/ProductForm.tsx`**
   - Adicionado `dark:bg-palette-card` ao select de categoria
   - Adicionado `dark:bg-palette-card` ao select de marca

## 🧪 Como Testar

1. Abra a página `/create-product`
2. Alterne entre modo light e dark (ícone da lua/sol no header)
3. Verifique que:
   - Os selects mudam de cor corretamente
   - O texto é legível em ambos os modos
   - As opções abertas têm contraste adequado
   - A opção selecionada é destacada com a cor primária

## 💡 Detalhes Técnicos

### Por que `color-scheme` é importante?
- Controla como o navegador renderiza elementos nativos como `<select>`
- No modo dark, o navegador usar seus estilos dark automáticos se não especificado
- Com `color-scheme: dark`, o navegador adapta dropdown e scrollbars

### Por que CSS puro e não apenas Tailwind?
- Tailwind não consegue estilizar nativamente elementos `<option>` dentro de `<select>`
- CSS puro com `:checked` pseudo-selector permite controle total
- A propriedade `color-scheme` só funciona com CSS nativo

## ✨ Resultado Visual

**Light Mode:**
```
┌─ Categoria ─────────┐
│ (dropdown claro)    │
└─────────────────────┘
```

**Dark Mode:**
```
┌─ Categoria ─────────┐
│ (dropdown escuro)   │
│ ▼ Texto claro       │
└─────────────────────┘
```

---
**Data:** Dezembro 2025  
**Versão:** 1.0  
**Status:** ✅ Implementado e Testado
