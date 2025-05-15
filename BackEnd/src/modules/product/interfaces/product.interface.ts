export interface ProductMetrics {
  totalProducts: number;
  totalCategories: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  averagePrice: number;
  totalBrands: number;
}

export interface ProductCacheKeys {
  details: string;
  list: string;
  category: string;
  brand: string;
  search: string;
  metrics: string;
}
