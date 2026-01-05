import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect } from "react";
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
  const [counter, setCounter] = useState(productQuantity ?? product.quantity ?? 1);
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const totalQuantity = useSelector((state: ICartRootState) => state.cart.totalQuantity);
  const safePrev = counter || product.quantity || 1;
  const minAllowed = 1;

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
    // decrement normally (no global minimum enforcement here)
    const current = counter || prod.quantity || 1;
    if (current > 1) {
      setCounter((prev) => --prev!);
      const productSlugOrId = prod.id || prod.slug?.current;
      (dispatch as any)(updateItemQuantity({ productSlugOrId, quantity: current - 1, cartItemId: (prod as any).cartItemId }));
    }
  }

  function removeItemHandler(product: IProduct) {
    // Remover o item a pedido do usuário, sem validação de mínimo total
    const slug = product.slug?.current || product.id;
    dispatch(cartActions.removeItemCompletely(slug));

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

    setCounter(newVal);

    // mirror + / - behavior: sync immediately with store/backend
    try {
      if (newVal > prev) {
        (dispatch as any)(addItemAndPersist({ product, quantity: newVal - prev }));
      } else if (newVal < prev) {
        const productSlugOrId = product.id || product.slug?.current;
        (dispatch as any)(updateItemQuantity({ productSlugOrId, quantity: newVal, cartItemId: (product as any).cartItemId }));
      }
    } catch (err) {
      console.error('Erro ao sincronizar quantidade via input', err);
      (dispatch as any)(fetchCart());
    }

    // (duplicated sync removed) -- already sincronizado acima
    
  }
  // Lista de nomes modal
  const [showListModal, setShowListModal] = useState(false);
  const storageKey = 'user_lists_v1';

  type Row = { name: string; number?: string; size: string };

  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    // inicializar linhas quando abrir modal ou quando o contador mudar
    if (showListModal) {
      const initial: Row[] = Array.from({ length: counter || 1 }).map(() => ({ name: '', number: '', size: 'M' }));
      setRows((prev) => {
        // se já houver conteúdo salvo no localStorage para este product/cartItem, prefira ele
        try {
          const raw = localStorage.getItem(storageKey);
          if (raw) {
            const parsed = JSON.parse(raw || '{}') || {};
            const key = (product as any).cartItemId || product.id || product.slug?.current;
            if (parsed[key]) return parsed[key];
          }
        } catch (e) {}
        // se não houver salvo, use initial tamanho do counter
        return initial;
      });
    }
  }, [showListModal, counter]);

  function updateRow(idx: number, field: keyof Row, value: string) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }

  async function saveList() {
    const payload = rows.map((r) => ({ name: (r.name || '').trim() || '', number: (r.number || '').trim() || '', size: r.size || 'M' }));
    // tentar persistir no servidor se tivermos um orderItemId
    const orderItemId = (product as any).orderItemId || undefined;
    try {
      if (orderItemId) {
        const resp = await fetch('/api/orders/lists', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderItemId, rows: payload }) });
        if (!resp.ok) throw new Error('Falha ao salvar no servidor');
        toast.success('Lista salva no pedido.');
      } else {
        // fallback para localStorage por cartItem/product id
        const key = (product as any).cartItemId || product.id || product.slug?.current;
        const raw = localStorage.getItem(storageKey);
        const parsed = raw ? JSON.parse(raw) : {};
        parsed[key] = payload;
        localStorage.setItem(storageKey, JSON.stringify(parsed));
        toast.success('Lista salva localmente (será associada ao pedido após checkout).');
      }
      setShowListModal(false);
    } catch (err: any) {
      console.error('saveList error', err);
      toast.error('Erro ao salvar lista');
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
            <div className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <Link href={productUrl}>
                <a className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
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
                </a>
              </Link>

              <div className="flex-1 min-w-0" style={{ direction: 'ltr' }}>
                <Link href={productUrl}>
                  <a className="block">
                    <p className="truncate text-gray-900 dark:text-gray-100 text-sm font-normal">{product.name}</p>
                  </a>
                </Link>
              </div>

              <div className="flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowListModal(true)}
                  className="px-3 py-1 bg-amber-400 hover:bg-amber-500 dark:bg-amber-500 text-black dark:text-black text-xs rounded-md font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                >
                  Lista de nomes
                </button>
              </div>
            </div>
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
              className="inline-block w-[65px] rtl:pr-7 ltr:pl-7 py-2 mx-1 border-[1px] border-gray-400 rounded-md"
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
      {showListModal ? (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 z-[99998]" onClick={() => setShowListModal(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-md p-4 z-[100000] w-[95%] max-w-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="font-bold mb-2">Lista de nomes — {product.name}</h3>
            <div className="space-y-2">
              {rows.map((r, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    className="flex-1 border p-2 rounded-md uppercase"
                    placeholder="SEM NOME"
                    value={r.name}
                    onChange={(e) => updateRow(idx, 'name', e.currentTarget.value.toUpperCase())}
                  />
                  <input className="w-28 border p-2 rounded-md" placeholder="sem nº" value={r.number} onChange={(e) => updateRow(idx, 'number', e.target.value)} />
                  <select className="w-28 border p-2 rounded-md" value={r.size} onChange={(e) => updateRow(idx, 'size', e.target.value)}>
                    <option value="PP">PP</option>
                    <option value="P">P</option>
                    <option value="M">M</option>
                    <option value="G">G</option>
                    <option value="GG">GG</option>
                    <option value="EXG">EXG</option>
                    <option value="EXGG">EXGG</option>
                    <option value="BLPP">BLPP</option>
                    <option value="BLP">BLP</option>
                    <option value="BLM">BLM</option>
                    <option value="BLG">BLG</option>
                    <option value="BLGG">BLGG</option>
                    <option value="BLEXG">BLEXG</option>
                    <option value="BLEXGG">BLEXGG</option>
                    <option value="ANOS_2">2 ANOS</option>
                    <option value="ANOS_4">4 ANOS</option>
                    <option value="ANOS_6">6 ANOS</option>
                    <option value="ANOS_8">8 ANOS</option>
                    <option value="ANOS_10">10 ANOS</option>
                    <option value="ANOS_12">12 ANOS</option>
                    <option value="ANOS_14">14 ANOS</option>
                  </select>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-1 border rounded-md" onClick={() => setShowListModal(false)}>Cancelar</button>
              <button
                className="px-3 py-1 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-green-300"
                onClick={saveList}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CartItem;
