import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { addFavoriteProduct, removeFavoriteProduct, fetchUserFavorites } from "../../store/favorite-slice";
import { IProduct } from "../../lib/types/products";
import { IFavoriteRootState } from "../../lib/types/favorite";
import { RiHeartFill, RiHeartAddLine } from "react-icons/ri";
import { useAuth } from "../../hooks/useAuth";

interface Props {
  product: IProduct;
}
const ProductPageActions: React.FC<Props> = ({ product }) => {
  const dispatch = useDispatch();
  const { user: userInfo, isAuthenticated } = useAuth();
  const favoriteItems = useSelector(
    (state: IFavoriteRootState) => state.favorite.items
  );

  // Carregar favoritos quando o componente montar e o usuário estiver autenticado
  useEffect(() => {
    if (isAuthenticated && userInfo && favoriteItems.length === 0) {
      (dispatch as any)(fetchUserFavorites());
    }
  }, [isAuthenticated, userInfo, favoriteItems.length, dispatch]);
  const isInFavorite = favoriteItems.some(
    (item) => item.productId === (product.id || product._id || product.slug?.current) ||
             item.slug?.current === product.slug?.current ||
             (item.productData && item.productData.id === product.id) ||
             (item.productData && item.productData.slug?.current === product.slug?.current)
  );
  let FavoriteIcon = isInFavorite ? RiHeartFill : RiHeartAddLine;
  function toggleFavoriteHandler() {
    try {
      if (!isInFavorite) {
        // Adicionar aos favoritos - persistir no backend
        const productId = product.id || product._id || product.slug?.current;
        console.log('Adicionando aos favoritos:', { productId, product });
        (dispatch as any)(addFavoriteProduct({
          productId: productId,
          productData: product
        }));
      } else {
        // Remover dos favoritos - encontrar o ID do favorito
        const favoriteItem = favoriteItems.find(
          (item) => item.productId === (product.id || product._id || product.slug?.current) ||
                   item.slug?.current === product.slug?.current ||
                   item.id === product.id
        );
        console.log('Removendo dos favoritos:', { favoriteItem, product });
        if (favoriteItem && favoriteItem.id) {
          (dispatch as any)(removeFavoriteProduct(favoriteItem.id));
        } else {
          // Fallback: tentar remover pelo productId
          const productId = product.id || product._id || product.slug?.current;
          const fallbackFavorite = favoriteItems.find(item => item.productId === productId);
          if (fallbackFavorite && fallbackFavorite.id) {
            (dispatch as any)(removeFavoriteProduct(fallbackFavorite.id));
          }
        }
      }
    } catch (error) {
      console.error('Erro ao toggle favorite:', error);
    }
  }
  return (
    <div className=" py-4 -mt-6 flex flex-col justify-evenly absolute top-0 ltr:left-0 rtl:right-0 md:static rounded-lg z-10">
      <div
        className="hover:text-rose-600 transition-colors px-2 md:px-6 py-3 cursor-pointer"
        onClick={toggleFavoriteHandler}
      >
        <FavoriteIcon
          style={{
            fontSize: "1.5rem",
            fill: `${isInFavorite ? "#ee384e" : ""}`,
          }}
        />
      </div>
    </div>
  );
};

export default ProductPageActions;
