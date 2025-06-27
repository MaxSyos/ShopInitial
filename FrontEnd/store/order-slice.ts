import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { mockAddresses } from '../mock/addresses';

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

interface OrderState {
  shippingAddresses: ShippingAddress[];
  currentOrder: any;
  loading: boolean;
  error: string | null;
}

const initialState: OrderState = {
  shippingAddresses: mockAddresses, // Usando os dados mock inicialmente
  currentOrder: null,
  loading: false,
  error: null,
};

// Thunk para buscar endereços do usuário
export const fetchUserAddresses = createAsyncThunk(
  'order/fetchUserAddresses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/addresses');
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
      const response = await axios.post('/api/addresses', address);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao adicionar endereço');
    }
  }
);

// Thunk para criar pedido
export const createOrder = createAsyncThunk(
  'order/createOrder',
  async (orderData: { shippingAddress: ShippingAddress, items: any[] }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/orders', orderData);
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
