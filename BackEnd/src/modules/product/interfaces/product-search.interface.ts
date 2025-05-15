export interface ProductSearchParams {
  skip?: number;
  take?: number;
  where?: any;
  orderBy?: any;
  include?: any;
}

export enum ProductCacheKeys {
  DETAIL = 'detail',
  LIST = 'list',
  CATEGORY = 'category',
  SEARCH = 'search',
  METRICS = 'metrics'
}
