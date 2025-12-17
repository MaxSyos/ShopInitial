# 🧪 Guia Rápido de Testes - Campos Faltando do Perfil

## 📋 Resumo

Quando um usuário acessa `/shipping-address` sem ter todos os campos do perfil preenchidos (name, cpf, whatsapp), uma seção aparece no topo da página para que ele preencha apenas os campos que estão faltando.

---

## 🚀 Pré-requisitos

- [ ] `yarn dev` rodando
- [ ] Usuário autenticado
- [ ] Carrinho com itens
- [ ] Um ou mais campos do perfil faltando (name, cpf ou whatsapp)

---

## 🧪 Testes Manuais

### Teste 1: Detectar Campos Faltando

**Setup:**
1. Crie um novo usuário sem preencher CPF nem WhatsApp
2. Confirme que o campo `name` está preenchido

**Ação:**
1. Acesse `/shopping-address`

**Resultado esperado:**
- ✓ Seção azul aparece no topo
- ✓ Contém APENAS os campos CPF e WhatsApp
- ✓ Campo Nome NÃO aparece (já preenchido)

---

### Teste 2: Preenchimento de Campo com Máscara (CPF)

**Setup:**
- Veja a seção de campos faltando com campo CPF visível

**Ação:**
1. Clique no campo CPF
2. Digite: `12345678901` (11 dígitos, sem máscara)

**Resultado esperado:**
- ✓ Enquanto digita, vê: `1` → `12` → `123.4` → `123.45` → ... → `123.456.789-01`
- ✓ Máscara aplicada automaticamente

---

### Teste 3: Preenchimento de Campo com Máscara (WhatsApp)

**Setup:**
- Veja a seção de campos faltando com campo WhatsApp visível

**Ação:**
1. Clique no campo WhatsApp
2. Digite: `11999999999` (11 dígitos)

**Resultado esperado:**
- ✓ Enquanto digita, vê: `(+55) 11` → `(+55) 11 9` → ... → `(+55) 11 99999-9999`
- ✓ Máscara com código de país aplicada

---

### Teste 4: Validação - CPF Inválido

**Setup:**
- Veja a seção com campo CPF

**Ação:**
1. Digite `1234567` (menos de 11 dígitos)
2. Clique "Salvar e Continuar"

**Resultado esperado:**
- ✓ Mensagem de erro em vermelho: "CPF inválido. Deve conter 11 dígitos"
- ✓ Campo permanece visível
- ✓ Não faz requisição à API

---

### Teste 5: Validação - WhatsApp Inválido

**Setup:**
- Veja a seção com campo WhatsApp

**Ação:**
1. Digite `119999` (menos de 11 dígitos)
2. Clique "Salvar e Continuar"

**Resultado esperado:**
- ✓ Mensagem de erro em vermelho: "WhatsApp inválido. Deve conter 11 ou 13 dígitos"
- ✓ Campo permanece visível

---

### Teste 6: Salvamento Bem-Sucedido

**Setup:**
- Veja a seção com campos CPF e WhatsApp

**Ação:**
1. Preencha CPF: `123.456.789-01`
2. Preencha WhatsApp: `(+55) 11 99999-9999`
3. Clique "Salvar e Continuar"

**Resultado esperado:**
- ✓ Botão mostra "Salvando..." (desabilitado)
- ✓ Toast verde: "Dados do perfil atualizados com sucesso!"
- ✓ Seção desaparece completamente
- ✓ Usuário vê apenas a seleção de endereço
- ✓ Dados foram salvos no banco (verificar via API ou Profile)

---

### Teste 7: Recarregar Página

**Setup:**
- Preencha e salve os campos do perfil

**Ação:**
1. Após sucesso, recarregue a página (F5)

**Resultado esperado:**
- ✓ Seção de campos faltando NÃO aparece
- ✓ Dados foram salvos permanentemente no banco

---

### Teste 8: Múltiplos Campos Faltando

**Setup:**
1. Crie um usuário com NENHUM campo preenchido (name, cpf, whatsapp)

**Ação:**
1. Acesse `/shipping-address`

**Resultado esperado:**
- ✓ Seção mostra 3 campos: Nome, CPF, WhatsApp
- ✓ Todos são obrigatórios
- ✓ Preencha todos
- ✓ Clique "Salvar e Continuar"
- ✓ Todos os 3 campos são salvos

---

### Teste 9: Apenas Campo Nome Faltando

**Setup:**
1. Crie usuário com CPF e WhatsApp preenchidos
2. Mas sem Name preenchido (ou nome vazio)

**Ação:**
1. Acesse `/shipping-address`

**Resultado esperado:**
- ✓ Seção mostra APENAS campo Nome
- ✓ CPF e WhatsApp não aparecem
- ✓ Preencha o Nome
- ✓ Salve
- ✓ Seção desaparece

---

### Teste 10: Validação Nome Vazio

**Setup:**
- Veja a seção com campo Nome

**Ação:**
1. Deixe campo Nome vazio
2. Clique "Salvar e Continuar"

