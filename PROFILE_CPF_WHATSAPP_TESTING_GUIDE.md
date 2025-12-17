# 🧪 Guia Completo de Testes - CPF e WhatsApp

## 🎯 Objetivo
Testar a implementação dos campos CPF e WhatsApp em diferentes cenários.

---

## 📋 Pré-requisitos

1. ✅ `yarn dev` rodando em `/workspaces/ShopInitial/FrontEnd`
2. ✅ Usuário autenticado no sistema
3. ✅ Acesso à página `/profile`

---

## 🧪 Testes Manuais

### Teste 1: Máscara CPF - Formatação Automática
**Passo a passo:**
1. Acesse `/profile`
2. Localize o campo "CPF"
3. Digite: `12345678901` (sem máscara)
4. **Resultado esperado**: Campo mostra `123.456.789-01` ✓

**Variações para testar:**
```
Input                  → Esperado
"123"                  → "123"
"123456"               → "123.456"
"123456789"            → "123.456.789"
"12345678901"          → "123.456.789-01"
"123456789012" (extra) → "123.456.789-01" (trunca)
```

---

### Teste 2: Máscara WhatsApp - Formatação Automática
**Passo a passo:**
1. Acesse `/profile`
2. Localize o campo "WhatsApp"
3. Digite: `11999999999` (sem máscara)
4. **Resultado esperado**: Campo mostra `(+55) 11 99999-9999` ✓

**Variações para testar:**
```
Input                  → Esperado
"11"                   → "(+55) 11"
"1199"                 → "(+55) 11 99"
"119999999"            → "(+55) 11 99999-9999"
"5511999999999"        → "(+55) 11 99999-9999"
"(+55)1199"            → "(+55) 11 99"
```

---

### Teste 3: Validação CPF
**Teste 3.1: CPF Válido**
1. Campo CPF: `123.456.789-01`
2. Campo Nome: `João Silva`
3. Clique "Salvar"
4. **Resultado esperado**: Toast "Dados atualizados" ✓

**Teste 3.2: CPF Inválido (poucos dígitos)**
1. Campo CPF: `123.456.789-0` (10 dígitos)
2. Clique "Salvar"
3. **Resultado esperado**: Erro em vermelho "CPF inválido. Deve conter 11 dígitos" ✓
4. **Botão Salvar**: Desabilitado ou responde com erro da API

**Teste 3.3: CPF Vazio (Opcional)**
1. Deixe campo CPF vazio
2. Campo Nome: `João Silva`
3. Clique "Salvar"
4. **Resultado esperado**: Salva sem CPF (null no banco) ✓

---

### Teste 4: Validação WhatsApp
**Teste 4.1: WhatsApp Válido (11 dígitos)**
1. Campo WhatsApp: `(+55) 11 99999-9999`
2. Campo Nome: `João Silva`
3. Clique "Salvar"
4. **Resultado esperado**: Toast "Dados atualizados" ✓
5. **Verificação**: API retorna `whatsapp: "5511999999999"` (com prefixo 55)

**Teste 4.2: WhatsApp Válido (13 dígitos com código)**
1. Campo WhatsApp: `5511999999999`
2. Clique "Salvar"
3. **Resultado esperado**: Toast "Dados atualizados" ✓
4. **Verificação**: Sem alteração na formatação (já tem código 55)

**Teste 4.3: WhatsApp Inválido (poucos dígitos)**
1. Campo WhatsApp: `(11) 99999-999` (9 dígitos)
2. Clique "Salvar"
3. **Resultado esperado**: Erro em vermelho "WhatsApp inválido. Deve conter 11 ou 13 dígitos" ✓

**Teste 4.4: WhatsApp Vazio (Opcional)**
1. Deixe campo WhatsApp vazio
2. Clique "Salvar"
3. **Resultado esperado**: Salva sem WhatsApp (null no banco) ✓

---

