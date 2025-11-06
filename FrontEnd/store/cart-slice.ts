import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { ICart } from "../lib/types/cart";
import { IProduct } from "../lib/types/products";
import { calculateDiscountPercentage } from "../utilities/calculateDiscountPercentage";
import * as cartApi from './cart-api';

const initialState: ICart = {
  items: [],
  totalQuantity: 0,
  totalAmount: 0,
};

// Thunk para buscar o carrinho do backend
export const fetchCart = createAsyncThunk('cart/fetchCart', async (_, { rejectWithValue }) => {
  try {
    const response = await cartApi.fetchCart();
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erro ao buscar carrinho');
  }
});

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItemToCart(
      state: ICart,
      action: PayloadAction<{ product: IProduct; quantity: number }>
    ) {
      const newItem = action.payload.product;

      const existingItem = state.items.find(
        (item) => item.slug.current === newItem.slug.current
      );

      state.totalQuantity = state.totalQuantity + action.payload.quantity;

      state.totalAmount =
        state.totalAmount +
        action.payload.quantity *
          (action.payload.product.discount
            ? calculateDiscountPercentage(
                action.payload.product.price,
                action.payload.product.discount
              )
            : action.payload.product.price);

      if (!existingItem) {
        const totalPrice =
          (newItem.discount
            ? calculateDiscountPercentage(newItem.price, newItem.discount)
            : newItem.price) * action.payload.quantity;

        state.items.push(({
          ...newItem,
          // garantir que discount não seja null (tipagem espera undefined quando ausente)
          discount: (newItem.discount ?? undefined),
          // garantir que registerDate/nulls não quebrem a tipagem do ICartProduct em tempo de compilação
          registerDate: (newItem as any).registerDate ?? undefined,
          quantity: action.payload.quantity,
          totalPrice,
        } as unknown) as ICartProduct);
      } else {
        const totalPrice =
          existingItem.totalPrice +
          (existingItem.discount
            ? calculateDiscountPercentage(
                existingItem.price,
                existingItem.discount
              ) * action.payload.quantity
            : existingItem.price * action.payload.quantity);

        existingItem.quantity += action.payload.quantity;
        existingItem.totalPrice = totalPrice;
      }
    },

    removeItemFromCart(
      state: ICart,
      action: PayloadAction<string> //slug.current as payload
    ) {
      const productSlug = action.payload;
      const existingItem = state.items.find(
        (item) => item.slug.current === productSlug
      );

      state.totalQuantity--;

      state.totalAmount =
        state.totalAmount -
        (existingItem?.discount
          ? calculateDiscountPercentage(
              existingItem.price,
              existingItem.discount
            )
          : existingItem?.price)!;

      if (existingItem?.quantity === 1) {
        state.items = state.items.filter(
          (item) => item.slug.current !== productSlug
        );
      } else {
        existingItem!.quantity--;
        existingItem!.totalPrice =
          existingItem!.totalPrice -
          (existingItem?.discount
            ? calculateDiscountPercentage(
                existingItem.price,
                existingItem.discount
              )
            : existingItem?.price)!;
      }
    },

    setItemQuantity(
      state: ICart,
      action: PayloadAction<{ productSlugOrId: string; quantity: number }>
    ) {
      const { productSlugOrId, quantity } = action.payload;
      const existingItem = state.items.find(
        (item) => item.slug?.current === productSlugOrId || item.id === productSlugOrId
      );
      if (!existingItem) return;

      // adjust totals
      const prevQty = existingItem.quantity || 0;
      const delta = quantity - prevQty;
      state.totalQuantity = state.totalQuantity + delta;

      const unit = existingItem.discount
        ? calculateDiscountPercentage(existingItem.price, existingItem.discount)
        : existingItem.price;
      state.totalAmount = state.totalAmount + delta * unit;

      existingItem.quantity = quantity;
      existingItem.totalPrice = unit * quantity;
    },

    clearCart(state) {
      // Immer requires mutating the draft state fields instead of reassigning the state variable.
      state.items = [];
      state.totalQuantity = 0;
      state.totalAmount = 0;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchCart.fulfilled, (state, action) => {
      // Atualiza o estado do carrinho com o que veio do backend
      state.items = action.payload.items || [];
      state.totalQuantity = action.payload.totalQuantity || 0;
      state.totalAmount = action.payload.totalAmount || 0;
    });
  },
});

export const cartActions = cartSlice.actions;

export default cartSlice.reducer;
