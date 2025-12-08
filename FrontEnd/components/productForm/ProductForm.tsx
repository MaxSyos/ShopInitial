import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { toast } from 'react-toastify';
import api from '../../lib/axiosClient';
import ImageUploadComponent from './ImageUpload';
import Input from '../UI/Input';
import { MdSave, MdArrowBack } from 'react-icons/md';
import { useRouter } from 'next/router';

interface ImagePreview {
  url: string;
  file?: File;
  alt?: string;
  isUploading?: boolean;
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

const ProductForm: React.FC = () => {
  const { t } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<ImagePreview[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
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

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = t.productNameRequired;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = t.priceGreaterThanZero;
    }

    if (formData.stock === '' || parseInt(formData.stock) < 0) {
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
      [name]: value,
    }));
    // Limpar erro do campo
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
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
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        sku: formData.sku || undefined,
        brandId: formData.brandId || undefined,
        categoryId: formData.categoryId || undefined,
        images: images.map((img) => ({
          url: img.url,
          alt: img.alt || formData.name,
        })),
      };

      const response = await api.post('/products/create', payload);

      toast.success(t.productCreatedSuccess);
      
      // Redirecionar após sucesso
      setTimeout(() => {
        router.push('/products');
      }, 1500);
    } catch (error: any) {
      console.error('Erro ao criar produto:', error);
      const message =
        error?.response?.data?.message || t.productCreateError;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
              value={formData.name}
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
              value={formData.description}
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
              value={formData.sku}
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
              value={formData.price}
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
              value={formData.stock}
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
              value={formData.categoryId}
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
              value={formData.brandId}
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

      {/* Imagens */}
      <div className="bg-palette-card rounded-lg p-6 shadow-sm">
        <ImageUploadComponent
          images={images}
          onImagesChange={setImages}
          maxImages={5}
          apiKey={process.env.NEXT_PUBLIC_IMGBB_API_KEY}
        />
        {errors.images && (
          <p className="text-red-500 text-sm mt-2">{errors.images}</p>
        )}
      </div>

      {/* Botões */}
      <div className="flex gap-4 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 px-6 py-2 border border-palette-primary rounded-lg text-palette-base hover:bg-palette-card transition-colors"
        >
          <MdArrowBack size={20} />
          {t.goBack}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-palette-primary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          <MdSave size={20} />
          {loading ? t.saving : t.saveProduct}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
