import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "next-themes";
import { cartActions } from "../../../store/cart-slice";
import { addItemAndPersist } from '../../../store/cart-async-slice';
import { favoriteActions, addFavoriteProduct, removeFavoriteProduct } from "../../../store/favorite-slice";
import {
  RiHeartFill,
  RiHeartAddLine,
  RiShareLine,
  RiShoppingCart2Line,
} from "react-icons/ri";
import { IProduct } from "../../../lib/types/products";
import { IFavoriteRootState } from "../../../lib/types/favorite";
import { useAuth } from "../../../hooks/useAuth";

import { toast } from "react-toastify";
import { useLanguage } from "../../../hooks/useLanguage";

interface Props {
  product: IProduct;
}

const CardActions: React.FC<Props> = ({ product }) => {
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();

  const favoriteItems = useSelector(
    (state: IFavoriteRootState) => state.favorite.items
  );
  const isInFavorite = favoriteItems.some(
    (item: any) => item.slug?.current === product.slug.current || item.productId === product._id
  );
  const FavoriteIcon = isInFavorite ? RiHeartFill : RiHeartAddLine;

  function addToCartHandler() {
    // dispatch thunk which updates local state optimistically and persists when authenticated
    (dispatch as any)(addItemAndPersist({ product, quantity: 1 }));
    toast.success(t.productAddedToCartMsg, {
      theme: theme === "dark" ? "dark" : "light",
    });
  }

  async function toggleFavoriteHandler() {
    if (!isAuthenticated) {
      toast.warn('Faça login para adicionar aos favoritos');
      return;
    }

    if (!isInFavorite) {
      // Adicionar aos favoritos (persistir no BD)
      const productData = {
        name: product.name,
        price: product.price,
        slug: product.slug,
        image: product.images?.[0]?.url || '',
      };
      try {
        (dispatch as any)(addFavoriteProduct({ productId: product._id || product.id, productData }));
        toast.success('Adicionado aos favoritos', {
          theme: theme === "dark" ? "dark" : "light",
        });
      } catch (err) {
        console.error(err);
        toast.error('Erro ao adicionar aos favoritos');
      }
    } else {
      // Remover dos favoritos
      const favoriteItem = favoriteItems.find(
        (item: any) => item.slug?.current === product.slug.current || item.productId === product._id
      );
      if (favoriteItem?.id) {
        try {
          (dispatch as any)(removeFavoriteProduct(favoriteItem.id));
          toast.success('Removido dos favoritos', {
            theme: theme === "dark" ? "dark" : "light",
          });
        } catch (err) {
          console.error(err);
          toast.error('Erro ao remover dos favoritos');
        }
      }
    }
  }

  return (
    // pointer-events-none evita que este container capture cliques do link pai
    // Em telas pequenas deixamos relativo para não sobrepor o texto do card
    <div className="w-1/2 md:w-auto md:h-[130px] mt-2 p-2 flex md:flex-col justify-around self-center relative md:absolute md:bottom-auto md:-top-2 left-0 md:-left-1 rounded-lg md:rounded-full shadow-lg backdrop-filter backdrop-blur-[8px] bg-palette-card/20 pointer-events-none">
      <div
        // este item precisa aceitar cliques => pointer-events-auto
        className="hover:text-rose-600 transition-colors sm:px-3 md:px-0 pointer-events-auto cursor-pointer"
        onClick={toggleFavoriteHandler}
      >
        <FavoriteIcon
          style={{
            fontSize: "1.2rem",
            fill: `${isInFavorite ? "#ee384e" : ""}`,
          }}
        />
      </div>
      {/* <div className="hover:text-rose-600 transition-colors sm:px-3 md:px-0 pointer-events-auto">
        <RiShareLine style={{ fontSize: "1.2rem" }} />
      </div> */}
      <div
        className="hover:text-rose-600 active:scale-125 transition-all sm:px-3 md:px-0 pointer-events-auto cursor-pointer"
        onClick={addToCartHandler}
      >
        <RiShoppingCart2Line
          style={{
            fontSize: "1.2rem",
          }}
        />
      </div>
    </div>
  );
};

export default CardActions;
