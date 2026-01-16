import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { useLanguage } from "../../hooks/useLanguage";
import { ICartRootState } from "../../lib/types/cart";
import ProductPrice from "../UI/ProductPrice";
import { changeNumbersFormatEnToFa } from "../../utilities/changeNumbersFormatEnToFa";

const OrderSummaryBox = () => {
  const { t, locale } = useLanguage();
  const totalAmount = useSelector(
    (state: ICartRootState) => state.cart.totalAmount
  );
  const totalQuantity = useSelector(
    (state: ICartRootState) => state.cart.totalQuantity
  );

  const router = useRouter();
     const [showMinModal, setShowMinModal] = useState(false);
     const MIN_QTY = 10;

  return (
    <>
      {totalQuantity > 0 ? (
        <div className="flex-grow sticky bottom-0 left-0 right-0 md:top-36 shadow-lg bg-palette-card border-2 rounded-lg py-4 xl:py-12 px-4 xl:px-8 -mx-[1rem] md:mx-4 xl:mx-8 mt-2 w-[100vw] md:w-auto  md:min-w-[300px] md:max-w-[400px]">
          <h3 className="text-md sm:text-lg md:text-xl">{t.orderSummary}</h3>
          <div className="flex flex-col my-1 sm:my-2">
            <div className="flex items-center justify-between md:my-4">
              <p className="text-sm sm:text-base text-palette-mute md:text-palette-base">
                {t.totalQuantity}
              </p>
              <p className="rtl:ml-1 ltr:mr-1 font-bold">
                {locale === "en" || "br"
                  ? totalQuantity
                  : changeNumbersFormatEnToFa(totalQuantity)}
              </p>
            </div>
            <div className="flex flex-wrap items-baseline justify-between flex-grow md:my-4">
              <p className="text-sm sm:text-base text-palette-mute md:text-palette-base">
                {t.totalAmount}
              </p>
              <ProductPrice price={totalAmount} />
            </div>
          </div>
          <button
            onClick={(e) => {
              if (totalQuantity < MIN_QTY) {
                e.preventDefault();
                setShowMinModal(true);
                return;
              }
              router.push("/shipping-address");
            }}
            className="block bg-palette-primary md:mt-8 py-3 rounded-lg text-palette-side text-center shadow-lg w-full"
          >
            {t.order}
          </button>

          {showMinModal && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center">
              <div className="absolute inset-0 bg-black/50 dark:bg-black/60 z-[99998]" onClick={() => setShowMinModal(false)} />
              <div className="relative bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md mx-4 shadow-lg z-[100000] text-gray-900 dark:text-gray-100">
                <h3 className="text-lg font-semibold mb-2">Atenção</h3>
                <p className="mb-4">Quantidade mínima de {MIN_QTY} peças necessária para finalizar o pedido.</p>
                <div className="flex justify-end">
                  <button
                    className="px-4 py-2 bg-palette-primary dark:bg-palette-primary text-white rounded-md"
                    onClick={() => setShowMinModal(false)}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-palette-mute text-lg mx-auto mt-12">
          {t.cartIsEmpty}
        </p>
      )}
    </>
  );
};

export default OrderSummaryBox;
