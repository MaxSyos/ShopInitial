import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { toast } from 'react-toastify';
import api from '../lib/axiosClient';
import { MdAdd, MdDelete, MdArrowBack, MdUploadFile } from 'react-icons/md';
import { useRouter } from 'next/router';
import PrivateRoute from '../components/auth/PrivateRoute';
import { uploadImageToImgBB } from '../lib/services/imgbbService';

interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  children?: Category[];
}

interface Brand {
  id: string;
  name: string;
  logo?: string;
}

const ManageCategoriesBrands = () => {
  const { t } = useLanguage();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'categories' | 'brands'>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // Form states
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    parentId: '',
  });

  const [brandForm, setBrandForm] = useState({
    name: '',
    logo: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Carregar dados
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [categoriesRes, brandsRes] = await Promise.all([
        api.get('/categories'),
        api.get('/brands'),
      ]);

      setCategories(categoriesRes.data.items || []);
      setBrands(brandsRes.data.items || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error(t.errorLoadingData || 'Erro ao carregar dados');
    } finally {
      setLoadingData(false);
    }
  };

  const validateCategoryForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!categoryForm.name.trim()) {
      newErrors.categoryName = t.categoryNameRequired || 'Nome da categoria é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateBrandForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!brandForm.name.trim()) {
      newErrors.brandName = t.brandNameRequired || 'Nome da marca é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error(`${file.name} ${t.invalidImageType}`);
      return;
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`${file.name} ${t.imageTooLarge}`);
      return;
    }

    setUploadingLogo(true);
    try {
      const uploadedUrl = await uploadImageToImgBB(
        file,
        process.env.NEXT_PUBLIC_IMGBB_API_KEY
      );
      setBrandForm({ ...brandForm, logo: uploadedUrl });
      toast.success(t.imageUploadSuccess || 'Logo enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error(t.imageUploadError || 'Falha ao fazer upload da imagem');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCategoryForm()) {
      return;
    }

    setLoadingSubmit(true);
    try {
      const response = await api.post('/categories/create', {
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim(),
        parentId: categoryForm.parentId || undefined,
      });

      toast.success(t.categoryCreatedSuccessfully || 'Categoria criada com sucesso');
      setCategoryForm({ name: '', description: '', parentId: '' });
      setErrors({});
      await loadData();
    } catch (error: any) {
      console.error('Erro ao criar categoria:', error);
      toast.error(error.response?.data?.error || t.errorCreatingCategory || 'Erro ao criar categoria');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateBrandForm()) {
      return;
    }

    setLoadingSubmit(true);
    try {
      const response = await api.post('/brands/create', {
        name: brandForm.name.trim(),
        logo: brandForm.logo.trim(),
      });

      toast.success(t.brandCreatedSuccessfully || 'Marca criada com sucesso');
      setBrandForm({ name: '', logo: '' });
      setErrors({});
      await loadData();
    } catch (error: any) {
      console.error('Erro ao criar marca:', error);
      toast.error(error.response?.data?.error || t.errorCreatingBrand || 'Erro ao criar marca');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm(t.confirmDelete || 'Confirmar exclusão?')) {
      return;
    }

    try {
      await api.delete(`/categories/${id}`);
      toast.success(t.deletedSuccessfully || 'Deletado com sucesso');
      await loadData();
    } catch (error: any) {
      console.error('Erro ao deletar categoria:', error);
      toast.error(error.response?.data?.error || t.errorDeleting || 'Erro ao deletar');
    }
  };

  const handleDeleteBrand = async (id: string) => {
    if (!confirm(t.confirmDelete || 'Confirmar exclusão?')) {
      return;
    }

    try {
      await api.delete(`/brands/${id}`);
      toast.success(t.deletedSuccessfully || 'Deletado com sucesso');
      await loadData();
    } catch (error: any) {
      console.error('Erro ao deletar marca:', error);
      toast.error(error.response?.data?.error || t.errorDeleting || 'Erro ao deletar');
    }
  };

  return (
    <PrivateRoute requiredRole="ADMIN">
      <div className="min-h-screen bg-palette-fill p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 mt-6">
            <div>
              <h1 className="text-3xl font-bold text-palette-base mb-2">
                {t.categorization || 'Categorização'}
              </h1>
              <p className="text-palette-mute">
                {t.manageCategoriesBrandsDescription || 'Gerencie categorias e marcas'}
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 border border-palette-primary rounded-lg text-palette-base hover:bg-palette-card transition-colors"
            >
              <MdArrowBack size={20} />
              {t.goBack || 'Voltar'}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 border-b border-palette-primary">
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'categories'
                  ? 'text-palette-primary border-b-2 border-palette-primary'
                  : 'text-palette-mute hover:text-palette-base'
              }`}
            >
              {t.categories || 'Categorias'}
            </button>
            <button
              onClick={() => setActiveTab('brands')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'brands'
                  ? 'text-palette-primary border-b-2 border-palette-primary'
                  : 'text-palette-mute hover:text-palette-base'
              }`}
            >
              {t.brands || 'Marcas'}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Categories Section */}
            {activeTab === 'categories' && (
              <>
                {/* Create Category Form */}
                <div className="bg-palette-card rounded-lg p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-palette-base mb-4">
                    {t.createNewCategory || 'Criar Nova Categoria'}
                  </h2>

                  <form onSubmit={handleCreateCategory} className="space-y-4">
                    {/* Nome */}
                    <div>
                      <label className="block text-sm font-semibold text-palette-base mb-2">
                        {t.categoryName || 'Nome da Categoria'} *
                      </label>
                      <input
                        type="text"
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                        placeholder={t.categoryName || 'Nome da Categoria'}
                        className={`w-full px-4 py-2 border rounded-lg bg-palette-fill text-palette-base placeholder-palette-mute focus:outline-none focus:ring-2 focus:ring-palette-primary transition ${
                          errors.categoryName ? 'border-red-500' : 'border-palette-primary'
                        }`}
                      />
                      {errors.categoryName && (
                        <p className="text-red-500 text-sm mt-1">{errors.categoryName}</p>
                      )}
                    </div>

                    {/* Descrição */}
                    <div>
                      <label className="block text-sm font-semibold text-palette-base mb-2">
                        {t.description || 'Descrição'}
                      </label>
                      <textarea
                        value={categoryForm.description}
                        onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                        placeholder={t.description || 'Descrição'}
                        rows={3}
                        className="w-full px-4 py-2 border border-palette-primary rounded-lg bg-palette-fill text-palette-base placeholder-palette-mute focus:outline-none focus:ring-2 focus:ring-palette-primary transition resize-none"
                      />
                    </div>

                    {/* Categoria Pai */}
                    <div>
                      <label className="block text-sm font-semibold text-palette-base mb-2">
                        {t.parentCategory || 'Categoria Pai'}
                      </label>
                      <select
                        value={categoryForm.parentId}
                        onChange={(e) => setCategoryForm({ ...categoryForm, parentId: e.target.value })}
                        className="w-full px-4 py-2 border border-palette-primary rounded-lg bg-palette-fill text-palette-base focus:outline-none focus:ring-2 focus:ring-palette-primary transition dark:bg-palette-card"
                      >
                        <option value="">{t.selectCategory || 'Selecionar Categoria'}</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loadingSubmit}
                      className="w-full flex items-center justify-center gap-2 px-6 py-2 bg-palette-primary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      <MdAdd size={20} />
                      {loadingSubmit ? t.saving || 'Salvando...' : t.createCategory || 'Criar Categoria'}
                    </button>
                  </form>
                </div>

                {/* Existing Categories */}
                <div className="bg-palette-card rounded-lg p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-palette-base mb-4">
                    {t.existingCategories || 'Categorias Existentes'}
                  </h2>

                  {loadingData ? (
                    <p className="text-palette-mute">{t.loading || 'Carregando...'}</p>
                  ) : categories.length === 0 ? (
                    <p className="text-palette-mute">{t.noCategoriesFound || 'Nenhuma categoria encontrada'}</p>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {categories.map((category) => (
                        <div key={category.id} className="flex items-center justify-between p-3 bg-palette-fill rounded-lg">
                          <div>
                            <p className="font-semibold text-palette-base">{category.name}</p>
                            {category.description && (
                              <p className="text-sm text-palette-mute">{category.description}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="text-red-500 hover:text-red-700 transition-colors p-2"
                            title={t.delete || 'Deletar'}
                          >
                            <MdDelete size={20} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Brands Section */}
            {activeTab === 'brands' && (
              <>
                {/* Create Brand Form */}
                <div className="bg-palette-card rounded-lg p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-palette-base mb-4">
                    {t.createNewBrand || 'Criar Nova Marca'}
                  </h2>

                  <form onSubmit={handleCreateBrand} className="space-y-4">
                    {/* Nome */}
                    <div>
                      <label className="block text-sm font-semibold text-palette-base mb-2">
                        {t.brandName || 'Nome da Marca'} *
                      </label>
                      <input
                        type="text"
                        value={brandForm.name}
                        onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                        placeholder={t.brandName || 'Nome da Marca'}
                        className={`w-full px-4 py-2 border rounded-lg bg-palette-fill text-palette-base placeholder-palette-mute focus:outline-none focus:ring-2 focus:ring-palette-primary transition ${
                          errors.brandName ? 'border-red-500' : 'border-palette-primary'
                        }`}
                      />
                      {errors.brandName && (
                        <p className="text-red-500 text-sm mt-1">{errors.brandName}</p>
                      )}
                    </div>

                    {/* Logo Upload */}
                    <div>
                      <label className="block text-sm font-semibold text-palette-base mb-2">
                        {t.logoUrl || 'Logo da Marca'}
                      </label>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                        className="hidden"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          disabled={uploadingLogo}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-palette-primary rounded-lg bg-palette-fill text-palette-base hover:bg-palette-card transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                        >
                          <MdUploadFile size={20} />
                          {uploadingLogo ? t.uploading || 'Enviando...' : t.selectFile || 'Selecionar Logo'}
                        </button>
                      </div>
                      {brandForm.logo && (
                        <div className="mt-3 flex items-center gap-2">
                          <img
                            src={brandForm.logo}
                            alt="Preview"
                            className="w-16 h-16 object-contain border border-palette-primary rounded-lg"
                          />
                          <div className="flex-1">
                            <p className="text-sm text-palette-base font-semibold">{t.logoUploaded || 'Logo enviada'}</p>
                            <button
                              type="button"
                              onClick={() => setBrandForm({ ...brandForm, logo: '' })}
                              className="text-red-500 hover:text-red-700 text-sm font-medium mt-1"
                            >
                              {t.removeLogo || 'Remover Logo'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loadingSubmit}
                      className="w-full flex items-center justify-center gap-2 px-6 py-2 bg-palette-primary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      <MdAdd size={20} />
                      {loadingSubmit ? t.saving || 'Salvando...' : t.createBrand || 'Criar Marca'}
                    </button>
                  </form>
                </div>

                {/* Existing Brands */}
                <div className="bg-palette-card rounded-lg p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-palette-base mb-4">
                    {t.existingBrands || 'Marcas Existentes'}
                  </h2>

                  {loadingData ? (
                    <p className="text-palette-mute">{t.loading || 'Carregando...'}</p>
                  ) : brands.length === 0 ? (
                    <p className="text-palette-mute">{t.noBrandsFound || 'Nenhuma marca encontrada'}</p>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {brands.map((brand) => (
                        <div key={brand.id} className="flex items-center justify-between p-3 bg-palette-fill rounded-lg">
                          <div className="flex items-center gap-3 flex-1">
                            {brand.logo && (
                              <img
                                src={brand.logo}
                                alt={brand.name}
                                className="w-12 h-12 object-contain border border-palette-primary rounded"
                              />
                            )}
                            <div>
                              <p className="font-semibold text-palette-base">{brand.name}</p>
                              {brand.logo && (
                                <p className="text-xs text-palette-mute truncate max-w-xs">{brand.logo}</p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteBrand(brand.id)}
                            className="text-red-500 hover:text-red-700 transition-colors p-2"
                            title={t.delete || 'Deletar'}
                          >
                            <MdDelete size={20} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </PrivateRoute>
  );
};

export default ManageCategoriesBrands;
