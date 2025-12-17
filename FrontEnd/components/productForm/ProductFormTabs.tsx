import React, { useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import ProductForm from './ProductForm';
import EditProductForm from './EditProductForm';
import { MdAdd, MdEdit } from 'react-icons/md';

type TabType = 'create' | 'edit';

const ProductFormTabs: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('create');

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-palette-border">
        <button
          onClick={() => setActiveTab('create')}
          className={`flex items-center gap-2 px-4 py-3 font-semibold transition-colors border-b-2 ${
            activeTab === 'create'
              ? 'text-palette-primary border-palette-primary'
              : 'text-palette-mute border-transparent hover:text-palette-base'
          }`}
        >
          <MdAdd size={20} />
          {t.createNewProduct || 'Criar Novo Produto'}
        </button>
        <button
          onClick={() => setActiveTab('edit')}
          className={`flex items-center gap-2 px-4 py-3 font-semibold transition-colors border-b-2 ${
            activeTab === 'edit'
              ? 'text-palette-primary border-palette-primary'
              : 'text-palette-mute border-transparent hover:text-palette-base'
          }`}
        >
          <MdEdit size={20} />
          {t.editProduct || 'Editar Produto'}
        </button>
      </div>

      {/* Conteúdo das abas */}
      <div className="mt-6">
        {activeTab === 'create' && <ProductForm />}
        {activeTab === 'edit' && <EditProductForm />}
      </div>
    </div>
  );
};

export default ProductFormTabs;
