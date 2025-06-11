import type { NextPage } from "next";
import CartList from "../components/cart/CartList";
import Breadcrumb from "../components/UI/Breadcrumb";
import OrderSummaryBox from "../components/cart/OrderSummaryBox";
import PrivateRoute from "../components/auth/PrivateRoute";

const cart: NextPage = () => {
  return (
    <PrivateRoute>
      <div>
        <Breadcrumb />
        <div className="flex justify-center flex-col md:flex-row items-start relative max-w-[2100px] mx-auto">
          <CartList />
          <OrderSummaryBox />
        </div>
      </div>
    </PrivateRoute>
  );
};

export default cart;
