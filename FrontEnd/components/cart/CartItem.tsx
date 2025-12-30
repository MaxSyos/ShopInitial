import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { HiMinusSm, HiOutlinePlusSm, HiOutlineTrash } from "react-icons/hi";
import { useSelector } from "react-redux";
import { toast } from 'react-toastify';
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
  const [counter, setCounter] = useState(productQuantity ?? 10);
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const totalQuantity = useSelector((state: ICartRootState) => state.cart.totalQuantity);
  const safePrev = counter || product.quantity || 1;
  const minAllowed = Math.max(1, 10 - ((totalQuantity || 0) - safePrev));

  // Define a URL da imagem de forma segura, com um fallback.
  // Isso evita o erro se 'product.image' não existir ou não for um array.
  const imageUrl =
    product && Array.isArray(product.image) && product.image.length > 0
      ? product.image[0]
      : "/images/default-product.jpg";



  // Debug: imprimir o produto inteiro quando houver problemas
  if (!imageUrl || imageUrl === '/images/default-product.jpg') {
    console.warn('⚠️ CartItem - Sem imagem para produto:', product.name, product);
  }

  function increment(product: IProduct) {
    setCounter((prev) => ++prev!);
    // atualizar local + persistir no backend quando autenticado
    (dispatch as any)(addItemAndPersist({ product, quantity: 1 }));
  }

  function decrement(prod: IProduct) {
    // impedir decremento se atingir o mínimo permitido para esse item
    const current = counter || prod.quantity || 1;
    if (current <= minAllowed) {
      toast.warn('O pedido mínimo é de 10 peças no total');
      return;
    }
    setCounter((prev) => --prev!);
    // update local state immediately
    const slug = prod.slug?.current || prod.id;
    dispatch(cartActions.removeItemFromCart(slug));
    // try to persist removal if we have a cartItemId
    const cartItemId = (prod as any).cartItemId;
    if (cartItemId) {
      // fire-and-forget: the thunk will replace the cart state when resolved
      (dispatch as any)(removeFromCart(cartItemId));
    }
  }

  function removeItemHandler(product: IProduct) {
    // remove item completely if allowed by minimum total rule
    const itemQty = product.quantity || counter || 0;
    const projectedTotal = (totalQuantity || 0) - itemQty;
    if (projectedTotal < 10) {
      // caso especial: se o total atual for exatamente 10 e o item tem qty <= 1, permitir remoção
      if (!((totalQuantity || 0) === 10 && itemQty <= 1)) {
        toast.warn('Não é possível remover este item: mínimo de 10 peças no pedido');
        return;
      }
    }

    // update local state
    const slug = product.slug?.current || product.id;
    dispatch(cartActions.removeItemCompletely(slug));

    // persist if backend id is available
    const cartItemId = (product as any).cartItemId;
    if (cartItemId) {
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
    const raw = parseInt(e.currentTarget.value, 10) || 1;
    let newVal = Math.max(1, Math.min(1000, raw));
    const prev = counter || 1;

    // garantir que o total do carrinho não fique abaixo de 10
    const desiredTotal = (totalQuantity || 0) - prev + newVal;
    if (desiredTotal < 10) {
      // ajustar newVal para que desiredTotal == 10
      newVal = prev + (10 - (totalQuantity || 0));
      newVal = Math.max(1, newVal);
      toast.warn('O pedido mínimo é de 10 peças no total — ajuste aplicado');
    }

    setCounter(newVal);

    // mirror + / - behavior: sync immediately with store/backend
    try {
      if (newVal > prev) {
        // increase by diff
        (dispatch as any)(addItemAndPersist({ product, quantity: newVal - prev }));
      } else if (newVal < prev) {
        const productSlugOrId = product.id || product.slug?.current;
        (dispatch as any)(updateItemQuantity({ productSlugOrId, quantity: newVal, cartItemId: (product as any).cartItemId }));
      }
    } catch (err) {
      console.error('Erro ao sincronizar quantidade via input', err);
      (dispatch as any)(fetchCart());
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
              <a className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                  {typeof imageUrl === 'string' && imageUrl.startsWith('http') ? (
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image
                      src={imageUrl}
                      width={96}
                      height={96}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div
                  className="flex-grow text-sm font-normal min-w-0"
                  style={{ direction: "ltr" }}
                >
                  <p className="truncate text-gray-900 dark:text-gray-100">{product.name}</p>
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
              min={minAllowed}
              max={1000}
              value={counter}
              onChange={onInputNumberChangeHandler}
              onBlur={commitQuantityChange}
            />
            {counter === 1 ? (
              <div
                onClick={() => removeItemHandler(product)}
                className="p-1"
              >
                <HiOutlineTrash style={{ fontSize: "1.3rem", color: "red" }} />
              </div>
            ) : (
              <div
                onClick={() => decrement(product)}
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
