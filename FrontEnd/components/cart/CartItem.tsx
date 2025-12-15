import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { HiMinusSm, HiOutlinePlusSm, HiOutlineTrash } from "react-icons/hi";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { useLanguage } from "../../hooks/useLanguage";
import { ICartRootState } from "../../lib/types/cart";
import { IProduct } from "../../lib/types/products";
import { cartActions } from "../../store/cart-slice";
import { addItemAndPersist, removeFromCart, fetchCart } from '../../store/cart-async-slice';
import { updateCartItem } from '../../store/cart-api';
import { updateItemQuantity } from '../../store/cart-async-slice';
import ProductPrice from "../UI/ProductPrice";

interface Props {
  product: IProduct;
}
const CartItem: React.FC<Props> = ({ product }) => {
  const productQuantity = useSelector(
    (state: ICartRootState) =>
      state.cart.items.find(
        (item) => item.slug.current === product.slug.current
      )?.quantity
  );
  const [counter, setCounter] = useState(productQuantity);
  const dispatch = useDispatch();
  const { t } = useLanguage();

  // Define a URL da imagem de forma segura, com um fallback.
  // Isso evita o erro se 'product.image' não existir ou não for um array.
  const imageUrl =
    product && Array.isArray(product.image) && product.image.length > 0
      ? product.image[0]
      : "/images/default-product.jpg";

  console.log('🛒 CartItem product:', {
    name: product.name,
    imageUrl,
    images: product.image,
    imageType: typeof product.image,
    isArray: Array.isArray(product.image),
  });

  // Debug: imprimir o produto inteiro quando houver problemas
  if (!imageUrl || imageUrl === '/images/default-product.jpg') {
    console.warn('⚠️ CartItem - Sem imagem para produto:', product.name, product);
  }

  function increment(product: IProduct) {
    setCounter((prev) => ++prev!);
    // atualizar local + persistir no backend quando autenticado
    (dispatch as any)(addItemAndPersist({ product, quantity: 1 }));
  }

  function decrement(slug: string) {
    setCounter((prev) => --prev!);
    // update local state immediately
    dispatch(cartActions.removeItemFromCart(slug));
    // try to persist removal if we have a cartItemId
    const cartItemId = (product as any).cartItemId;
    if (cartItemId) {
      // fire-and-forget: the thunk will replace the cart state when resolved
      (dispatch as any)(removeFromCart(cartItemId));
    }
  }

  async function commitQuantityChange() {
    // if no change, nothing to do
    if (counter === product.quantity) return;

    const diff = counter! - (product.quantity || 0);

    try {
      if (diff > 0) {
        // increase: reuse optimistic add + persist (enqueue)
        (dispatch as any)(addItemAndPersist({ product, quantity: diff }));
      } else {
        // decrease: set absolute quantity locally and enqueue update for sync
        const productSlugOrId = product.id || product.slug?.current;
        (dispatch as any)(updateItemQuantity({ productSlugOrId, quantity: counter!, cartItemId: (product as any).cartItemId }));
      }
    } catch (error: any) {
      console.error('Erro ao persistir alteração de quantidade', error?.response || error);
      // fallback: refresh cart to keep UI consistent with server
      (dispatch as any)(fetchCart());
    }
  }

  function onInputNumberChangeHandler(e: React.ChangeEvent<HTMLInputElement>) {
    if (+e.currentTarget.value >= 1 && +e.currentTarget.value <= 10) {
      setCounter(+e.currentTarget.value);
    }
  }
  return (
    <div className="flex items-center flex-wrap sm:my-4 sm:py-4 px-2 border-b-2">
      {/* Monta URL consistente com a rota de detalhe */}
      {(() => {
        const category = product.category && product.category.length > 0 ? product.category[0] : 'categoria';
        const subCategory = product.subCategory ? product.subCategory : 'all';
        const titleSlug = product.name ? product.name.replace(/\s+/g, '-').toLowerCase() : (product.slug?.current || product.id);
        const slug = product.slug?.current || product.id;
        const productUrl = `/${category}/${subCategory}/${titleSlug}/${slug}`;

        return (
          <div className="lg:w-1/2 sm:min-w-[290px]">
            <Link href={productUrl}>
              <a className="flex flex-wrap sm:flex-nowrap justify-center items-center flex-grow">
                <div className="sm:min-w-[100px] md:min-w-[130px]">
                  {typeof imageUrl === 'string' && imageUrl.startsWith('http') ? (
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="object-contain max-w-[150px] max-h-[150px]"
                    />
                  ) : (
                    <Image
                      src={imageUrl}
                      width={150}
                      height={150}
                      alt={product.name}
                      className="object-contain"
                      style={{ maxWidth: '150px', maxHeight: '150px' }}
                    />
                  )}
                </div>
                <div
                  className="flex-grow text-sm font-normal mb-2 sm:mb-0 mx-2 w-full"
                  style={{ direction: "ltr" }}
                >
                  {product.name}
                </div>
              </a>
            </Link>
          </div>
        );
      })()}
      
      <div className="flex flex-wrap flex-grow md:items-center mb-4 sm:mb-0">
        <div className="flex-grow my-2 sm:my-0">
          <div className="flex items-center justify-start lg:justify-center cursor-pointer">
            <div className="p-2" onClick={() => increment(product)}>
              <HiOutlinePlusSm style={{ fontSize: "1rem" }} />
            </div>
            <input
              className="inline-block w-[65px] rtl:pr-7 ltr:pl-7 py-2 mx-1 border-[1px] border-gray-400"
              type="number"
              min={1}
              max={10}
              value={counter}
              onChange={onInputNumberChangeHandler}
              onBlur={commitQuantityChange}
            />
            {counter === 1 ? (
              <div
                onClick={() => decrement(product.slug.current)}
                className="p-1"
              >
                <HiOutlineTrash style={{ fontSize: "1.3rem", color: "red" }} />
              </div>
            ) : (
              <div
                onClick={() => decrement(product.slug.current)}
                className="p-1"
              >
                <HiMinusSm style={{ fontSize: "1rem" }} />
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col flex-grow font-normal rtl:mr-1 lrt:ml-1">
          <p>{t.totalAmount}</p>
          <ProductPrice
            price={product.price * counter!}
            discount={product.discount ?? undefined}
          />
        </div>
      </div>
    </div>
  );
};

export default CartItem;
