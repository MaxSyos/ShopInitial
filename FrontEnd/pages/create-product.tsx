import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import ProductForm from '../components/productForm/ProductForm';
import EditProductPanel from '../components/productForm/EditProductPanel';
import Breadcrumb from '../components/UI/Breadcrumb';
import Benefits from '../components/Benefits';
import PrivateRoute from '../components/auth/PrivateRoute';

const CreateProductPage: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'create' | 'edit'>('create');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  return (
    <PrivateRoute requiredRole="ADMIN">
      <div className="min-h-screen bg-palette-fill">
        {/* Breadcrumb */}
        <Breadcrumb />

        {/* Container principal */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-palette-base mb-2">
              {t.createNewProduct}
            </h1>
            <p className="text-palette-mute">
              {t.fillProductFields}
            </p>
          </div>

          {/* Tabs: Criar / Editar */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 justify-between border-b border-palette-border pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('create')}
                  className={`px-4 py-2 -mb-px ${activeTab === 'create' ? 'border-b-2 border-palette-primary font-semibold' : 'text-palette-mute'}`}
                >
                  {t.createNewProduct}
                </button>
                <button
                  onClick={() => setActiveTab('edit')}
                  className={`px-4 py-2 -mb-px ${activeTab === 'edit' ? 'border-b-2 border-palette-primary font-semibold' : 'text-palette-mute'}`}
                >
                  {t.editProducts || 'Editar produtos'}
                </button>
              </div>
              <div className="mt-3 sm:mt-0 text-sm text-palette-mute">{activeTab === 'create' ? t.fillProductFields : 'Selecione um produto à esquerda para editar'}</div>
            </div>
          </div>

          {activeTab === 'create' ? (
            <ProductForm />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <aside className="lg:col-span-1">
                <div className="sticky top-24">
                  <EditProductPanel onSelect={(id) => setSelectedProductId(id)} />
                </div>
              </aside>
              <main className="lg:col-span-2">
                <div className="space-y-6">
                  <ProductForm productId={selectedProductId} onSaved={() => setSelectedProductId(null)} />
                </div>
              </main>
            </div>
          )}
        </div>

        {/* Benefits */}
        <Benefits />
      </div>
    </PrivateRoute>
  );
};

export default CreateProductPage;
