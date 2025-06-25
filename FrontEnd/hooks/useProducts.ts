import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { 
  fetchProducts, 
  fetchProductById, 
  fetchProductsByCategory,
  fetchNewestProducts,
  fetchPopularProducts
} from '../store/product-slice';
import { ProductFilters } from '../lib/services/productService';

export const useProducts = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    items,
    total,
    page,
    limit,
    loading,
    error,
    selectedProduct,
    newestProducts,
    popularProducts
  } = useSelector((state: RootState) => state.products);

  const loadProducts = async (filters: ProductFilters = {}) => {
    await dispatch(fetchProducts(filters)).unwrap();
  };

  const loadProductById = async (id: string) => {
    await dispatch(fetchProductById(id)).unwrap();
  };

  const loadProductsByCategory = async (categoryId: string, filters: Omit<ProductFilters, 'categoryId'> = {}) => {
    await dispatch(fetchProductsByCategory({ categoryId, filters })).unwrap();
  };

  const loadNewestProducts = async (limit: number = 10) => {
    await dispatch(fetchNewestProducts(limit)).unwrap();
  };

  const loadPopularProducts = async (limit: number = 10) => {
    await dispatch(fetchPopularProducts(limit)).unwrap();
  };

  return {
    products: { items },
    total,
    page,
    limit,
    loading,
    error,
    selectedProduct,
    newestProducts,
    popularProducts,
    loadProducts,
    loadProductById,
    loadProductsByCategory,
    loadNewestProducts,
    loadPopularProducts,
  };
};
