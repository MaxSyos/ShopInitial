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
    console.log('fetchCart thunk -> isAuthenticated:', isAuthenticated);
    const response = await api.get('/cart');
    console.log('fetchCart -> response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('fetchCart error', error?.response?.data || error.message);
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
      console.log('addToCart thunk -> anonymous user, skipping backend persist');
      return { items: [], totalQuantity: 0, totalAmount: 0 };
    }

    try {
      console.log('addToCart -> calling POST /cart/items payload:', payload);
      const response = await api.post('/cart/items', payload);
      console.log('addToCart -> response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('addToCart error', error?.response?.data || error.message);
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
      console.log('addItemAndPersist -> anonymous user, keeping optimistic local update');
      const current = state.cart;
      return { items: current.items, totalQuantity: current.totalQuantity, totalAmount: current.totalAmount };
    }

    try {
      // Persistir no backend
      console.log('addItemAndPersist -> persisting to backend', { productId: payload.product.id, quantity: payload.quantity });
      const response = await api.post('/cart/items', { productId: payload.product.id, quantity: payload.quantity });
      console.log('addItemAndPersist -> response:', response.data);
      return response.data;
    } catch (error: any) {
      // Em caso de falha ao persistir, retornamos erro para que o UI possa notificar.
      console.error('addItemAndPersist error', error?.response?.data || error.message);
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
      console.log('removeFromCart -> anonymous user, skipping backend');
      return { items: [], totalQuantity: 0, totalAmount: 0 };
    }

    try {
      console.log('removeFromCart -> calling DELETE /cart/items/', itemId);
      const response = await api.delete(`/cart/items/${itemId}`);
      console.log('removeFromCart -> response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('removeFromCart error', error?.response?.data || error.message);
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
