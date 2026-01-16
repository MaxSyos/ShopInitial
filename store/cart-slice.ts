import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { ICart, ICartProduct } from "../lib/types/cart";
import { IProduct } from "../lib/types/products";
import { calculateDiscountPercentage } from "../utilities/calculateDiscountPercentage";
import * as cartApi from './cart-api';

const MIN_TOTAL_QUANTITY = 10;

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
      // se não for passada quantidade, usa 10 como default inicial
      const qty = (action.payload.quantity ?? 10);

      const existingItem = state.items.find(
        (item) => item.slug.current === newItem.slug.current
      );

      state.totalQuantity = state.totalQuantity + qty;

      state.totalAmount =
        state.totalAmount +
        qty *
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
            : newItem.price) * qty;

        state.items.push(({
          ...newItem,
          discount: (newItem.discount ?? undefined),
          registerDate: (newItem as any).registerDate ?? undefined,
          quantity: qty,
          totalPrice,
        } as unknown) as ICartProduct);
      } else {
        const totalPrice =
          existingItem.totalPrice +
          (existingItem.discount
            ? calculateDiscountPercentage(
                existingItem.price,
                existingItem.discount
              ) * qty
            : existingItem.price * qty);

        existingItem.quantity += qty;
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
      // Atualiza quantidades e totais ao remover uma unidade do item
      if (!existingItem) return;
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

    removeItemCompletely(
      state: ICart,
      action: PayloadAction<string> // slug.current
    ) {
      const productSlug = action.payload;
      const existingItem = state.items.find(
        (item) => item.slug.current === productSlug
      );
      if (!existingItem) return;
      // Remove o item completamente e ajusta totais (sem validação de mínimo)
      state.totalQuantity = state.totalQuantity - (existingItem.quantity || 0);
      state.totalAmount = state.totalAmount - (existingItem.totalPrice || 0);
      state.items = state.items.filter((item) => item.slug.current !== productSlug);
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
      let newQty = quantity;
      let delta = quantity - prevQty;

      // Ajusta total e quantidade sem impor mínimo global aqui
      state.totalQuantity = state.totalQuantity + delta;
      const unit = existingItem.discount
        ? calculateDiscountPercentage(existingItem.price, existingItem.discount)
        : existingItem.price;
      state.totalAmount = state.totalAmount + delta * unit;

      existingItem.quantity = newQty;
      existingItem.totalPrice = unit * newQty;
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
