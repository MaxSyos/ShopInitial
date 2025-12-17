# Implementação de CPF e WhatsApp no Perfil do Usuário

## 📋 Resumo das Mudanças

Foram adicionados dois novos campos ao perfil do usuário: **CPF** e **WhatsApp**, ambos com máscaras apropriadas e validação completa.

---

## 🔧 Alterações Realizadas

### 1. **Schema Prisma** (`prisma/schema.prisma`)
Adicionados dois campos opcionais ao modelo `User`:
```prisma
model User {
  id        String @id @map("_id") @default(auto()) @db.ObjectId
  email     String @unique
  name      String
  password  String
  cpf       String?        // ✨ NOVO
  whatsapp  String?        // ✨ NOVO
  role      String @default("USER")
  ...
}
```

### 2. **Utilidades de Máscaras** (`utilities/masks.ts`) ✨ NOVO
Arquivo com funções para formatação e validação de CPF e WhatsApp:

#### Funções para CPF:
- `maskCPF(value)` - Aplica máscara XXX.XXX.XXX-XX
- `unmaskCPF(value)` - Remove máscara, retorna apenas números
- `isValidCPFFormat(cpf)` - Valida formato (11 dígitos)

#### Funções para WhatsApp:
- `maskWhatsApp(value, includeCountryCode)` - Aplica máscara (+55) 11 99999-9999
- `unmaskWhatsApp(value)` - Remove máscara, retorna apenas números
- `isValidWhatsAppFormat(phone)` - Valida formato (11 ou 13 dígitos)
- `formatWhatsAppForAPI(phone)` - Formata para API com código do país

### 3. **API - Atualização de Perfil** (`pages/api/auth/update.ts`)
Endpoint PUT/PATCH `/auth/update` agora aceita:
```typescript
{
  name: string,        // obrigatório
  cpf?: string,        // opcional, será desmascado e validado
  whatsapp?: string    // opcional, será desmascado e validado
}
```

**Validações implementadas:**
- CPF: Exatamente 11 dígitos
- WhatsApp: 11 dígitos (local) ou 13 dígitos (com código país)
- Ambos são armazenados sem máscara no banco (apenas números)
- WhatsApp é armazenado com código do país (55) se não tiver

### 4. **API - Registro** (`pages/api/auth/register.ts`)
Endpoint POST `/auth/register` agora aceita opcionalmente:
```typescript
{
  name: string,        // obrigatório
  email: string,       // obrigatório
  password: string,    // obrigatório
  cpf?: string,        // opcional
  whatsapp?: string    // opcional
}
```

Mesmas validações do endpoint de atualização.

### 5. **API - Dados do Usuário** (`pages/api/auth/me.ts`)
Agora retorna os novos campos:
```typescript
{
  user: {
    id: string,
    name: string,
    email: string,
    cpf?: string,      // ✨ NOVO
    whatsapp?: string, // ✨ NOVO
    role: string
  }
}
```

### 6. **Frontend - Página de Perfil** (`pages/profile.tsx`)
Adicionados dois novos campos no formulário de dados da conta:

#### Campo CPF:
- Máscara automática: `XXX.XXX.XXX-XX`
- Validação em tempo real
- Mensagem de erro se inválido
- Máximo 14 caracteres

#### Campo WhatsApp:
- Máscara automática: `(+55) 11 99999-9999`
- Suporta código de país
- Validação em tempo real
- Mensagem de erro se inválido
- Máximo 20 caracteres

**Comportamentos:**
- Carrega valores do usuário logado (com máscara)
- Desmascara antes de enviar para API
- Valida ao salvar o perfil
- Campos opcionais (podem ser deixados em branco)
- Limpar campo envia valor nulo para API

---

## 📦 Armazenamento no Banco de Dados

| Campo | Tipo | Exemplo | Máscara |
|-------|------|---------|---------|
| CPF | String (11 dígitos) | `12345678901` | `123.456.789-01` |
| WhatsApp | String (13 dígitos com 55) | `5511999999999` | `(+55) 11 99999-9999` |

---

## 🧪 Como Testar

### 1. **Teste Local**
```bash
cd /workspaces/ShopInitial/FrontEnd
yarn dev
```

### 2. **Teste Manual no Navegador**
1. Acesse `/profile`
2. Preencha o campo CPF: Digite `12345678901` → Será formatado como `123.456.789-01`
3. Preencha o campo WhatsApp: Digite `11999999999` → Será formatado como `(+55) 11 99999-9999`
4. Clique em "Salvar"
5. Valores no banco estarão sem máscara (apenas números)

### 3. **Teste via API**
```bash
# Atualizar perfil
curl -X PUT http://localhost:3000/api/auth/update \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "cpf": "123.456.789-01",
    "whatsapp": "(+55) 11 99999-9999"
  }'

# Resposta esperada
{
  "user": {
    "id": "...",
    "name": "João Silva",
    "email": "email@example.com",
    "cpf": "12345678901",
    "whatsapp": "5511999999999",
    "role": "USER"
  }
}
```

---

## ✅ Checklist de Verificação

- [x] Schema Prisma atualizado
- [x] Prisma Client regenerado
- [x] Funções de máscara criadas e testadas
- [x] Endpoint `/auth/update` atualizado
- [x] Endpoint `/auth/register` atualizado
- [x] Endpoint `/auth/me` atualizado
- [x] Página de perfil com novos campos
- [x] Validações em tempo real funcionando
- [x] Testes básicos passando
- [x] Documentação completa

---

## 🔐 Segurança

- ✅ Validação de formato no frontend e backend
- ✅ Dados armazenados sem máscara (apenas números)
- ✅ Proteção de rota com autenticação JWT
- ✅ Campos opcionais (não quebram compatibilidade com dados antigos)

---

## 📝 Notas Importantes

1. **Compatibilidade**: Usuários existentes terão `cpf` e `whatsapp` como `null` - Completamente seguro
2. **Formato de Armazenamento**: CPF e WhatsApp são armazenados sem máscara no banco para facilitar buscas e integração com APIs
3. **Máscaras Dinâmicas**: As máscaras aplicadas no frontend são apenas para UI - a validação é feita no backend
4. **WhatsApp com Código País**: Sempre armazenado com prefixo `55` para facilitar integração com APIs de mensagem

---

## 🚀 Próximos Passos (Opcional)

Se desejar expandir no futuro:
- [ ] Adicionar validação de CPF via algoritmo de dígito verificador
- [ ] Integração com Twilio ou semelhante para envio de mensagens
- [ ] Campo de telefone alternativo
- [ ] Validação de WhatsApp via OTP

---

**Data da Implementação**: 17 de Dezembro de 2025  
**Status**: ✅ Completo e Testado
