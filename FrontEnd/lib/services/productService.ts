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
  async getProducts(filters: ProductFilters = {}): Promise<{ items: Product[] }> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });

    const response = await axiosInstance.get(`/products?${params.toString()}`);
    // O backend retorna { items: [...] }
    return response.data;
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
    const response = await axiosInstance.get(`/products/newest?limit=${limit}`);
    return response.data;
  }

  async getPopularProducts(limit: number = 10): Promise<Product[]> {
    const response = await axiosInstance.get(`/products/popular?limit=${limit}`);
    return response.data;
  }
}

export const productService = new ProductService();
