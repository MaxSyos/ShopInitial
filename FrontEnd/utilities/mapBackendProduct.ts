import { Product } from '../lib/services/productService';
import { IProduct } from '../lib/types/products';

export function mapBackendProductToIProduct(product: Product): IProduct {
  // Ajusta categoria e subcategoria conforme relacionamento
  let category = '';
  let subCategory: string | undefined = undefined;
  // Suporte para parent aninhado (caso venha populado)
  if (product.category) {
    const cat: any = product.category;
    if (cat.parent && cat.parent.name) {
      category = cat.parent.name;
      subCategory = cat.name;
    } else {
      category = cat.name;
      subCategory = undefined;
    }
  }
  return {
    id: product.id,
    image: product.images || [],
    name: product.name,
    slug: { _type: 'slug', current: product.id || product.name.replace(/\s+/g, '-').toLowerCase() },
    price: product.price,
    discount: undefined, // ajuste se o backend fornecer
    details: [], // Garante que seja sempre um array
    brand: product.brand?.name || '',
    category: [category],
    subCategory,
    isOffer: false, // ajuste se o backend fornecer
    registerDate: product.createdAt,
    timeStamp: product.createdAt ? new Date(product.createdAt).getTime() : undefined,
    starRating: product.rating || 0, // Usa a avaliação do backend, ou 0 se não houver
    description: product.description, // Adicionado para exibir descrição do banco
  };
}

export function mapBackendProductsToIProducts(products: Product[]): IProduct[] {
  // Log para depuração
  console.log('Produtos recebidos do backend:', products);
  const mapped = products.map(mapBackendProductToIProduct);
  console.log('Produtos mapeados para o frontend:', mapped);
  return mapped;
}

export default mapBackendProductToIProduct;
