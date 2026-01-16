import type { NextPage } from "next";
import React, { useState } from "react";
import CartList from "../components/cart/CartList";
import Breadcrumb from "../components/UI/Breadcrumb";
import OrderSummaryBox from "../components/cart/OrderSummaryBox";
import PrivateRoute from "../components/auth/PrivateRoute";

const Cart: NextPage = () => {
  const [showSizesModal, setShowSizesModal] = useState(false);
  return (
    <PrivateRoute>
      <div>
        {/* Botão centralizado acima do breadcrumb */}
        <div className="w-full flex justify-center mt-4">
          <button
            type="button"
            onClick={() => setShowSizesModal(true)}
            className="bg-palette-primary text-white px-4 py-2 rounded-md shadow-md"
          >
            Tabela de Tamanhos
          </button>
        </div>

        <Breadcrumb />

        {showSizesModal && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 dark:bg-black/60"
              onClick={() => setShowSizesModal(false)}
            />
            <div className="relative bg-white dark:bg-gray-900 rounded-md p-6 max-w-3xl w-full z-[100000] shadow-lg">
              <div className="flex justify-end">
                <button
                  className="px-3 py-1 bg-palette-primary dark:bg-palette-primary text-white rounded-md"
                  onClick={() => setShowSizesModal(false)}
                >
                  Fechar
                </button>
              </div>
              <div className="mt-4 flex flex-col items-center gap-4">
                <img
                  src="/sizes/tabela_de_tamanhos.png"
                  alt="Tabela de tamanhos"
                  className="max-h-[60vh] object-contain"
                />
                <p className="text-center text-sm text-palette-mute dark:text-slate-300">
                  Os tamanhos das camisas podem variar até 4cm de tamanho após o processo de sublimação de acordo com as indicações do fabricante do tecido.
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-center flex-col md:flex-row items-start relative max-w-[2100px] mx-auto">
          <CartList />
          <OrderSummaryBox />
        </div>
      </div>
    </PrivateRoute>
  );
};

export default Cart;
