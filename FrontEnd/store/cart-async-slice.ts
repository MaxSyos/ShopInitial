import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../lib/axiosConfig';
import { ICart, ICartProduct } from '../lib/types/cart';

const initialState: ICart = {
  items: [],
  totalQuantity: 0,
  totalAmount: 0,
};

export const fetchCart = createAsyncThunk('cart/fetchCart', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/cart');
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erro ao buscar carrinho');
  }
});

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async (payload: { productId: string; quantity: number }, { rejectWithValue }) => {
    try {
      const response = await api.post('/cart/items', payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao adicionar ao carrinho');
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (itemId: string, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/cart/items/${itemId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao remover do carrinho');
    }
  }
);

const cartAsyncSlice = createSlice({
  name: 'cartAsync',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchCart.fulfilled, (state, action) => {
      return { ...state, ...action.payload };
    });
    builder.addCase(addToCart.fulfilled, (state, action) => {
      return { ...state, ...action.payload };
    });
    builder.addCase(removeFromCart.fulfilled, (state, action) => {
      return { ...state, ...action.payload };
    });
  },
});

export default cartAsyncSlice.reducer;
