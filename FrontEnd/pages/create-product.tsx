import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import ProductForm from '../components/productForm/ProductForm';
import Breadcrumb from '../components/UI/Breadcrumb';
import Benefits from '../components/Benefits';
import PrivateRoute from '../components/auth/PrivateRoute';

const CreateProductPage: React.FC = () => {
  const { t } = useLanguage();

  return (
    <PrivateRoute requiredRole="ADMIN">
      <div className="min-h-screen bg-palette-fill">
        {/* Breadcrumb */}
        <Breadcrumb />

        {/* Container principal */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-palette-base mb-2">
              {t.createNewProduct}
            </h1>
            <p className="text-palette-mute">
              {t.fillProductFields}
            </p>
          </div>

          {/* Formulário */}
          <ProductForm />
        </div>

        {/* Benefits */}
        <Benefits />
      </div>
    </PrivateRoute>
  );
};

export default CreateProductPage;
