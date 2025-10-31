import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../lib/axiosClient';
import axios from 'axios';

export interface ShippingAddress {
  street: string;
  city: string;
  state: string; // deve ter 2 caracteres
  postalCode: string; // deve ter 8 caracteres
  country: string;
  number: string; // novo campo obrigatório
  complement: string; // novo campo obrigatório
  isDefault?: boolean;
}

interface OrderState {
  shippingAddresses: ShippingAddress[];
  currentOrder: any;
  loading: boolean;
  error: string | null;
}

const initialState: OrderState = {
  shippingAddresses: [], // Inicializa vazio, sem mock
  currentOrder: null,
  loading: false,
  error: null,
};

// Thunk para buscar endereços do usuário
export const fetchUserAddresses = createAsyncThunk(
  'order/fetchUserAddresses',
  async (_, { rejectWithValue }) => {
    try {
      // Use internal axios client which injects Authorization from tokenStore
      const response = await api.get('/addresses');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao buscar endereços');
    }
  }
);

// Thunk para adicionar novo endereço
export const addShippingAddress = createAsyncThunk(
  'order/addShippingAddress',
  async (address: ShippingAddress, { rejectWithValue }) => {
    try {
      const response = await api.post('/addresses', address);
      return response.data;
    } catch (error: any) {
      console.error('Erro no addShippingAddress:', error);
      return rejectWithValue(error.response?.data?.message || 'Erro ao adicionar endereço');
    }
  }
);

// Thunk para criar pedido
export const createOrder = createAsyncThunk(
  'order/createOrder',
  async (orderData: { shippingAddress: ShippingAddress, items: any[] }, { rejectWithValue }) => {
    try {
      // Usar rota local do Next.js para garantir persistência no banco via handlers locais
      // Tentar recuperar token do localStorage (userInfo) ou usar tokenStore se disponível
      let token = '';
      try {
        const ui = typeof window !== 'undefined' ? localStorage.getItem('userInfo') : null;
        if (ui) {
          const parsed = JSON.parse(ui);
          token = parsed?.accessToken || '';
        }
      } catch (e) {
        // ignore
      }
      // header Bearer
      const response = await axios.post('/api/orders', orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao criar pedido');
    }
  }
);

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetOrder: (state) => {
      state.currentOrder = null;
      state.error = null;
    },
    setDefaultAddress: (state, action) => {
      state.shippingAddresses = state.shippingAddresses.map(address => ({
        ...address,
        isDefault: address === action.payload
      }));
    }
  },
  extraReducers: (builder) => {
    // Fetch Addresses
    builder.addCase(fetchUserAddresses.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUserAddresses.fulfilled, (state, action) => {
      state.loading = false;
      state.shippingAddresses = action.payload;
    });
    builder.addCase(fetchUserAddresses.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Add Address
    builder.addCase(addShippingAddress.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addShippingAddress.fulfilled, (state, action) => {
      state.loading = false;
      state.shippingAddresses.push(action.payload);
    });
    builder.addCase(addShippingAddress.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Create Order
    builder.addCase(createOrder.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createOrder.fulfilled, (state, action) => {
      state.loading = false;
      state.currentOrder = action.payload;
    });
    builder.addCase(createOrder.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearError, resetOrder, setDefaultAddress } = orderSlice.actions;
export default orderSlice.reducer;
