import React from 'react';
import Orders from '../components/orders';
import Breadcrumb from '../components/UI/Breadcrumb';
import PrivateRoute from '../components/auth/PrivateRoute';
import Benefits from '../components/Benefits';

const OrdersPage = () => {
  return (
    <PrivateRoute>
      <div>
        <Breadcrumb />
        <Orders />
        <Benefits />
      </div>
    </PrivateRoute>
  );
};

export default OrdersPage;
