(async () => {
  try {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000/api';
  const { productService } = require('/workspaces/ShopInitial/FrontEnd/lib/services/productService');

    console.log('Chamando productService.getProducts() com NEXT_PUBLIC_API_URL=http://localhost:3000/api');
    const res = await productService.getProducts();
    console.log('Resposta recebida: items=', Array.isArray(res.items) ? res.items.length : 'no items', 'total=', res.total, 'page=', res.page, 'limit=', res.limit);
    // Print first product id and name
    if (Array.isArray(res.items) && res.items.length > 0) {
      console.log('Primeiro produto:', { id: res.items[0].id, name: res.items[0].name });
    }
  } catch (err) {
    console.error('Erro ao chamar productService:', err);
    process.exit(1);
  }
})();
