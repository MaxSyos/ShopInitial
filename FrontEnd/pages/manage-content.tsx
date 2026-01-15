import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { toast } from 'react-toastify';
import api from '../lib/axiosClient';
import { MdAdd, MdDelete, MdArrowBack, MdUploadFile, MdEdit } from 'react-icons/md';
import { useRouter } from 'next/router';
import PrivateRoute from '../components/auth/PrivateRoute';
import { uploadImageToImgBB } from '../lib/services/imgbbService';
import { Product } from '../lib/services/productService';

interface Banner {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  buttonText?: string;
  linkUrl?: string;
  isActive: boolean;
  order: number;
  numberOfDiscountDate?: number;
}

interface CarouselImage {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  linkUrl?: string;
  isActive: boolean;
  order: number;
}

interface Offer {
  id: string;
  productId: string;
  discount: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

interface Brand {
  id: string;
  name: string;
  logo?: string;
}

interface CategoryGrid {
  id: string;
  name: string;
  title: string;
  description?: string;
  href?: string;
  imgSrc?: string;
  imgWidth: number;
  imgHeight: number;
  backgroundColor?: string;
  flexDirection?: string;
  paddingBlock?: string;
  paddingInline?: string;
  gridColumn?: string;
  isCentered: boolean;
  isSmall: boolean;
  order: number;
  isActive: boolean;
}

type TabType = 'banners' | 'carousel' | 'offers' | 'brands' | 'categories' | 'whatsapp';

const ManageContent = () => {
  const { t } = useLanguage();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('banners');
  
  // Helper para extrair token do localStorage
  const getAuthHeaders = () => {
    if (typeof window === 'undefined') return {};
    try {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const userData = JSON.parse(userInfo);
        const token = userData.accessToken || userData.token;
        return token ? { Authorization: `Bearer ${token}` } : {};
      }
    } catch (error) {
      console.error('Erro ao extrair token:', error);
    }
    return {};
  };
  
