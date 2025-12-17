import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { toast } from 'react-toastify';
import api from '../../lib/axiosClient';
import ImageUploadComponent from './ImageUpload';
import Input from '../UI/Input';
import { MdSave, MdArrowBack, MdDelete, MdClose } from 'react-icons/md';
import { useRouter } from 'next/router';

interface ImagePreview {
  id?: string;
  url: string;
  file?: File;
  alt?: string;
  isUploading?: boolean;
  order?: number;
}

interface Brand {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  children?: Category[];
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  sku?: string;
  brandId?: string;
  categoryId?: string;
  images: Array<{
    id: string;
    url: string;
    alt?: string;
    order: number;
  }>;
  primaryImageId?: string;
}

const EditProductForm: React.FC = () => {
  const { t } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [showSearch, setShowSearch] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [primaryImageId, setPrimaryImageId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    sku: '',
    brandId: '',
    categoryId: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Carregar marcas e categorias
  useEffect(() => {
    loadBrandsAndCategories();
  }, []);

  const loadBrandsAndCategories = async () => {
    try {
      const [brandsRes, categoriesRes] = await Promise.all([
        api.get('/brands'),
        api.get('/categories'),
      ]);

      setBrands(brandsRes.data.items || []);
      setCategories(categoriesRes.data.items || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.warning('Marcas e categorias podem não estar disponíveis');
    }
  };

  const searchProducts = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await api.get('/products/search', {
        params: { q: query, limit: 10 },
      });
      setSearchResults(response.data.data || response.data.items || []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      toast.error('Erro ao buscar produtos');
    } finally {
      setSearching(false);
    }
  };

  const selectProduct = (product: Product) => {
    setFormData({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      sku: product.sku,
      brandId: product.brandId,
      categoryId: product.categoryId,
    });

    // Carregar imagens existentes
    const loadedImages: ImagePreview[] = (product.images || [])
      .sort((a, b) => a.order - b.order)
      .map((img) => ({
        id: img.id,
        url: img.url,
        alt: img.alt,
        order: img.order,
      }));

    setImages(loadedImages);
    setPrimaryImageId(product.primaryImageId || loadedImages[0]?.id || null);
    setShowSearch(false);
    setSearchQuery('');
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name?.trim()) {
      newErrors.name = t.productNameRequired;
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = t.priceGreaterThanZero;
    }

    if (formData.stock === undefined || formData.stock < 0) {
      newErrors.stock = t.stockCannotBeNegative;
    }

    if (images.length === 0) {
      newErrors.images = t.imagesRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) : name === 'stock' ? parseInt(value) : value,
    }));
    // Limpar erro do campo
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSetPrimaryImage = (imageId: string) => {
    setPrimaryImageId(imageId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(t.fillRequiredFields);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        price: formData.price,
        stock: formData.stock,
        sku: formData.sku || undefined,
        brandId: formData.brandId || undefined,
        categoryId: formData.categoryId || undefined,
        primaryImageId: primaryImageId || undefined,
        images: images.map((img, idx) => ({
          ...(img.id && { id: img.id }),
          url: img.url,
          alt: img.alt || formData.name,
          order: idx,
        })),
      };

      const response = await api.put(`/products/${formData.id}`, payload);

      toast.success(t.productUpdatedSuccess || 'Produto atualizado com sucesso!');

      // Redirecionar após sucesso
      setTimeout(() => {
        router.push('/products');
      }, 1500);
    } catch (error: any) {
      console.error('Erro ao atualizar produto:', error);
      const message = error?.response?.data?.message || t.productUpdateError || 'Erro ao atualizar produto';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Se está na tela de busca
  if (showSearch) {
    return (
      <div className="bg-palette-card rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-bold text-palette-base mb-4">
          Selecionar Produto para Editar
        </h2>

        {/* Busca */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-palette-base mb-2">
            Buscar Produto *
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchProducts(e.target.value);
              }}
              placeholder="Digite o nome do produto..."
              className="flex-1 px-4 py-2 border border-palette-primary rounded-lg bg-palette-fill text-palette-base placeholder-palette-mute focus:outline-none focus:ring-2 focus:ring-palette-primary transition"
            />
          </div>
          {searching && (
            <p className="text-palette-mute text-sm mt-2">Buscando...</p>
          )}
        </div>

        {/* Resultados */}
        {searchResults.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-palette-base mb-2">
              {searchResults.length} resultado(s) encontrado(s):
            </p>
            {searchResults.map((product) => (
              <div
                key={product.id}
                onClick={() => selectProduct(product)}
                className="p-4 border border-palette-border rounded-lg cursor-pointer hover:bg-palette-fill transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-palette-base">{product.name}</h3>
                    <p className="text-sm text-palette-mute">SKU: {product.sku || '-'}</p>
                    <p className="text-sm font-bold text-palette-primary">
                      R$ {product.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-palette-mute">
                      {product.images?.length || 0} imagens
                    </p>
                    <p className="text-sm text-palette-mute">
                      Estoque: {product.stock}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {searchQuery && searchResults.length === 0 && !searching && (
          <p className="text-center text-palette-mute py-8">
            Nenhum produto encontrado
          </p>
        )}
      </div>
    );
  }

  // Formulário de edição
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Produto Selecionado */}
      <div className="bg-palette-card rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-palette-base">
            Editando: {formData.name}
          </h3>
          <button
            type="button"
            onClick={() => {
              setShowSearch(true);
              setFormData({});
              setImages([]);
              setPrimaryImageId(null);
            }}
            className="text-palette-mute hover:text-palette-base transition-colors"
          >
            <MdClose size={24} />
          </button>
        </div>
      </div>

      {/* Informações básicas */}
      <div className="bg-palette-card rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-bold text-palette-base mb-4">
          {t.basicInformation}
        </h2>

        <div className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-semibold text-palette-base mb-2">
              {t.productName} *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name || ''}
              onChange={handleInputChange}
              placeholder={t.productName}
              className={`w-full px-4 py-2 border rounded-lg bg-palette-fill text-palette-base placeholder-palette-mute focus:outline-none focus:ring-2 focus:ring-palette-primary transition ${
                errors.name ? 'border-red-500' : 'border-palette-primary'
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-semibold text-palette-base mb-2">
              {t.productDescription}
            </label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleInputChange}
              placeholder={t.productDescription}
              rows={4}
              className="w-full px-4 py-2 border border-palette-primary rounded-lg bg-palette-fill text-palette-base placeholder-palette-mute focus:outline-none focus:ring-2 focus:ring-palette-primary transition resize-none"
            />
          </div>

          {/* SKU */}
          <div>
            <label className="block text-sm font-semibold text-palette-base mb-2">
              {t.productSKU}
            </label>
            <input
              type="text"
              name="sku"
              value={formData.sku || ''}
              onChange={handleInputChange}
              placeholder={t.productSKU}
              className="w-full px-4 py-2 border border-palette-primary rounded-lg bg-palette-fill text-palette-base placeholder-palette-mute focus:outline-none focus:ring-2 focus:ring-palette-primary transition"
            />
          </div>
        </div>
      </div>

      {/* Preço e estoque */}
      <div className="bg-palette-card rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-bold text-palette-base mb-4">
          {t.priceAndStock}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Preço */}
          <div>
            <label className="block text-sm font-semibold text-palette-base mb-2">
              {t.productPrice} *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price || ''}
              onChange={handleInputChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              className={`w-full px-4 py-2 border rounded-lg bg-palette-fill text-palette-base placeholder-palette-mute focus:outline-none focus:ring-2 focus:ring-palette-primary transition ${
                errors.price ? 'border-red-500' : 'border-palette-primary'
              }`}
            />
            {errors.price && (
              <p className="text-red-500 text-sm mt-1">{errors.price}</p>
            )}
          </div>

          {/* Estoque */}
          <div>
            <label className="block text-sm font-semibold text-palette-base mb-2">
              {t.productStock} *
            </label>
            <input
              type="number"
              name="stock"
              value={formData.stock || ''}
              onChange={handleInputChange}
              placeholder="0"
              min="0"
              className={`w-full px-4 py-2 border rounded-lg bg-palette-fill text-palette-base placeholder-palette-mute focus:outline-none focus:ring-2 focus:ring-palette-primary transition ${
                errors.stock ? 'border-red-500' : 'border-palette-primary'
              }`}
            />
            {errors.stock && (
              <p className="text-red-500 text-sm mt-1">{errors.stock}</p>
            )}
          </div>
        </div>
      </div>

      {/* Categorias e Marcas */}
      <div className="bg-palette-card rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-bold text-palette-base mb-4">
          {t.categorization}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Categoria */}
          <div>
            <label className="block text-sm font-semibold text-palette-base mb-2">
              {t.productCategory}
            </label>
            <select
              name="categoryId"
              value={formData.categoryId || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-palette-primary rounded-lg bg-palette-fill text-palette-base focus:outline-none focus:ring-2 focus:ring-palette-primary transition dark:bg-palette-card"
            >
              <option value="">{t.selectCategory}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Marca */}
          <div>
            <label className="block text-sm font-semibold text-palette-base mb-2">
              {t.productBrand}
            </label>
            <select
              name="brandId"
              value={formData.brandId || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-palette-primary rounded-lg bg-palette-fill text-palette-base focus:outline-none focus:ring-2 focus:ring-palette-primary transition dark:bg-palette-card"
            >
              <option value="">{t.selectBrand}</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Imagens com Indicador de Principal */}
      <div className="bg-palette-card rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-palette-base mb-4">
          Gerenciar Imagens
        </h2>

        <ImageUploadComponent
          images={images}
          onImagesChange={setImages}
          maxImages={10}
          apiKey={process.env.NEXT_PUBLIC_IMGBB_API_KEY}
        />

        {/* Seletor de Imagem Principal */}
        {images.length > 0 && (
          <div className="mt-6">
            <label className="block text-sm font-semibold text-palette-base mb-3">
              Selecione a Imagem Principal ⭐
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSetPrimaryImage(img.id || img.url)}
                  className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all hover:border-palette-primary ${
                    primaryImageId === (img.id || img.url)
                      ? 'border-palette-primary ring-2 ring-palette-primary'
                      : 'border-palette-border hover:border-palette-primary'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.alt || `Imagem ${idx + 1}`}
                    className="w-full h-24 object-cover"
                  />
                  {primaryImageId === (img.id || img.url) && (
                    <div className="absolute top-1 right-1 bg-palette-primary text-white rounded-full p-1 text-sm font-bold">
                      ⭐
                    </div>
                  )}
                  <p className="text-xs text-center p-1 bg-palette-fill text-palette-mute">
                    #{idx + 1}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {errors.images && (
          <p className="text-red-500 text-sm mt-2">{errors.images}</p>
        )}
      </div>

      {/* Botões */}
      <div className="flex gap-4 justify-end">
        <button
          type="button"
          onClick={() => {
            setShowSearch(true);
            setFormData({});
            setImages([]);
            setPrimaryImageId(null);
          }}
          className="flex items-center gap-2 px-6 py-2 border border-palette-primary rounded-lg text-palette-base hover:bg-palette-card transition-colors"
        >
          <MdArrowBack size={20} />
          {t.goBack || 'Voltar'}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-palette-primary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          <MdSave size={20} />
          {loading ? t.saving : 'Salvar Alterações'}
        </button>
      </div>
    </form>
  );
};

export default EditProductForm;