**Resultado esperado:**
- ✓ Mensagem de erro: "Nome é obrigatório"
- ✓ Campo permanece visível

---

### Teste 11: Erro de Conexão com API

**Setup:**
- Desligar a API (simular erro)

**Ação:**
1. Preencha todos os campos
2. Clique "Salvar e Continuar"

**Resultado esperado:**
- ✓ Botão mostra "Salvando..."
- ✓ Toast vermelho com erro da API
- ✓ Seção permanece visível (para tentar novamente)

---

### Teste 12: Fluxo Completo do Usuário

**Setup:**
- Usuário autenticado com carrinho
- Sem CPF preenchido

**Ação:**
1. Acesse `/shipping-address`
2. Veja seção com campo CPF
3. Preencha: `123.456.789-01`
4. Clique "Salvar e Continuar"
5. Seção desaparece
6. Selecione ou crie endereço de entrega
7. Clique "Continuar para Pagamento"
8. Continue até `/payment/[id]`

**Resultado esperado:**
- ✓ Fluxo é contínuo sem interrupções
- ✓ CPF foi salvo e aparece em `/profile`
- ✓ Nenhum erro em nenhuma etapa

---

## 📊 Matriz de Testes

| # | Teste | Campo | Ação | Resultado Esperado |
|---|-------|-------|------|------------------|
| 1 | Detectar | CPF, WhatsApp | Acessar | Seção aparece ✓ |
| 2 | Máscara CPF | CPF | Digite 12345678901 | Vê 123.456.789-01 ✓ |
| 3 | Máscara WhatsApp | WhatsApp | Digite 11999999999 | Vê (+55) 11 99999-9999 ✓ |
| 4 | Validação | CPF | <11 dígitos + Salvar | Erro exibido ✓ |
| 5 | Validação | WhatsApp | <11 dígitos + Salvar | Erro exibido ✓ |
| 6 | Salvar | Todos | Preencher + Salvar | Sucesso + Seção some ✓ |
| 7 | Persistência | Todos | Reload | Dados persistem ✓ |
| 8 | Múltiplos | All 3 | Preencher All | All salvos ✓ |
| 9 | Apenas Nome | Nome | Preencher | Salvo ✓ |
| 10 | Validação | Nome | Vazio + Salvar | Erro exibido ✓ |
| 11 | Erro API | Todos | Falhar API | Toast erro ✓ |
| 12 | Fluxo | Todos | Completo | Continua pagamento ✓ |

---

## ✅ Checklist de Validação

- [ ] Seção aparece quando campos faltam
- [ ] Seção não aparece quando tudo preenchido
- [ ] Máscaras funcionam (CPF e WhatsApp)
- [ ] Validação de CPF funciona
- [ ] Validação de WhatsApp funciona
- [ ] Validação de Nome funciona
- [ ] Salvamento funciona
- [ ] Dados persistem (reload)
- [ ] Seção desaparece após sucesso
- [ ] Erros são exibidos corretamente
- [ ] Toast de sucesso aparece
- [ ] Fluxo completo funciona (até pagamento)
- [ ] Sem erros no console
- [ ] Sem erros TypeScript

---

## 🔍 DevTools - O que Observar

### Console (F12 > Console)
- ✓ Não deve ter erros vermelhos
- ✓ Pode ter warnings (normal)
- ✓ Logs: "POST /auth/update" quando salva

### Network (F12 > Network)
- ✓ Requisição: `PUT /api/auth/update`
- ✓ Status: 200 (sucesso)
- ✓ Response: `{ user: { cpf: "...", whatsapp: "..." } }`

### Elements (F12 > Elements)
- ✓ Encontre a seção azul com id/class apropriado
- ✓ Verifique se desaparece após sucesso

---

## 🐛 Troubleshooting

### Problema: Seção não aparece quando deve
**Solução:**
1. Verifique se `missingProfileFields` não está vazio
2. Abra DevTools > Console e verifique
3. Recarregue a página
4. Limpe cache do navegador (Ctrl+Shift+Delete)

### Problema: Máscara não funciona
**Solução:**
1. Verifique se `utilities/masks.ts` foi criado
2. Verifique se imports estão corretos
3. Recarregue a página

### Problema: Salvamento falha
**Solução:**
1. Verifique se API `/auth/update` está funcionando
2. Verifique Network > POST /api/auth/update
3. Verifique se token JWT é válido
4. Verifique console por erros

### Problema: Seção não desaparece após salvar
**Solução:**
1. Verifique se chamada à API retornou sucesso (200)
2. Verifique console por erros
3. Verifique se `setMissingProfileFields([])` foi chamado

---

## 📝 Notas

- Todos os campos faltando são OBRIGATÓRIOS
- Máscaras são apenas para UI, dados salvam sem máscara
- Seção aparece automaticamente, sem necessidade de ação do usuário
- Após salvar com sucesso, usuário continua fluxo normalmente

---

**Última Atualização**: 17 de Dezembro de 2025  
**Status**: ✅ Pronto para Testes
