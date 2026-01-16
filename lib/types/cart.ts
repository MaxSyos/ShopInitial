import { IProductDetails, TSlug } from "./products";

export interface ICartProduct {
  id: string;
  image: any;
  name: string;
  slug: TSlug;
  price: number;
  discount: number | null;
  brand: string;
  category: string[];
  subCategory?: string | null;
  timeStamp?: number | null;
  description?: string | null;
  starRating: number;
  isOffer?: boolean;
  details: IProductDetails[];
  registerDate?: string;
  quantity: number;
  totalPrice: number;
}

export interface ICartUI {
  cartBoxIsVisible: boolean;
}

export interface ICart {
  items: ICartProduct[];
  totalQuantity: number;
  totalAmount: number;
}

//RootState interface => use for state type in useSelector hook

export interface ICartUiRootState {
  cartUi: ICartUI;
}
export interface ICartRootState {
  cart: ICart;
}
