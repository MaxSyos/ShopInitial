import { IProduct } from "./products";
export interface IFavorite {
  items: IProduct[] | any[];
  loading?: boolean;
  error?: string | null;
}

export interface IFavoriteRootState {
  favorite: IFavorite;
}