  // Data states
  const [banners, setBanners] = useState<Banner[]>([]);
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<CategoryGrid[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Form states
  const [bannerForm, setBannerForm] = useState({
    title: '',
    description: '',
    imageUrl: '',
    buttonText: '',
    linkUrl: '',
    isActive: true,
    numberOfDiscountDate: 0,
  });

  const [carouselForm, setCarouselForm] = useState({
    title: '',
    description: '',
    imageUrl: '',
    linkUrl: '',
    isActive: true,
  });

  const [offerForm, setOfferForm] = useState({
    productId: '',
    discount: '',
    isActive: true,
    startDate: '',
    endDate: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    title: '',
    description: '',
    href: '',
    imgSrc: '',
    imgWidth: 190,
    imgHeight: 240,
    backgroundColor: '',
    flexDirection: 'row',
    paddingBlock: '1rem',
    paddingInline: '1rem',
    gridColumn: 'span 3 / span 3',
    isCentered: false,
    isSmall: false,
    isActive: true,
  });

  // WhatsApp setting
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const [loadingWhatsapp, setLoadingWhatsapp] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const fetchProducts = async (retryCount = 0) => {
    setProductsError(null);
    try {
      const headers = getAuthHeaders();
      
      const res = await api.get('/products?limit=200', { headers });
      const items = res.data?.items || [];
      setProducts(items);
      /* if (items.length > 0) {
        toast.success(`${items.length} produtos carregados`);
      } */
    } catch (err: any) {
      const msg = String(err?.message || err || 'Erro desconhecido');
      console.error('manage-content: error fetching products', err, err?.response?.status, err?.response?.data);
      setProducts([]);
      
      // Retry automático até 2 vezes se falhar por timeout ou erro de rede
      if (retryCount < 2 && (err.code === 'ECONNABORTED' || err.message.includes('timeout') || !err.response)) {
        toast.info('Tentando carregar novamente...');
        setTimeout(() => fetchProducts(retryCount + 1), 2000);
        return;
      }
      
      setProductsError(msg);
      if (msg.includes('ERR_BLOCKED_BY_CLIENT') || /blocked/i.test(msg)) {
        toast.warn('Requisição a /api/products bloqueada no navegador (extensão adblock)...');
      } else {
        toast.error(t.errorLoadingData || 'Erro ao carregar produtos');
      }
    }
  };

  const loadData = async () => {
    setLoadingData(true);
    try {
      const headers = getAuthHeaders();

      const [bannersRes, carouselRes, offersRes, brandsRes, categoriesRes, whatsappRes] = await Promise.all([
        api.get('/content/banners', { headers }),
        api.get('/content/carousel', { headers }),
        api.get('/content/offers', { headers }),
        api.get('/brands', { headers }),
        api.get('/content/categories', { headers }),
        api.get('/content/whatsapp', { headers }),
      ]);

      setBanners(bannersRes.data.items || []);
      setCarouselImages(carouselRes.data.items || []);
      setOffers(offersRes.data.items || []);
      setBrands(brandsRes.data.items || []);
      setCategories(categoriesRes.data.items || []);
      setWhatsappNumber(whatsappRes?.data?.item?.value || '');
      
      await fetchProducts();
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error(t.errorLoadingData || 'Erro ao carregar dados');
    } finally {
      setLoadingData(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(`${file.name} ${t.invalidImageType || 'tipo de imagem inválido'}`);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(`${file.name} ${t.imageTooLarge || 'imagem muito grande'}`);
      return;
    }

    setUploading(true);
    try {
      const uploadedUrl = await uploadImageToImgBB(
        file,
        process.env.NEXT_PUBLIC_IMGBB_API_KEY
      );
      callback(uploadedUrl);
      toast.success(t.imageUploadSuccess || 'Imagem enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error(t.imageUploadError || 'Falha ao fazer upload da imagem');
    } finally {
      setUploading(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  // ========== BANNERS HANDLERS ==========
  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};
    if (!bannerForm.title.trim()) newErrors.title = 'Título é obrigatório';
    if (!bannerForm.imageUrl.trim()) newErrors.imageUrl = 'Imagem é obrigatória';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoadingSubmit(true);
    try {
      const headers = getAuthHeaders();

      if (editingId) {
        await api.put(
          '/content/banners',
          { id: editingId, ...bannerForm },
          { headers }
        );
        toast.success('Banner atualizado com sucesso');
      } else {
        await api.post('/content/banners', bannerForm, { headers });
        toast.success('Banner criado com sucesso');
      }

      setBannerForm({ title: '', description: '', imageUrl: '', buttonText: '', linkUrl: '', isActive: true, numberOfDiscountDate: 0 });
      setEditingId(null);
      setErrors({});
      await loadData();
    } catch (error: any) {
      console.error('Erro:', error);
      toast.error(error.response?.data?.error || 'Erro ao salvar banner');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Confirmar exclusão?')) return;

    try {
      const headers = getAuthHeaders();
      
      await api.delete('/content/banners', { data: { id }, headers });
      toast.success('Banner deletado com sucesso');
      await loadData();
    } catch (error: any) {
      console.error('Erro:', error);
      toast.error(error.response?.data?.error || 'Erro ao deletar banner');
    }
  };

  // ========== CAROUSEL HANDLERS ==========
  const handleCreateCarousel = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};
    if (!carouselForm.title.trim()) newErrors.title = 'Título é obrigatório';
    if (!carouselForm.imageUrl.trim()) newErrors.imageUrl = 'Imagem é obrigatória';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoadingSubmit(true);
    try {
      const headers = getAuthHeaders();

      if (editingId) {
        await api.put(
          '/content/carousel',
          { id: editingId, ...carouselForm },
          { headers }
        );
        toast.success('Imagem do carousel atualizada com sucesso');
      } else {
        await api.post('/content/carousel', carouselForm, { headers });
        toast.success('Imagem do carousel criada com sucesso');
      }

      setCarouselForm({ title: '', description: '', imageUrl: '', linkUrl: '', isActive: true });
      setEditingId(null);
      setErrors({});
      await loadData();
    } catch (error: any) {
      console.error('Erro:', error);
      toast.error(error.response?.data?.error || 'Erro ao salvar imagem do carousel');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleDeleteCarousel = async (id: string) => {
    if (!confirm('Confirmar exclusão?')) return;

    try {
      const headers = getAuthHeaders();
      
      await api.delete('/content/carousel', { data: { id }, headers });
      toast.success('Imagem deletada com sucesso');
      await loadData();
    } catch (error: any) {
      console.error('Erro:', error);
      toast.error(error.response?.data?.error || 'Erro ao deletar imagem');
    }
  };

  // ========== OFFERS HANDLERS ==========
  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};
    if (!offerForm.productId.trim()) newErrors.productId = 'ID do produto é obrigatório';
    if (!offerForm.discount) newErrors.discount = 'Desconto é obrigatório';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoadingSubmit(true);
    try {
      const headers = getAuthHeaders();

      const offerData = {
        ...offerForm,
        discount: parseFloat(offerForm.discount),
      };

      if (editingId) {
        await api.put(
          '/content/offers',
          { id: editingId, ...offerData },
          { headers }
        );
        toast.success('Oferta atualizada com sucesso');
      } else {
        await api.post('/content/offers', offerData, { headers });
        toast.success('Oferta criada com sucesso');
      }

      setOfferForm({ productId: '', discount: '', isActive: true, startDate: '', endDate: '' });
      setEditingId(null);
      setErrors({});
      await loadData();
    } catch (error: any) {
      console.error('Erro:', error);
      toast.error(error.response?.data?.error || 'Erro ao salvar oferta');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleDeleteOffer = async (id: string) => {
    if (!confirm('Confirmar exclusão?')) return;

    try {
      const headers = getAuthHeaders();
      
      await api.delete('/content/offers', { data: { id }, headers });
      toast.success('Oferta deletada com sucesso');
      await loadData();
    } catch (error: any) {
      console.error('Erro:', error);
      toast.error(error.response?.data?.error || 'Erro ao deletar oferta');
    }
  };

  // ========== CATEGORIES HANDLERS ==========
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};
    if (!categoryForm.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!categoryForm.title.trim()) newErrors.title = 'Título é obrigatório';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoadingSubmit(true);
    try {
      const headers = getAuthHeaders();

      if (editingId) {
        await api.put(
          '/content/categories',
          { id: editingId, ...categoryForm },
          { headers }
        );
        toast.success('Categoria atualizada com sucesso');
      } else {
        await api.post('/content/categories', categoryForm, { headers });
        toast.success('Categoria criada com sucesso');
      }

      setCategoryForm({
        name: '',
        title: '',
        description: '',
        href: '',
        imgSrc: '',
        imgWidth: 190,
        imgHeight: 240,
        backgroundColor: '',
        flexDirection: 'row',
        paddingBlock: '1rem',
        paddingInline: '1rem',
        gridColumn: 'span 3 / span 3',
        isCentered: false,
        isSmall: false,
        isActive: true,
      });
      setEditingId(null);
      setErrors({});
      await loadData();
    } catch (error: any) {
      console.error('Erro:', error);
      toast.error(error.response?.data?.error || 'Erro ao salvar categoria');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Confirmar exclusão?')) return;

    try {
      const headers = getAuthHeaders();
      
      await api.delete('/content/categories', { data: { id }, headers });
      toast.success('Categoria deletada com sucesso');
      await loadData();
    } catch (error: any) {
      console.error('Erro:', error);
      toast.error(error.response?.data?.error || 'Erro ao deletar categoria');
    }
  };

  // ========== WHATSAPP HANDLERS ==========
  const handleSaveWhatsapp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoadingSubmit(true);
    try {
      const headers = getAuthHeaders();
      await api.put('/content/whatsapp', { number: whatsappNumber }, { headers });
      toast.success('Número do WhatsApp salvo com sucesso');
      await loadData();
    } catch (error: any) {
      console.error('Erro ao salvar WhatsApp:', error);
      toast.error(error.response?.data?.error || 'Erro ao salvar WhatsApp');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleDeleteWhatsapp = async () => {
    if (!confirm('Remover número do WhatsApp?')) return;
    setLoadingSubmit(true);
    try {
      const headers = getAuthHeaders();
      await api.delete('/content/whatsapp', { headers });
      toast.success('Número removido');
      setWhatsappNumber('');
      await loadData();
    } catch (error: any) {
      console.error('Erro ao remover WhatsApp:', error);
      toast.error(error.response?.data?.error || 'Erro ao remover WhatsApp');
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <PrivateRoute requiredRole="ADMIN">
      <div className="min-h-screen bg-palette-fill p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 mt-6">
            <div>
              <h1 className="text-3xl font-bold text-palette-base mb-2">
                Gerenciamento de Conteúdo
              </h1>
              <p className="text-palette-mute">
                Gerencie banners, carousel, ofertas e marcas
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 border border-palette-primary rounded-lg text-palette-base hover:bg-palette-card transition-colors"
            >
              <MdArrowBack size={20} />
              Voltar
            </button>
          </div>

          {/* Error Alert for Products */}
          {productsError && (
            <div className="mb-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <strong className="block text-sm font-semibold mb-1">Problema ao carregar lista de produtos</strong>
                  <p className="text-sm mb-2">{productsError}</p>
                  <p className="text-xs text-yellow-700">Possível causa: extensão de navegador (adblock, Privacy Badger, etc.)</p>
                </div>
                <button
                  onClick={() => fetchProducts()}
                  className="ml-4 px-3 py-1 bg-yellow-600 text-white rounded text-sm font-semibold hover:bg-yellow-700 transition-colors whitespace-nowrap"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          )}

          {/* WHATSAPP TAB */}
          {activeTab === 'whatsapp' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-palette-card rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-bold text-palette-base mb-4">Número de WhatsApp</h2>
                <form onSubmit={handleSaveWhatsapp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-palette-base mb-2">Número (inclua código do país)</label>
                    <input
                      type="text"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="+5511999999999"
                      className="w-full px-4 py-2 border border-palette-primary rounded-lg bg-palette-fill text-palette-base placeholder-palette-mute focus:outline-none focus:ring-2 focus:ring-palette-primary transition"
                    />
                    <p className="text-xs text-palette-mute mt-1">Número usado no rodapé e páginas de contato.</p>
                  </div>

                  <div className="flex gap-2">
                    <button type="submit" disabled={loadingSubmit} className="px-6 py-2 bg-palette-primary text-white rounded-lg hover:opacity-90 transition disabled:opacity-50">
                      {loadingSubmit ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button type="button" onClick={handleDeleteWhatsapp} disabled={loadingSubmit} className="px-6 py-2 border border-palette-primary rounded-lg text-palette-base hover:bg-palette-card transition">
                      Remover
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-palette-card rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-bold text-palette-base mb-4">Visualização</h2>
                <p className="text-palette-mute">Número atual: <span className="font-semibold text-palette-base">{whatsappNumber || 'Não configurado'}</span></p>
                <div className="mt-4">
                  <p className="text-xs text-palette-mute">Use este número nos templates de contato ou no rodapé.</p>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-8 border-b border-palette-primary overflow-x-auto">
            {(['banners', 'carousel', 'offers', 'brands', 'categories', 'whatsapp'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setEditingId(null);
                }}
                className={`px-6 py-3 font-semibold transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'text-palette-primary border-b-2 border-palette-primary'
                    : 'text-palette-mute hover:text-palette-base'
                }`}
              >
                {tab === 'banners' && 'Banners'}
                {tab === 'carousel' && 'Carousel'}
                {tab === 'offers' && 'Ofertas'}
                {tab === 'brands' && 'Marcas'}
                {tab === 'categories' && 'Categorias'}
                {tab === 'whatsapp' && 'WhatsApp'}
              </button>
            ))}
          </div>

          {/* BANNERS TAB */}
          {activeTab === 'banners' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Create/Edit Banner Form */}
              <div className="bg-palette-card rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-bold text-palette-base mb-4">
                  {editingId ? 'Editar Banner' : 'Criar Novo Banner'}
                </h2>

                <form onSubmit={handleCreateBanner} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-palette-base mb-2">
                      Título *
                    </label>
                    <input
                      type="text"
                      value={bannerForm.title}
                      onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                      placeholder="Título do banner"
                      className={`w-full px-4 py-2 border rounded-lg bg-palette-fill text-palette-base placeholder-palette-mute focus:outline-none focus:ring-2 focus:ring-palette-primary transition ${
                        errors.title ? 'border-red-500' : 'border-palette-primary'
                      }`}
                    />
                    {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-palette-base mb-2">
                      Descrição
                    </label>
                    <textarea
                      value={bannerForm.description}
                      onChange={(e) => setBannerForm({ ...bannerForm, description: e.target.value })}
                      placeholder="Descrição do banner"
                      rows={3}
                      className="w-full px-4 py-2 border border-palette-primary rounded-lg bg-palette-fill text-palette-base placeholder-palette-mute focus:outline-none focus:ring-2 focus:ring-palette-primary transition resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-palette-base mb-2">
                      Imagem *
                    </label>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, (url) => setBannerForm({ ...bannerForm, imageUrl: url }))}
                      disabled={uploading}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-palette-primary rounded-lg bg-palette-fill text-palette-base hover:bg-palette-card transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      <MdUploadFile size={20} />
                      {uploading ? 'Enviando...' : 'Selecionar Imagem'}
                    </button>
                    {bannerForm.imageUrl && (
                      <div className="mt-3">
                        <img
                          src={bannerForm.imageUrl}
                          alt="Preview"
                          className="w-full h-32 object-cover border border-palette-primary rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setBannerForm({ ...bannerForm, imageUrl: '' })}
                          className="text-red-500 hover:text-red-700 text-sm font-medium mt-1"
                        >
                          Remover Imagem
                        </button>
                      </div>
                    )}
                    {errors.imageUrl && <p className="text-red-500 text-sm mt-1">{errors.imageUrl}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-palette-base mb-2">
                      Texto do Botão
                    </label>
                    <input
                      type="text"
                      value={bannerForm.buttonText}
                      onChange={(e) => setBannerForm({ ...bannerForm, buttonText: e.target.value })}
                      placeholder="Ex: Comprar Agora"
                      className="w-full px-4 py-2 border border-palette-primary rounded-lg bg-palette-fill text-palette-base placeholder-palette-mute focus:outline-none focus:ring-2 focus:ring-palette-primary transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-palette-base mb-2">
                      URL do Link
                    </label>
                    <input
                      type="text"
                      value={bannerForm.linkUrl}
                      onChange={(e) => setBannerForm({ ...bannerForm, linkUrl: e.target.value })}
                      placeholder="Ex: /products"
                      className="w-full px-4 py-2 border border-palette-primary rounded-lg bg-palette-fill text-palette-base placeholder-palette-mute focus:outline-none focus:ring-2 focus:ring-palette-primary transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-palette-base mb-2">
                      Dias para desconto
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={bannerForm.numberOfDiscountDate}
                      onChange={(e) => setBannerForm({ ...bannerForm, numberOfDiscountDate: parseInt(e.target.value || '0') })}
                      placeholder="Número de dias (ex: 7)"
                      className="w-full px-4 py-2 border border-palette-primary rounded-lg bg-palette-fill text-palette-base placeholder-palette-mute focus:outline-none focus:ring-2 focus:ring-palette-primary transition"
                    />
                    <p className="text-xs text-palette-mute mt-1">Quantidade de dias usada pelo contador de desconto.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={bannerForm.isActive}
                      onChange={(e) => setBannerForm({ ...bannerForm, isActive: e.target.checked })}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <label className="text-sm font-semibold text-palette-base cursor-pointer">
                      Ativo
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loadingSubmit}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-palette-primary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      <MdAdd size={20} />
                      {loadingSubmit ? 'Salvando...' : editingId ? 'Atualizar' : 'Criar'}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setBannerForm({ title: '', description: '', imageUrl: '', buttonText: '', linkUrl: '', isActive: true, numberOfDiscountDate: 0 });
                        }}
                        className="flex-1 px-6 py-2 border border-palette-primary rounded-lg text-palette-base hover:bg-palette-card transition-colors font-semibold"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Existing Banners */}
              <div className="bg-palette-card rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-bold text-palette-base mb-4">
                  Banners Existentes
                </h2>

                {loadingData ? (
                  <p className="text-palette-mute">Carregando...</p>
                ) : banners.length === 0 ? (
                  <p className="text-palette-mute">Nenhum banner encontrado</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {banners.map((banner) => (
                      <div key={banner.id} className="flex flex-col p-3 bg-palette-fill rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-palette-base">{banner.title}</p>
                            <p className={`text-xs ${banner.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                              {banner.isActive ? 'Ativo' : 'Inativo'}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setEditingId(banner.id);
                                setBannerForm({
                                  title: banner.title,
                                  description: banner.description || '',
                                  imageUrl: banner.imageUrl,
                                  buttonText: banner.buttonText || '',
                                  linkUrl: banner.linkUrl || '',
                                  isActive: banner.isActive,
                                  numberOfDiscountDate: banner.numberOfDiscountDate || 0,
                                });
                              }}
                              className="text-blue-500 hover:text-blue-700 p-1"
                            >
                              <MdEdit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteBanner(banner.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <MdDelete size={18} />
                            </button>
                          </div>
                        </div>
                        {banner.imageUrl && (
                          <img
                            src={banner.imageUrl}
                            alt={banner.title}
                            className="w-full h-20 object-cover rounded mb-2"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CAROUSEL TAB */}
          {activeTab === 'carousel' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Create/Edit Carousel Form */}
              <div className="bg-palette-card rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-bold text-palette-base mb-4">
                  {editingId ? 'Editar Imagem' : 'Adicionar Imagem ao Carousel'}
                </h2>

                <form onSubmit={handleCreateCarousel} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-palette-base mb-2">
                      Título *
                    </label>
                    <input
                      type="text"
                      value={carouselForm.title}
                      onChange={(e) => setCarouselForm({ ...carouselForm, title: e.target.value })}
                      placeholder="Título da imagem"
                      className={`w-full px-4 py-2 border rounded-lg bg-palette-fill text-palette-base placeholder-palette-mute focus:outline-none focus:ring-2 focus:ring-palette-primary transition ${
                        errors.title ? 'border-red-500' : 'border-palette-primary'
                      }`}
                    />
                    {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-palette-base mb-2">
                      Descrição
                    </label>
                    <textarea
                      value={carouselForm.description}
                      onChange={(e) => setCarouselForm({ ...carouselForm, description: e.target.value })}
                      placeholder="Descrição da imagem"
                      rows={3}
                      className="w-full px-4 py-2 border border-palette-primary rounded-lg bg-palette-fill text-palette-base placeholder-palette-mute focus:outline-none focus:ring-2 focus:ring-palette-primary transition resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-palette-base mb-2">
                      Imagem *
                    </label>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, (url) => setCarouselForm({ ...carouselForm, imageUrl: url }))}
                      disabled={uploading}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-palette-primary rounded-lg bg-palette-fill text-palette-base hover:bg-palette-card transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      <MdUploadFile size={20} />
                      {uploading ? 'Enviando...' : 'Selecionar Imagem'}
                    </button>
                    {carouselForm.imageUrl && (
                      <div className="mt-3">
                        <img
                          src={carouselForm.imageUrl}
                          alt="Preview"
                          className="w-full h-32 object-cover border border-palette-primary rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setCarouselForm({ ...carouselForm, imageUrl: '' })}
                          className="text-red-500 hover:text-red-700 text-sm font-medium mt-1"
                        >
                          Remover Imagem
                        </button>
                      </div>
                    )}
                    {errors.imageUrl && <p className="text-red-500 text-sm mt-1">{errors.imageUrl}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-palette-base mb-2">
                      URL do Link
                    </label>
                    <input
                      type="text"
                      value={carouselForm.linkUrl}
                      onChange={(e) => setCarouselForm({ ...carouselForm, linkUrl: e.target.value })}
                      placeholder="Ex: /products"
                      className="w-full px-4 py-2 border border-palette-primary rounded-lg bg-palette-fill text-palette-base placeholder-palette-mute focus:outline-none focus:ring-2 focus:ring-palette-primary transition"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={carouselForm.isActive}
                      onChange={(e) => setCarouselForm({ ...carouselForm, isActive: e.target.checked })}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <label className="text-sm font-semibold text-palette-base cursor-pointer">
                      Ativo
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loadingSubmit}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-palette-primary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      <MdAdd size={20} />
                      {loadingSubmit ? 'Salvando...' : editingId ? 'Atualizar' : 'Adicionar'}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setCarouselForm({ title: '', description: '', imageUrl: '', linkUrl: '', isActive: true });
                        }}
                        className="flex-1 px-6 py-2 border border-palette-primary rounded-lg text-palette-base hover:bg-palette-card transition-colors font-semibold"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Existing Carousel Images */}
              <div className="bg-palette-card rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-bold text-palette-base mb-4">
                  Imagens do Carousel
                </h2>

                {loadingData ? (
                  <p className="text-palette-mute">Carregando...</p>
                ) : carouselImages.length === 0 ? (
                  <p className="text-palette-mute">Nenhuma imagem encontrada</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {carouselImages.map((image) => (
                      <div key={image.id} className="flex flex-col p-3 bg-palette-fill rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-palette-base">{image.title}</p>
                            <p className={`text-xs ${image.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                              {image.isActive ? 'Ativo' : 'Inativo'}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setEditingId(image.id);
                                setCarouselForm({
                                  title: image.title,
                                  description: image.description || '',
                                  imageUrl: image.imageUrl,
                                  linkUrl: image.linkUrl || '',
                                  isActive: image.isActive,
                                });
                              }}
                              className="text-blue-500 hover:text-blue-700 p-1"
                            >
                              <MdEdit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteCarousel(image.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <MdDelete size={18} />
                            </button>
                          </div>
                        </div>
                        {image.imageUrl && (
                          <img
                            src={image.imageUrl}
                            alt={image.title}
                            className="w-full h-20 object-cover rounded"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* OFFERS TAB */}
          {activeTab === 'offers' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Create/Edit Offer Form */}
              <div className="bg-palette-card rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-bold text-palette-base mb-4">
                  {editingId ? 'Editar Oferta' : 'Criar Nova Oferta'}
                </h2>

                <form onSubmit={handleCreateOffer} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-palette-base mb-2">
                      Produto *
                    </label>
                    {products.length > 0 ? (
                      <select
                        value={offerForm.productId}
                        onChange={(e) => setOfferForm({ ...offerForm, productId: e.target.value })}
                        className={`w-full px-4 py-2 border rounded-lg bg-palette-fill text-palette-base focus:outline-none focus:ring-2 focus:ring-palette-primary transition ${
                          errors.productId ? 'border-red-500' : 'border-palette-primary'
                        }`}
                      >
                        <option value="">Selecione um produto</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                            {product.sku && ` — SKU: ${product.sku}`}
                            {products.filter(p => p.name === product.name).length > 1 && ` — ${product.id.slice(0, 8)}`}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={offerForm.productId}
                        onChange={(e) => setOfferForm({ ...offerForm, productId: e.target.value })}
                        placeholder="Cole o ID do produto aqui (ou tente carregar a lista novamente)"
                        className={`w-full px-4 py-2 border rounded-lg bg-palette-fill text-palette-base placeholder-palette-mute focus:outline-none focus:ring-2 focus:ring-palette-primary transition ${
                          errors.productId ? 'border-red-500' : 'border-palette-primary'
                        }`}
                      />
                    )}
                    {errors.productId && <p className="text-red-500 text-sm mt-1">{errors.productId}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-palette-base mb-2">
                      Desconto (%) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="1000"
                      step="0.01"
                      value={offerForm.discount}
                      onChange={(e) => setOfferForm({ ...offerForm, discount: e.target.value })}
                      placeholder="Ex: 15.50"
                      className={`w-full px-4 py-2 border rounded-lg bg-palette-fill text-palette-base placeholder-palette-mute focus:outline-none focus:ring-2 focus:ring-palette-primary transition ${
                        errors.discount ? 'border-red-500' : 'border-palette-primary'
                      }`}
                    />
                    {errors.discount && <p className="text-red-500 text-sm mt-1">{errors.discount}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-palette-base mb-2">
                      Data de Início
                    </label>
                    <input
                      type="datetime-local"
                      value={offerForm.startDate}
                      onChange={(e) => setOfferForm({ ...offerForm, startDate: e.target.value })}
                      className="w-full px-4 py-2 border border-palette-primary rounded-lg bg-palette-fill text-palette-base focus:outline-none focus:ring-2 focus:ring-palette-primary transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-palette-base mb-2">
                      Data de Término
                    </label>
                    <input
                      type="datetime-local"
                      value={offerForm.endDate}
                      onChange={(e) => setOfferForm({ ...offerForm, endDate: e.target.value })}
                      className="w-full px-4 py-2 border border-palette-primary rounded-lg bg-palette-fill text-palette-base focus:outline-none focus:ring-2 focus:ring-palette-primary transition"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={offerForm.isActive}
                      onChange={(e) => setOfferForm({ ...offerForm, isActive: e.target.checked })}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <label className="text-sm font-semibold text-palette-base cursor-pointer">
                      Ativo
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loadingSubmit}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-palette-primary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      <MdAdd size={20} />
                      {loadingSubmit ? 'Salvando...' : editingId ? 'Atualizar' : 'Criar'}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setOfferForm({ productId: '', discount: '', isActive: true, startDate: '', endDate: '' });
                        }}
                        className="flex-1 px-6 py-2 border border-palette-primary rounded-lg text-palette-base hover:bg-palette-card transition-colors font-semibold"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Existing Offers */}
              <div className="bg-palette-card rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-bold text-palette-base mb-4">
                  Ofertas Existentes
                </h2>

                {loadingData ? (
                  <p className="text-palette-mute">Carregando...</p>
                ) : offers.length === 0 ? (
                  <p className="text-palette-mute">Nenhuma oferta encontrada</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {offers.map((offer) => {
                      const product = products.find(p => p.id === offer.productId);
                      return (
                        <div key={offer.id} className="flex flex-col p-3 bg-palette-fill rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-semibold text-palette-base">{offer.discount}% de desconto</p>
                              <p className="text-xs text-palette-mute">
                                {product ? product.name : offer.productId}
                                {product?.sku && ` — SKU: ${product.sku}`}
                              </p>
                              <p className={`text-xs ${offer.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                                {offer.isActive ? 'Ativa' : 'Inativa'}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setEditingId(offer.id);
                                  setOfferForm({
                                    productId: offer.productId,
                                    discount: offer.discount.toString(),
                                    isActive: offer.isActive,
                                    startDate: offer.startDate ? new Date(offer.startDate).toISOString().slice(0, 16) : '',
                                    endDate: offer.endDate ? new Date(offer.endDate).toISOString().slice(0, 16) : '',
                                  });
                                }}
                                className="text-blue-500 hover:text-blue-700 p-1"
                              >
                                <MdEdit size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteOffer(offer.id)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <MdDelete size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BRANDS TAB */}
          {activeTab === 'brands' && (
            <div className="bg-palette-card rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-bold text-palette-base mb-4">
                Marcas Existentes
              </h2>

              {loadingData ? (
                <p className="text-palette-mute">Carregando...</p>
              ) : brands.length === 0 ? (
                <p className="text-palette-mute">Nenhuma marca encontrada</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {brands.map((brand) => (
                    <div key={brand.id} className="flex flex-col items-center p-4 bg-palette-fill rounded-lg border border-palette-primary hover:border-palette-primary transition">
                      {brand.logo && (
                        <img
                          src={brand.logo}
                          alt={brand.name}
                          className="w-16 h-16 object-contain mb-2"
                        />
                      )}
                      <p className="font-semibold text-palette-base text-center text-sm">{brand.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CATEGORIES TAB */}
          {activeTab === 'categories' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Create/Edit Category Form */}
              <div className="bg-palette-card rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-bold text-palette-base mb-4">
                  {editingId ? 'Editar Categoria' : 'Criar Nova Categoria'}
                </h2>

                <form onSubmit={handleCreateCategory} className="space-y-3 max-h-96 overflow-y-auto">
                  <div>
                    <label className="block text-sm font-semibold text-palette-base mb-1">Nome *</label>
                    <input type="text" value={categoryForm.name} onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})} placeholder="digital, fashion, etc" className="w-full px-3 py-2 border border-palette-primary rounded-lg bg-palette-fill text-palette-base placeholder-palette-mute focus:outline-none focus:ring-2 focus:ring-palette-primary transition" />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-palette-base mb-1">Título (chave i18n) *</label>
                    <input type="text" value={categoryForm.title} onChange={(e) => setCategoryForm({...categoryForm, title: e.target.value})} placeholder="digitalCategoryTitle" className="w-full px-3 py-2 border border-palette-primary rounded-lg bg-palette-fill text-palette-base placeholder-palette-mute focus:outline-none focus:ring-2 focus:ring-palette-primary transition" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-palette-base mb-1">Descrição (chave i18n)</label>
                    <input type="text" value={categoryForm.description} onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})} placeholder="digitalCategoryDescription" className="w-full px-3 py-2 border border-palette-primary rounded-lg bg-palette-fill text-palette-base placeholder-palette-mute focus:outline-none focus:ring-2 focus:ring-palette-primary transition" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-palette-base mb-1">URL</label>
                    <input type="text" value={categoryForm.href} onChange={(e) => setCategoryForm({...categoryForm, href: e.target.value})} placeholder="/digital" className="w-full px-3 py-2 border border-palette-primary rounded-lg bg-palette-fill text-palette-base placeholder-palette-mute focus:outline-none focus:ring-2 focus:ring-palette-primary transition" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-palette-base mb-1">URL Imagem</label>
                    <input type="text" value={categoryForm.imgSrc} onChange={(e) => setCategoryForm({...categoryForm, imgSrc: e.target.value})} placeholder="/images/category-img/digital-category.webp" className="w-full px-3 py-2 border border-palette-primary rounded-lg bg-palette-fill text-palette-base placeholder-palette-mute focus:outline-none focus:ring-2 focus:ring-palette-primary transition" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-palette-base mb-1">Largura Img</label>
                      <input type="number" value={categoryForm.imgWidth} onChange={(e) => setCategoryForm({...categoryForm, imgWidth: parseInt(e.target.value) || 190})} className="w-full px-3 py-2 border border-palette-primary rounded-lg bg-palette-fill text-palette-base focus:outline-none focus:ring-2 focus:ring-palette-primary transition" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-palette-base mb-1">Altura Img</label>
                      <input type="number" value={categoryForm.imgHeight} onChange={(e) => setCategoryForm({...categoryForm, imgHeight: parseInt(e.target.value) || 240})} className="w-full px-3 py-2 border border-palette-primary rounded-lg bg-palette-fill text-palette-base focus:outline-none focus:ring-2 focus:ring-palette-primary transition" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-palette-base mb-1">Cor de Fundo</label>
                    <input type="text" value={categoryForm.backgroundColor} onChange={(e) => setCategoryForm({...categoryForm, backgroundColor: e.target.value})} placeholder="var(--digital-category-bgc)" className="w-full px-3 py-2 border border-palette-primary rounded-lg bg-palette-fill text-palette-base placeholder-palette-mute focus:outline-none focus:ring-2 focus:ring-palette-primary transition" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-palette-base mb-1">Direção Flex</label>
                    <select value={categoryForm.flexDirection} onChange={(e) => setCategoryForm({...categoryForm, flexDirection: e.target.value})} className="w-full px-3 py-2 border border-palette-primary rounded-lg bg-palette-fill text-palette-base focus:outline-none focus:ring-2 focus:ring-palette-primary transition">
                      <option>row</option>
                      <option>row-reverse</option>
                      <option>column</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-palette-base mb-1">Padding Block</label>
                      <input type="text" value={categoryForm.paddingBlock} onChange={(e) => setCategoryForm({...categoryForm, paddingBlock: e.target.value})} className="w-full px-3 py-2 border border-palette-primary rounded-lg bg-palette-fill text-palette-base focus:outline-none focus:ring-2 focus:ring-palette-primary transition" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-palette-base mb-1">Padding Inline</label>
                      <input type="text" value={categoryForm.paddingInline} onChange={(e) => setCategoryForm({...categoryForm, paddingInline: e.target.value})} className="w-full px-3 py-2 border border-palette-primary rounded-lg bg-palette-fill text-palette-base focus:outline-none focus:ring-2 focus:ring-palette-primary transition" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-palette-base mb-1">Grid Column</label>
                    <input type="text" value={categoryForm.gridColumn} onChange={(e) => setCategoryForm({...categoryForm, gridColumn: e.target.value})} placeholder="span 3 / span 3" className="w-full px-3 py-2 border border-palette-primary rounded-lg bg-palette-fill text-palette-base placeholder-palette-mute focus:outline-none focus:ring-2 focus:ring-palette-primary transition" />
                  </div>

                  <div className="flex gap-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={categoryForm.isCentered} onChange={(e) => setCategoryForm({...categoryForm, isCentered: e.target.checked})} className="w-4 h-4" />
                      <span className="text-sm font-semibold text-palette-base">Centralizado</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={categoryForm.isSmall} onChange={(e) => setCategoryForm({...categoryForm, isSmall: e.target.checked})} className="w-4 h-4" />
                      <span className="text-sm font-semibold text-palette-base">Pequeno</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={categoryForm.isActive} onChange={(e) => setCategoryForm({...categoryForm, isActive: e.target.checked})} className="w-4 h-4" />
                      <span className="text-sm font-semibold text-palette-base">Ativo</span>
                    </label>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button type="submit" disabled={loadingSubmit} className="flex-1 px-4 py-2 bg-palette-primary text-palette-side rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50">
                      {loadingSubmit ? 'Salvando...' : editingId ? 'Atualizar' : 'Criar'}
                    </button>
                    {editingId && (
                      <button type="button" onClick={() => {setEditingId(null); setCategoryForm({name: '', title: '', description: '', href: '', imgSrc: '', imgWidth: 190, imgHeight: 240, backgroundColor: '', flexDirection: 'row', paddingBlock: '1rem', paddingInline: '1rem', gridColumn: 'span 3 / span 3', isCentered: false, isSmall: false, isActive: true}); setErrors({});}} className="flex-1 px-4 py-2 border border-palette-primary rounded-lg text-palette-base hover:bg-palette-card transition font-semibold">
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Categories List */}
              <div className="bg-palette-card rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-bold text-palette-base mb-4">
                  Categorias Existentes ({categories.length})
                </h2>
                {categories.length === 0 ? (
                  <p className="text-palette-mute text-sm">Nenhuma categoria encontrada</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {categories.map((category) => (
                      <div key={category.id} className="flex flex-col p-3 bg-palette-fill rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-palette-base">{category.name}</p>
                            <p className="text-xs text-palette-mute">{category.title} • Grid: {category.gridColumn}</p>
                            <p className={`text-xs ${category.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                              {category.isActive ? 'Ativa' : 'Inativa'}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setEditingId(category.id);
                                setCategoryForm({
                                  name: category.name,
                                  title: category.title,
                                  description: category.description || '',
                                  href: category.href || '',
                                  imgSrc: category.imgSrc || '',
                                  imgWidth: category.imgWidth,
                                  imgHeight: category.imgHeight,
                                  backgroundColor: category.backgroundColor || '',
                                  flexDirection: category.flexDirection || 'row',
                                  paddingBlock: category.paddingBlock || '1rem',
                                  paddingInline: category.paddingInline || '1rem',
                                  gridColumn: category.gridColumn || 'span 3 / span 3',
                                  isCentered: category.isCentered,
                                  isSmall: category.isSmall,
                                  isActive: category.isActive,
                                });
                              }}
                              className="text-blue-500 hover:text-blue-700 p-1"
                            >
                              <MdEdit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <MdDelete size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </PrivateRoute>
  );
};

export default ManageContent;