### Teste 5: Recarregar Página e Verificar Persistência
**Passo a passo:**
1. Preencha CPF: `123.456.789-01`
2. Preencha WhatsApp: `(+55) 11 99999-9999`
3. Clique "Salvar" → Toast "Dados atualizados"
4. Aguarde 2 segundos
5. Recarregue a página (F5)
6. **Resultado esperado**: 
   - Campos carregam com máscaras aplicadas ✓
   - CPF mostra: `123.456.789-01` ✓
   - WhatsApp mostra: `(+55) 11 99999-9999` ✓

---

### Teste 6: Limpar Campos
**Teste 6.1: Limpar CPF**
1. Campo CPF preenchido: `123.456.789-01`
2. Limpe o campo completamente (delete tudo)
3. Clique "Salvar"
4. **Resultado esperado**: Salva com CPF = null ✓
5. Recarregue página → Campo vazio

**Teste 6.2: Limpar WhatsApp**
1. Campo WhatsApp preenchido: `(+55) 11 99999-9999`
2. Limpe o campo completamente
3. Clique "Salvar"
4. **Resultado esperado**: Salva com WhatsApp = null ✓
5. Recarregue página → Campo vazio

---

### Teste 7: Mistura de Dígitos e Caracteres (Remover automático)
**CPF:**
1. Digite: `123#456-789/01` (com caracteres especiais)
2. **Resultado esperado**: Campo mostra `123.456.789-01` ✓
3. Salve → Armazenado como `12345678901` (apenas números)

**WhatsApp:**
1. Digite: `+55 (11) 9999#9-9999` (com caracteres especiais)
2. **Resultado esperado**: Campo mostra `(+55) 11 99999-9999` ✓
3. Salve → Armazenado como `5511999999999` (apenas números)

---

## 🔌 Testes via API (cURL)

### Setup: Obter Token
```bash
# 1. Fazer login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu_email@example.com",
    "password": "sua_senha"
  }'

# Copie o accessToken da resposta
# Exemplo: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
TOKEN="seu_token_aqui"
```

### Teste API 1: Atualizar com CPF
```bash
curl -X PUT http://localhost:3000/api/auth/update \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "cpf": "123.456.789-01",
    "whatsapp": ""
  }'

# Resposta esperada:
{
  "user": {
    "id": "65a1b2c3d4e5f6g7h8i9j0",
    "name": "João Silva",
    "email": "joao@example.com",
    "cpf": "12345678901",
    "whatsapp": null,
    "role": "USER"
  }
}
```

### Teste API 2: Atualizar com WhatsApp
```bash
curl -X PUT http://localhost:3000/api/auth/update \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "cpf": "",
    "whatsapp": "(+55) 11 99999-9999"
  }'

# Resposta esperada:
{
  "user": {
    "id": "65a1b2c3d4e5f6g7h8i9j0",
    "name": "João Silva",
    "email": "joao@example.com",
    "cpf": null,
    "whatsapp": "5511999999999",  // Nota: com prefixo 55
    "role": "USER"
  }
}
```

### Teste API 3: Atualizar Ambos
```bash
curl -X PUT http://localhost:3000/api/auth/update \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria Santos",
    "cpf": "98765432101",
    "whatsapp": "11988888888"
  }'

# Resposta esperada:
{
  "user": {
    "id": "65a1b2c3d4e5f6g7h8i9j0",
    "name": "Maria Santos",
    "email": "maria@example.com",
    "cpf": "98765432101",
    "whatsapp": "5511988888888",  // Adicionado prefixo 55
    "role": "USER"
  }
}
```

### Teste API 4: Validação de Erro (CPF Inválido)
```bash
curl -X PUT http://localhost:3000/api/auth/update \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "cpf": "12345"  # Apenas 5 dígitos
  }'

# Resposta esperada (erro):
{
  "message": "CPF inválido. Deve conter 11 dígitos"
}
```

### Teste API 5: Validação de Erro (WhatsApp Inválido)
```bash
curl -X PUT http://localhost:3000/api/auth/update \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "whatsapp": "119999"  # Apenas 6 dígitos
  }'

# Resposta esperada (erro):
{
  "message": "WhatsApp inválido. Deve conter 11 ou 13 dígitos"
}
```

