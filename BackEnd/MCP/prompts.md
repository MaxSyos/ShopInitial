# Prompts para o MCP Server do Mercado Pago

Aqui você pode adicionar seus prompts para interagir com o MCP server. 
Exemplos de prompts que você pode usar:

1. Para consultar um pagamento:
```
Consulte o status do pagamento com ID: [ID_DO_PAGAMENTO]
```

2. Para criar um pagamento:
```
Crie um pagamento com os seguintes detalhes:
- Valor: [VALOR]
- Descrição: [DESCRIÇÃO]
- Email do cliente: [EMAIL]
```

3. Para cancelar um pagamento:
```
Cancele o pagamento com ID: [ID_DO_PAGAMENTO]
```

Lembre-se de substituir os valores entre colchetes pelos dados reais que você deseja usar.

---
Importante: Não se esqueça de substituir <ACCESS_TOKEN> no arquivo mcp.json pelo seu token de acesso real do Mercado Pago.
