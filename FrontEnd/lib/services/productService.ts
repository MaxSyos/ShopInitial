import { axiosInstance } from '../axiosConfig';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  sku: string;
  images: string[];
  categoryId: string;
  brandId: string;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    description: string;
  };
  brand?: {
    id: string;
    name: string;
    logo: string;
  };
  reviews?: {
    id: string;
    rating: number;
    comment: string;
    userId: string;
    createdAt: string;
  }[];
}

interface ProductsResponse {
  items: Product[];
  total: number;
  page: number;
  limit: number;
}

export interface ProductFilters {
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class ProductService {
  async getProducts(filters: ProductFilters = {}): Promise<ProductsResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });

    // Use fetch instead of axiosInstance (avoid interceptors / auth headers)
    const url = `/api/products?${params.toString()}`;
    const resp = await fetch(url, { method: 'GET', credentials: 'same-origin' });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Product fetch failed ${resp.status}: ${text}`);
    }
    const data = await resp.json();
    // O backend retorna { items: [...] }
    return data;
  }

  async getProductById(id: string): Promise<Product> {
    const response = await axiosInstance.get(`/products/${id}`);
    return response.data;
  }

  async getProductsByCategory(categoryId: string, filters: Omit<ProductFilters, 'categoryId'> = {}): Promise<ProductsResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });

    const response = await axiosInstance.get(`/categories/${categoryId}/products?${params.toString()}`);
    return response.data;
  }

  async getProductsByBrand(brandId: string, filters: Omit<ProductFilters, 'brandId'> = {}): Promise<ProductsResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });

    const response = await axiosInstance.get(`/brands/${brandId}/products?${params.toString()}`);
    return response.data;
  }

  async getNewestProducts(limit: number = 10): Promise<Product[]> {
    try {
      // Use the dedicated newest endpoint which returns { items }
      // Use fetch to avoid axios interceptors that add Authorization headers
      const resp = await fetch(`/api/products/newest?limit=${limit}`, { method: 'GET', credentials: 'same-origin' });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`getNewestProducts failed ${resp.status}: ${text}`);
      }
      const data = await resp.json();
      const items = data?.items || [];
      console.log('✅ getNewestProducts items count:', items.length);
      return items;
    } catch (error: any) {
      console.error('❌ getNewestProducts error:', error?.message || error);
      throw error;
    }
  }

  async getPopularProducts(limit: number = 10): Promise<Product[]> {
    const response = await axiosInstance.get(`/products/popular?limit=${limit}`);
    return response.data;
  }
}

export const productService = new ProductService();
