import { Product } from '../lib/services/productService';
import { IProduct } from '../lib/types/products';

export function mapBackendProductToIProduct(product: Product): IProduct {
  // Ajusta categoria e subcategoria conforme relacionamento
  let category = '';
  let subCategory: string | undefined = undefined;

  if (product && product.category) {
    const cat: any = product.category;
    if (cat.parent && cat.parent.name) {
      category = cat.parent.name;
      subCategory = cat.name;
    } else {
      category = cat.name || '';
    }
  }

  return {
    id: product.id,
    // map images (objects) to array of url strings expected by the UI
    image: Array.isArray(product.images) ? product.images.map((img: any) => img.url || img) : [],
    name: product.name,
    slug: { _type: 'slug', current: product.id || (product.name ? product.name.replace(/\s+/g, '-').toLowerCase() : '') },
    price: product.price,
    // Ensure values are serializable by replacing undefined with null/defaults
    discount: (product as any).discount ?? null,
    details: Array.isArray((product as any).details) ? (product as any).details : [],
    brand: product.brand?.name || '',
  category: [category],
  subCategory: subCategory ?? null,
    isOffer: (product as any).isOffer ?? false,
  registerDate: (product as any).createdAt ? new Date((product as any).createdAt).toISOString() : null,
  timeStamp: (product as any).createdAt ? new Date((product as any).createdAt).getTime() : null,
    starRating: (product as any).rating || 0,
    description: (product as any).description ?? null,
  } as IProduct;
}

export function mapBackendProductsToIProducts(products: Product[]): IProduct[] {
  // Log para depuração
  console.log('Produtos recebidos do backend:', products);
  const mapped = products.map(mapBackendProductToIProduct);
  console.log('Produtos mapeados para o frontend:', mapped);
  return mapped;
}

export default mapBackendProductToIProduct;
