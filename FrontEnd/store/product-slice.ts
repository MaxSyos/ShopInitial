import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productService, Product, ProductFilters } from '../lib/services/productService';

interface ProductsState {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  error: string | null;
  selectedProduct: Product | null;
  newestProducts: Product[];
  popularProducts: Product[];
}

const initialState: ProductsState = {
  items: [],
  total: 0,
  page: 1,
  limit: 10,
  loading: false,
  error: null,
  selectedProduct: null,
  newestProducts: [],
  popularProducts: [],
};

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (filters: ProductFilters) => {
    const response = await productService.getProducts(filters);
    return response;
  }
);

export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (id: string) => {
    const response = await productService.getProductById(id);
    return response;
  }
);

export const fetchProductsByCategory = createAsyncThunk(
  'products/fetchProductsByCategory',
  async ({ categoryId, filters }: { categoryId: string; filters: Omit<ProductFilters, 'categoryId'> }) => {
    const response = await productService.getProductsByCategory(categoryId, filters);
    return response;
  }
);

export const fetchNewestProducts = createAsyncThunk(
  'products/fetchNewestProducts',
  async (limit: number = 10) => {
    const response = await productService.getNewestProducts(limit);
    return response;
  }
);

export const fetchPopularProducts = createAsyncThunk(
  'products/fetchPopularProducts',
  async (limit: number = 10) => {
    const response = await productService.getPopularProducts(limit);
    return response;
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearSelectedProduct: (state) => {
      state.selectedProduct = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchProducts
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao carregar produtos';
      })

      // fetchProductById
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao carregar produto';
      })

      // fetchProductsByCategory
      .addCase(fetchProductsByCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductsByCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
      })
      .addCase(fetchProductsByCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao carregar produtos da categoria';
      })

      // fetchNewestProducts
      .addCase(fetchNewestProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNewestProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.newestProducts = action.payload;
      })
      .addCase(fetchNewestProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao carregar produtos mais novos';
      })

      // fetchPopularProducts
      .addCase(fetchPopularProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPopularProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.popularProducts = action.payload;
      })
      .addCase(fetchPopularProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao carregar produtos populares';
      });
  },
});

export const { clearSelectedProduct } = productsSlice.actions;
export default productsSlice.reducer;
