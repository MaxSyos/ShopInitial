interface CategoryResponse {
  id: string;
  name: string;
}

interface BrandResponse {
  id: string;
  name: string;
  logo?: string;
}

export interface ProductResponse {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  sku: string;
  images: string[];
  category: CategoryResponse;
  brand: BrandResponse;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductListItem extends ProductResponse {}

export interface ProductListResponse {
  items: ProductListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
