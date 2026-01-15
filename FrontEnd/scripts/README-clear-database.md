# Script de Limpeza do Banco de Dados

Este script permite limpar completamente todas as collections do banco de dados MongoDB usado pelo projeto ZiShop.

## Como usar

### Opção 1: Via npm script (recomendado)
```bash
cd FrontEnd
npm run clear-db
# ou
yarn clear-db
```

### Opção 2: Executar diretamente
```bash
cd FrontEnd
node scripts/clear-database.js
```

## O que o script faz

O script limpa todas as collections na seguinte ordem (para respeitar as dependências):

1. **Email** - Emails da newsletter
2. **Setting** - Configurações do sistema
3. **CategoryGrid** - Grid de categorias da homepage
4. **Offer** - Ofertas e descontos
5. **CarouselImage** - Imagens do carrossel
6. **Banner** - Banners promocionais
7. **Favorite** - Produtos favoritos dos usuários
8. **CartItem** - Itens dos carrinhos
9. **Cart** - Carrinhos de compras
10. **OrderItemListRow** - Linhas das listas de itens de pedidos
11. **OrderItemList** - Listas de itens de pedidos
12. **OrderItem** - Itens dos pedidos
13. **Order** - Pedidos
14. **Address** - Endereços dos usuários
15. **Review** - Avaliações dos produtos
16. **Image** - Imagens dos produtos
17. **Product** - Produtos
18. **Brand** - Marcas
19. **Category** - Categorias
20. **RefreshToken** - Tokens de refresh
21. **User** - Usuários

## ⚠️ Avisos importantes

- **Este script remove TODOS os dados do banco de dados**
- **Não há como recuperar os dados após a execução**
- **Use apenas em ambientes de desenvolvimento/teste**
- **Faça backup dos dados importantes antes de executar**

## Cenários de uso

- Limpar dados de teste antes de executar o seed
- Resetar completamente o banco para desenvolvimento
- Preparar o banco para uma nova instalação

## Exemplo de uso combinado

```bash
# Limpar dados existentes
npm run clear-db

# Executar o seed para popular com dados de exemplo
npm run prisma:seed
```