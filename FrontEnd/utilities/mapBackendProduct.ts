import { Product } from '../lib/services/productService';
import { IProduct } from '../lib/types/products';

export function mapBackendProductToIProduct(product: Product): IProduct {
  // Garante que o campo id está presente e único
  return {
    image: product.images || [],
    name: product.name,
    slug: { _type: 'slug', current: product.id || product.name.replace(/\s+/g, '-').toLowerCase() },
    price: product.price,
    discount: undefined, // ajuste se o backend fornecer
    details: [], // ajuste se o backend fornecer
    brand: product.brand?.name || '',
    category: product.category ? [product.category.name] : [],
    isOffer: false, // ajuste se o backend fornecer
    registerDate: product.createdAt,
    timeStamp: new Date(product.createdAt).getTime(),
    starRating: 0, // ajuste se o backend fornecer
  };
}

export function mapBackendProductsToIProducts(products: Product[]): IProduct[] {
  // Log para depuração
  console.log('Produtos recebidos do backend:', products);
  const mapped = products.map(mapBackendProductToIProduct);
  console.log('Produtos mapeados para o frontend:', mapped);
  return mapped;
}
