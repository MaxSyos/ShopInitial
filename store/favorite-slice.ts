import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { IFavorite } from "../lib/types/favorite";
import { IProduct } from "../lib/types/products";
import api from "../lib/axiosClient";

const initialState: IFavorite = {
  items: [],
  loading: false,
  error: null,
};

// Thunk para buscar favoritos do usuário
export const fetchUserFavorites = createAsyncThunk(
  'favorite/fetchUserFavorites',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/favorites');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao buscar favoritos');
    }
  }
);

// Thunk para adicionar produto aos favoritos (persistir no BD)
export const addFavoriteProduct = createAsyncThunk(
  'favorite/addFavoriteProduct',
  async (
    payload: { productId: string; productData?: any },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post('/favorites', payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao adicionar favorito');
    }
  }
);

// Thunk para remover produto dos favoritos (persistir no BD)
export const removeFavoriteProduct = createAsyncThunk(
  'favorite/removeFavoriteProduct',
  async (favoriteId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/favorites/${favoriteId}`);
      return favoriteId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao remover favorito');
    }
  }
);

const favoriteSlice = createSlice({
  name: "favorite",
  initialState,
  reducers: {
    addToFavorite(state, action: PayloadAction<IProduct>) {
      state.items.push({
        ...action.payload,
      });
    },
    removeFromFavorite(state, action: PayloadAction<string>) {
      const productSlug = action.payload;
      state.items = state.items.filter(
        (item) => item.slug.current !== productSlug
      );
    },
    clearCart(state) {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    // Fetch Favorites
    builder.addCase(fetchUserFavorites.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUserFavorites.fulfilled, (state, action) => {
      state.loading = false;
      // Armazenar os dados dos favoritos (com productData JSON)
      state.items = action.payload;
    });
    builder.addCase(fetchUserFavorites.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Add Favorite
    builder.addCase(addFavoriteProduct.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addFavoriteProduct.fulfilled, (state, action) => {
      state.loading = false;
      state.items.push(action.payload);
    });
    builder.addCase(addFavoriteProduct.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Remove Favorite
    builder.addCase(removeFavoriteProduct.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(removeFavoriteProduct.fulfilled, (state, action) => {
      state.loading = false;
      const removedId = action.payload;
      state.items = state.items.filter((item: any) => item.id !== removedId);
    });
    builder.addCase(removeFavoriteProduct.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const favoriteActions = favoriteSlice.actions;

export default favoriteSlice.reducer;