### Teste API 6: Obter Dados Usuário
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Resposta esperada:
{
  "user": {
    "id": "65a1b2c3d4e5f6g7h8i9j0",
    "name": "João Silva",
    "email": "joao@example.com",
    "cpf": "12345678901",        # ✨ NOVO
    "whatsapp": "5511999999999", # ✨ NOVO
    "role": "USER"
  }
}
```

---

## 🗄️ Verificação no Banco de Dados

Se tiver acesso direto ao MongoDB:

```javascript
// Conectar ao MongoDB
use onlineshop

// Verificar usuário
db.User.findOne({ email: "seu_email@example.com" })

// Resultado esperado:
{
  "_id": ObjectId("65a1b2c3d4e5f6g7h8i9j0"),
  "email": "seu_email@example.com",
  "name": "João Silva",
  "password": "$2b$10...",
  "cpf": "12345678901",        // Sem máscara
  "whatsapp": "5511999999999", // Com prefixo 55, sem máscara
  "role": "USER",
  "createdAt": ISODate("2025-12-17T10:00:00.000Z")
}
```

---

## 📊 Matriz de Testes

| # | Funcionalidade | Teste | Status | Resultado |
|---|---|---|---|---|
| 1 | Máscara CPF | Digite `12345678901` | ✓ | `123.456.789-01` |
| 2 | Máscara WhatsApp | Digite `11999999999` | ✓ | `(+55) 11 99999-9999` |
| 3 | Validação CPF | Salvar inválido | ✓ | Erro exibido |
| 4 | Validação WhatsApp | Salvar inválido | ✓ | Erro exibido |
| 5 | Persistência | Recarregar página | ✓ | Dados carregam com máscara |
| 6 | Limpar Campos | Salvar vazio | ✓ | Valores = null |
| 7 | Remove Especiais | Digite `123#456-789/01` | ✓ | `123.456.789-01` |
| 8 | API Update | PUT /auth/update | ✓ | Armazenado sem máscara |
| 9 | API Read | GET /auth/me | ✓ | Retorna valores sem máscara |
| 10 | Novo Cadastro | POST /auth/register | ✓ | Aceita CPF/WhatsApp opcionais |

---

## ✅ Checklist Final

Após completar todos os testes acima, marque como concluído:

- [ ] Máscara CPF funcionando
- [ ] Máscara WhatsApp funcionando
- [ ] Validação CPF funciona
- [ ] Validação WhatsApp funciona
- [ ] Persistência de dados funciona
- [ ] Limpar campos funciona
- [ ] API retorna dados corretos
- [ ] Banco de dados armazenando sem máscara
- [ ] Nenhum erro no console
- [ ] Compatível com dados antigos (null)

---

## 🚨 Troubleshooting

### Problema: Campo não aplica máscara
**Solução:**
1. Limpe cache do navegador (Ctrl+Shift+Delete)
2. Recarregue página (F5)
3. Verifique se `utilities/masks.ts` foi criado

### Problema: Máscara aplica mas não salva
**Solução:**
1. Abra DevTools (F12)
2. Verifique Console por erros
3. Verifique Network → Requisição PUT `/auth/update`
4. Verifique se resposta tem status 200

### Problema: Dados não carregam após salvar
**Solução:**
1. Verifique Network → Resposta da API
2. Confirme que API retorna `cpf` e `whatsapp`
3. Verifique se `/auth/me` foi atualizado

### Problema: Validação não funciona
**Solução:**
1. Abra DevTools (F12)
2. Verifique Console por erros
3. Confirme que `masks.ts` foi importado corretamente
4. Teste função diretamente no Console:
   ```javascript
   // No console do navegador
   import { isValidCPFFormat } from './utilities/masks'
   isValidCPFFormat('123.456.789-01') // deve retornar true
   ```

---

## 📞 Suporte

Se encontrar qualquer problema durante os testes:
1. Verifique este guia (seção Troubleshooting)
2. Revise a documentação em `PROFILE_CPF_WHATSAPP_IMPLEMENTATION.md`
3. Verifique erros no console (F12)
4. Verifique logs da API (terminal yarn dev)

---

**Última Atualização**: 17 de Dezembro de 2025
**Status**: ✅ Pronto para Produção
