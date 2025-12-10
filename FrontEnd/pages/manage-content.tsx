import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { toast } from 'react-toastify';
import api from '../lib/axiosClient';
import { MdAdd, MdDelete, MdArrowBack, MdUploadFile, MdEdit } from 'react-icons/md';
import { useRouter } from 'next/router';
import PrivateRoute from '../components/auth/PrivateRoute';
import { uploadImageToImgBB } from '../lib/services/imgbbService';

interface Banner {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  buttonText?: string;
  linkUrl?: string;
  isActive: boolean;
  order: number;
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

type TabType = 'banners' | 'carousel' | 'offers' | 'brands';

const ManageContent = () => {
  const { t } = useLanguage();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('banners');
  
  // Data states
  const [banners, setBanners] = useState<Banner[]>([]);
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // Form states
  const [bannerForm, setBannerForm] = useState({
    title: '',
    description: '',
    imageUrl: '',
    buttonText: '',
    linkUrl: '',
    isActive: true,
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

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [bannersRes, carouselRes, offersRes, brandsRes] = await Promise.all([
        api.get('/content/banners', { headers }),
        api.get('/content/carousel', { headers }),
        api.get('/content/offers', { headers }),
        api.get('/brands', { headers }),
      ]);

      setBanners(bannersRes.data.items || []);
      setCarouselImages(carouselRes.data.items || []);
      setOffers(offersRes.data.items || []);
      setBrands(brandsRes.data.items || []);
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
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

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

      setBannerForm({ title: '', description: '', imageUrl: '', buttonText: '', linkUrl: '', isActive: true });
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
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
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
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

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
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
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
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

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
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      await api.delete('/content/offers', { data: { id }, headers });
      toast.success('Oferta deletada com sucesso');
      await loadData();
    } catch (error: any) {
      console.error('Erro:', error);
      toast.error(error.response?.data?.error || 'Erro ao deletar oferta');
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

          {/* Tabs */}
          <div className="flex gap-2 mb-8 border-b border-palette-primary overflow-x-auto">
            {(['banners', 'carousel', 'offers', 'brands'] as TabType[]).map((tab) => (
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
                          setBannerForm({ title: '', description: '', imageUrl: '', buttonText: '', linkUrl: '', isActive: true });
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
                      ID do Produto *
                    </label>
                    <input
                      type="text"
                      value={offerForm.productId}
                      onChange={(e) => setOfferForm({ ...offerForm, productId: e.target.value })}
                      placeholder="ID do produto (MongoDB ObjectId)"
                      className={`w-full px-4 py-2 border rounded-lg bg-palette-fill text-palette-base placeholder-palette-mute focus:outline-none focus:ring-2 focus:ring-palette-primary transition ${
                        errors.productId ? 'border-red-500' : 'border-palette-primary'
                      }`}
                    />
                    {errors.productId && <p className="text-red-500 text-sm mt-1">{errors.productId}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-palette-base mb-2">
                      Desconto (%) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
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
                    {offers.map((offer) => (
                      <div key={offer.id} className="flex flex-col p-3 bg-palette-fill rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-palette-base">{offer.discount}% de desconto</p>
                            <p className="text-xs text-palette-mute">{offer.productId}</p>
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
                    ))}
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
        </div>
      </div>
    </PrivateRoute>
  );
};

export default ManageContent;
