import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../lib/axiosConfig';
import { ICart, ICartProduct } from '../lib/types/cart';
import { cartActions } from './cart-slice';
import { IProduct } from '../lib/types/products';

const initialState: ICart = {
  items: [],
  totalQuantity: 0,
  totalAmount: 0,
};

export const fetchCart = createAsyncThunk('cart/fetchCart', async (_, { rejectWithValue, getState }) => {
  // Se o usuário não estiver autenticado, não chamamos o backend — usar apenas estado local
  const state: any = getState();
  const isAuthenticated = state?.userInfo?.isAuthenticated;
  if (!isAuthenticated) {
    // Retorna um payload vazio para manter o estado local do cliente
    return { items: [], totalQuantity: 0, totalAmount: 0 };
  }

  try {
    const response = await api.get('/cart');
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erro ao buscar carrinho');
  }
});

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async (payload: { productId: string; quantity: number }, { rejectWithValue, getState }) => {
    const state: any = getState();
    const isAuthenticated = state?.userInfo?.isAuthenticated;
    if (!isAuthenticated) {
      // Usuário anônimo: não persiste no backend
      return { items: [], totalQuantity: 0, totalAmount: 0 };
    }

    try {
      const response = await api.post('/cart/items', payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao adicionar ao carrinho');
    }
  }
);

// Thunk que aplica a atualização localmente (otimista) e persiste no backend quando autenticado
export const addItemAndPersist = createAsyncThunk(
  'cart/addItemAndPersist',
  async (payload: { product: IProduct; quantity: number }, { dispatch, getState, rejectWithValue }) => {
    // Atualiza imediatamente o estado local (otimista)
    dispatch(cartActions.addItemToCart({ product: payload.product, quantity: payload.quantity }));

    const state: any = getState();
    const isAuthenticated = state?.userInfo?.isAuthenticated;

    if (!isAuthenticated) {
      // usuário anônimo -> apenas retorna o estado local atual
      const current = state.cart;
      return { items: current.items, totalQuantity: current.totalQuantity, totalAmount: current.totalAmount };
    }

    try {
      // Persistir no backend
      const response = await api.post('/cart/items', { productId: payload.product.id, quantity: payload.quantity });
      return response.data;
    } catch (error: any) {
      // Em caso de falha ao persistir, retornamos erro para que o UI possa notificar.
      return rejectWithValue(error.response?.data?.message || 'Erro ao persistir item no carrinho');
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (itemId: string, { rejectWithValue, getState }) => {
    const state: any = getState();
    const isAuthenticated = state?.userInfo?.isAuthenticated;
    if (!isAuthenticated) {
      // Usuário anônimo: não persiste no backend
      return { items: [], totalQuantity: 0, totalAmount: 0 };
    }

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
    builder.addCase(addItemAndPersist.fulfilled, (state, action) => {
      return { ...state, ...action.payload };
    });
    builder.addCase(addItemAndPersist.rejected, (state, action) => {
      // não reverte a atualização otimista, mas o frontend pode mostrar um aviso via rejectWithValue
      return state;
    });
    builder.addCase(removeFromCart.fulfilled, (state, action) => {
      return { ...state, ...action.payload };
    });
  },
});

export default cartAsyncSlice.reducer;
