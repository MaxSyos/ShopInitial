import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../lib/axiosClient';
import cartLocal from '../lib/cartLocal';
import cartSync from '../lib/cartSync';
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
    console.error('fetchCart error', error?.response?.data || error.message);
    return rejectWithValue(error.response?.data?.message || 'Erro ao buscar carrinho');
  }
});

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async (payload: { productId: string; quantity: number }, { rejectWithValue, getState, dispatch }) => {
    const state: any = getState();
    const isAuthenticated = state?.userInfo?.isAuthenticated;
    if (!isAuthenticated) {
      // Usuário anônimo: não persiste no backend
      // apply optimistic local update
      const fakeProduct: any = { id: payload.productId, slug: { current: payload.productId }, price: 0 };
      dispatch(cartActions.addItemToCart({ product: fakeProduct, quantity: payload.quantity }));
      return { items: [], totalQuantity: 0, totalAmount: 0 };
    }

    try {
      // apply optimistic update via reducer; middleware will enqueue exactly one op
      const fakeProduct: any = { id: payload.productId, slug: { current: payload.productId }, price: 0 };
      dispatch(cartActions.addItemToCart({ product: fakeProduct, quantity: payload.quantity }));
      // snapshot will be persisted by middleware; return local snapshot
      const local = cartLocal.readLocalCart();
      return local || { items: [], totalQuantity: 0, totalAmount: 0 };
    } catch (error: any) {
      console.error('addToCart enqueue error', error?.message || error);
      return rejectWithValue('Erro ao processar operação de carrinho');
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
      // middleware will enqueue the operation once (we already dispatched reducer above)
      // return current local snapshot
      const local = cartLocal.readLocalCart();
      return local || { items: [], totalQuantity: 0, totalAmount: 0 };
    } catch (error: any) {
      console.error('addItemAndPersist error reading local snapshot', error?.message || error);
      return rejectWithValue('Erro ao processar operação de carrinho');
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
      // We rely on the reducer + middleware to enqueue the remove op. If caller didn't dispatch reducer,
      // callers should dispatch cartActions.removeItemFromCart before calling this thunk.
      // Schedule a sync to process ops soon.
      cartSync.scheduleSync();
      const local = cartLocal.readLocalCart();
      return local || { items: [], totalQuantity: 0, totalAmount: 0 };
    } catch (error: any) {
      console.error('removeFromCart error', error?.message || error);
      return rejectWithValue('Erro ao processar remoção do carrinho');
    }
  }
);

export const updateItemQuantity = createAsyncThunk(
  'cart/updateItemQuantity',
  async (
    payload: { productSlugOrId: string; quantity: number; cartItemId?: string },
    { dispatch, getState, rejectWithValue }
  ) => {
    // apply locally
    dispatch(cartActions.setItemQuantity({ productSlugOrId: payload.productSlugOrId, quantity: payload.quantity }));

    const state: any = getState();
    const isAuthenticated = state?.userInfo?.isAuthenticated;
    if (!isAuthenticated) {
      // persist locally only
      return state.cart;
    }

    try {
      // middleware will enqueue when reducer runs
      const local = cartLocal.readLocalCart();
      return local || { items: [], totalQuantity: 0, totalAmount: 0 };
    } catch (e: any) {
      return rejectWithValue('Erro ao processar atualização');
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
