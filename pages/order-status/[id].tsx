import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { useLanguage } from '../../hooks/useLanguage';
import { IUserInfoRootState } from '../../lib/types/user';
import { toast } from 'react-toastify';
import api from '../../lib/axiosClient';
import Breadcrumb from '../../components/UI/Breadcrumb';
import Benefits from '../../components/Benefits';
import PrivateRoute from '../../components/auth/PrivateRoute';
import OrderStatusBar from '../../components/UI/OrderStatusBar';

interface OrderData {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  paymentStatus: string;
  isDelivered?: boolean;
  deliveryMethod?: string;
  trackingCode?: string;
  isLocalPickup?: boolean;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    price: number;
    unitPrice?: number | null;
    total?: number;
    productId?: string;
    product?: {
      id: string;
      name: string;
      image?: string;
      images?: Array<{ url: string }>;
    } | null;
  }>;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    number?: string;
    complement?: string;
  };
  payment: {
    id: string;
    status: string;
    method: string;
    amount: number;
  };
  tracking?: {
    code: string;
    status: string;
    events: Array<{
      date: string;
      time: string;
      location: string;
      description: string;
      status: string;
    }>;
  };
}

const OrderStatusPage: React.FC = () => {
  const { t } = useLanguage();
  const router = useRouter();
  const { id } = router.query;
  
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [trackingLoading, setTrackingLoading] = useState<boolean>(false);
  const [isEditingAddress, setIsEditingAddress] = useState<boolean>(false);
  const [addressForm, setAddressForm] = useState<any>({});

  const userInfo = useSelector(
    (state: IUserInfoRootState) => state.userInfo.userInformation
  );

  useEffect(() => {
    if (!userInfo) {
      router.push('/login');
      return;
    }

    if (id) {
      fetchOrderData();

      // Polling automático a cada 30 segundos para refletir mudanças feitas no admin
      const pollInterval = setInterval(() => {
        fetchOrderData();
      }, 30000);

      return () => clearInterval(pollInterval);
    }
  }, [userInfo, id]);

  const fetchOrderData = async () => {
    try {
      // Use centralized axios client which handles tokenStore and refresh logic
      const response = await api.get(`/orders/${id}`);
      // Alguns endpoints retornam { order, localOrder, external } — preferir o campo `order` quando disponível
      const payload = response.data || {};
      const resolvedOrder = payload.order || payload.localOrder || payload;

      // Normalizar o formato retornado pelo backend/DB para o formato que a UI espera
      const mapPaymentStatus = (s: any) => {
        if (!s) return 'PENDING';
        const up = String(s).toUpperCase();
        if (up === 'PAID' || up === 'COMPLETED' || up === 'APPROVED') return 'COMPLETED';
        if (up === 'PENDING' || up === 'IN_PROCESS') return 'PENDING';
        if (up === 'FAILED' || up === 'REJECTED' || up === 'CANCELLED') return 'FAILED';
        if (up === 'EXPIRED') return 'EXPIRED';
        return up;
      };

      const itemsRaw = resolvedOrder?.items || resolvedOrder?.itemsJson || [];

      const normalized: any = {
        id: resolvedOrder?.id || resolvedOrder?._id || resolvedOrder?.orderId || '',
        status: resolvedOrder?.status || 'PENDING',
        totalAmount: resolvedOrder?.total ?? resolvedOrder?.totalAmount ?? resolvedOrder?.subtotal ?? 0,
        createdAt: resolvedOrder?.createdAt || resolvedOrder?.created_at || new Date().toISOString(),
        // Dados de entrega
        isDelivered: resolvedOrder?.isDelivered || false,
        deliveryMethod: resolvedOrder?.deliveryMethod || 'PENDING',
        trackingCode: resolvedOrder?.trackingCode || null,
        // normalizar itens para garantir que UI encontre `price` e `quantity`
        items: (itemsRaw || []).map((it: any) => ({
          id: it.id,
          productId: it.productId,
          productName: it.productName || it.product?.name || '',
          quantity: it.quantity ?? 0,
          // aceitar unitPrice (do backend) ou price, e calcular fallback quando necessário
          price: (it.unitPrice ?? it.price ?? (it.total && it.quantity ? (it.total / it.quantity) : 0)),
          unitPrice: it.unitPrice ?? it.price ?? null,
          total: it.total ?? ((it.unitPrice ?? it.price ?? 0) * (it.quantity ?? 0)),
          product: it.product ? {
            id: it.product.id,
            name: it.product.name,
            image: it.product.image,
            images: it.product.images
          } : null
        })),
        shippingAddress: resolvedOrder?.shippingAddress || {},
        payment: {
          id: resolvedOrder?.mpPreferenceId || resolvedOrder?.paymentId || '',
          status: mapPaymentStatus(resolvedOrder?.paymentStatus || resolvedOrder?.payment_status),
          method: resolvedOrder?.paymentMethod || resolvedOrder?.payment_method || 'PIX',
          amount: Number(resolvedOrder?.total ?? resolvedOrder?.totalAmount ?? 0)
        },
        // também expor paymentStatus no topo para compatibilidade
        paymentStatus: mapPaymentStatus(resolvedOrder?.paymentStatus || resolvedOrder?.payment_status),
        tracking: resolvedOrder?.tracking || null,
      };

      setOrderData(normalized);

      // Se o pedido foi pago e tem código de rastreamento, buscar dados dos Correios
      if (normalized.payment?.status === 'COMPLETED' && normalized.tracking?.code) {
        fetchTrackingData(normalized.tracking.code);
      }
    } catch (error: any) {
      console.error('Erro ao buscar dados do pedido:', error);
      toast.error('Erro ao carregar informações do pedido');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrackingData = async (trackingCode: string) => {
    setTrackingLoading(true);
    try {
      // Simulação de integração com API dos Correios
      // Em produção, isso seria uma chamada para o backend que faria a integração real
      const mockTrackingData = {
        code: trackingCode,
        status: 'EM_TRANSITO',
        events: [
          {
            date: '2024-01-15',
            time: '14:30',
            location: 'São Paulo - SP',
            description: 'Objeto postado',
            status: 'POSTADO'
          },
          {
            date: '2024-01-16',
            time: '08:15',
            location: 'Centro de Distribuição - São Paulo',
            description: 'Objeto em trânsito - por favor aguarde',
            status: 'EM_TRANSITO'
          },
          {
            date: '2024-01-16',
            time: '16:45',
            location: 'Centro de Distribuição - Rio de Janeiro',
            description: 'Objeto chegou ao centro de distribuição',
            status: 'EM_TRANSITO'
          }
        ]
      };

      setOrderData(prev => prev ? {
        ...prev,
        tracking: mockTrackingData
      } : null);
    } catch (error) {
      console.error('Erro ao buscar dados de rastreamento:', error);
    } finally {
      setTrackingLoading(false);
    }
  };

  const startEditAddress = () => {
    setAddressForm(orderData?.shippingAddress || {});
    setIsEditingAddress(true);
  };

  const cancelEditAddress = () => {
    setIsEditingAddress(false);
    setAddressForm({});
  };

  const handleAddressChange = (field: string, value: any) => {
    setAddressForm((prev: any) => ({ ...(prev || {}), [field]: value }));
  };

  const saveAddress = async () => {
    if (!orderData) return;
    try {
      const payload = { shippingAddress: addressForm };
      const res = await api.patch(`/orders/${orderData.id}`, payload);
      const updated = res.data?.order || res.data;
      if (updated) {
        setOrderData((prev) => prev ? { ...prev, shippingAddress: updated.shippingAddress } : prev);
        toast.success('Endereço atualizado com sucesso');
        setIsEditingAddress(false);
      } else {
        toast.error('Resposta inválida ao atualizar endereço');
      }
    } catch (e: any) {
      console.error('Erro ao salvar endereço:', e);
      const message = e?.response?.data?.error || e.message || 'Erro ao salvar endereço';
      toast.error(message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'PROCESSING':
      case 'IN_PROCESS':
      case 'EM_TRANSITO':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Aguardando Pagamento';
      case 'COMPLETED':
        return 'Pago';
      case 'PROCESSING':
      case 'IN_PROCESS':
        return 'Processando';
      case 'SHIPPED':
        return 'Enviado';
      case 'DELIVERED':
        return 'Entregue';
      case 'CANCELLED':
        return 'Cancelado';
      case 'FAILED':
        return 'Falhou';
      case 'EM_TRANSITO':
        return 'Em Trânsito';
      case 'POSTADO':
        return 'Postado';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (date: string, time: string) => {
    return `${new Date(date).toLocaleDateString('pt-BR')} às ${time}`;
  };

  if (loading) {
    return (
      <PrivateRoute>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-palette-primary"></div>
        </div>
      </PrivateRoute>
    );
  }

  if (!orderData) {
    return (
      <PrivateRoute>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Pedido não encontrado</h1>
            <button
              onClick={() => router.push('/orders')}
              className="bg-palette-primary text-palette-side px-6 py-3 rounded-lg"
            >
              Ver Meus Pedidos
            </button>
          </div>
        </div>
      </PrivateRoute>
    );
  }

  return (
    <PrivateRoute>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Breadcrumb />
        
        {/* Order Status Progress Bar */}
        {orderData && (
          <OrderStatusBar 
            orderStatus={orderData.status} 
            paymentStatus={orderData.payment?.status ?? orderData.paymentStatus ?? 'PENDING'}
            isDelivered={orderData.isDelivered}
          />
        )}
        
        <div className="mt-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Pedido #{String(orderData.id ?? '').slice(-8)}</h1>
            {
              (() => {
                // Priorizar isDelivered: se admin marcou como entregue, exibir Entregue
                if (orderData.isDelivered === true) {
                  const cls = `px-4 py-2 rounded-lg ${getStatusColor('DELIVERED')}`;
                  return <div className={cls}>{getStatusText('DELIVERED')}</div>;
                }

                const paymentStatus = orderData.payment?.status ?? orderData.paymentStatus ?? 'PENDING';
                const actualOrderStatus = orderData.status ?? 'PENDING';
                const paymentUpper = String(paymentStatus).toUpperCase();
                const isPaid = paymentUpper === 'COMPLETED' || paymentUpper === 'PAID';
                const statusUpper = String(actualOrderStatus).toUpperCase();
                const displayStatus = (isPaid && (statusUpper === 'PENDING' || statusUpper === 'PROCESSING')) ? 'IN_PROCESS' : actualOrderStatus;

                const badgeClass = `px-4 py-2 rounded-lg ${getStatusColor(displayStatus)}`;
                const badgeText = getStatusText(displayStatus);

                if (String(displayStatus).toUpperCase() === 'PENDING') {
                  return (
                    <button
                      onClick={() => router.push(`/payment/${orderData.id}`)}
                      className={`${badgeClass} hover:opacity-90 cursor-pointer`}
                      title="Ir para pagamento"
                    >
                      {badgeText}
                    </button>
                  );
                }

                return <div className={badgeClass}>{badgeText}</div>;
              })()
            }
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Coluna principal - Timeline e rastreamento */}
            <div className="lg:col-span-2 space-y-6">
              {/* Status do pagamento */}
              <div className="bg-palette-card p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Status do Pagamento</h2>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Método: {orderData.payment?.method ?? '-'}</p>
                    <p className="text-sm text-palette-mute">
                      Valor: R$ {Number(orderData.payment?.amount ?? 0).toFixed(2)}
                    </p>
                  </div>
                  {
                    (() => {
                      const payStatus = orderData.payment?.status ?? orderData.paymentStatus ?? 'PENDING';
                      const badgeCls = `px-3 py-1 rounded-lg ${getStatusColor(payStatus)}`;
                      const text = getStatusText(payStatus);
                      if (String(payStatus).toUpperCase() === 'PENDING') {
                        return (
                          <button
                            onClick={() => router.push(`/payment/${orderData.id}`)}
                            className={`${badgeCls} hover:opacity-90 cursor-pointer`}
                            title="Ir para pagamento"
                          >
                            {text}
                          </button>
                        );
                      }
                      return <div className={badgeCls}>{text}</div>;
                    })()
                  }
                </div>
              </div>

              {/* Rastreamento */}
              {orderData.tracking && (
                <div className="bg-palette-card p-6 rounded-lg shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Rastreamento</h2>
                    <button
                      onClick={() => fetchTrackingData(orderData.tracking!.code)}
                      disabled={trackingLoading}
                      className="text-palette-primary hover:underline text-sm"
                    >
                      {trackingLoading ? 'Atualizando...' : 'Atualizar'}
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-palette-mute">Código de rastreamento:</p>
                    <p className="font-mono font-medium">{orderData.tracking.code}</p>
                  </div>

                  {/* Timeline de eventos */}
                  <div className="space-y-4">
                    {orderData.tracking.events.map((event, index) => (
                      <div key={index} className="flex items-start space-x-4">
                        <div className={`w-3 h-3 rounded-full mt-2 ${
                          index === 0 ? 'bg-palette-primary' : 'bg-gray-300'
                        }`}></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{event.description}</p>
                            <span className={`px-2 py-1 rounded text-xs ${getStatusColor(event.status)}`}>
                              {getStatusText(event.status)}
                            </span>
                          </div>
                          <p className="text-sm text-palette-mute">{event.location}</p>
                          <p className="text-xs text-palette-mute">
                            {formatDateTime(event.date, event.time)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Produtos do pedido */}
              <div className="bg-palette-card p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Produtos</h2>
                  <div className="space-y-4">
                  {(orderData.items || []).map((item) => {
                    // Extrair URL da imagem (pode estar em product.image ou product.images[0])
                    let imageUrl: string | null = null;
                    if (item.product?.image) {
                      imageUrl = item.product.image;
                    } else if (item.product?.images && Array.isArray(item.product.images) && item.product.images.length > 0) {
                      imageUrl = item.product.images[0].url;
                    }

                    return (
                      <div key={item.id} className="flex items-center gap-4 border-b pb-4">
                        {/* Miniatura da imagem */}
                        <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                          {imageUrl ? (
                            <img 
                              src={imageUrl}
                              alt={item.productName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center px-1">
                              Sem imagem
                            </div>
                          )}
                        </div>

                        {/* Informações do produto */}
                        <div className="flex-1">
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-sm text-palette-mute">Quantidade: {item.quantity}</p>
                          {/* mostrar preço unitário se disponível */}
                          <p className="text-sm text-palette-mute">Preço unitário: R$ {Number(item.price ?? item.unitPrice ?? 0).toFixed(2)}</p>
                        </div>

                        {/* Preço total do item */}
                        <p className="font-medium whitespace-nowrap">R$ {Number((item.price ?? item.unitPrice ?? 0) * (item.quantity ?? 0)).toFixed(2)}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>R$ {Number(orderData.totalAmount ?? 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna lateral - Informações do pedido */}
            <div className="lg:col-span-1 space-y-6">
              {/* Informações gerais */}
              <div className="bg-palette-card p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Informações do Pedido</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-palette-mute">Data do pedido:</span>
                    <p className="font-medium">{formatDate(orderData.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-palette-mute">Número do pedido:</span>
                    <p className="font-mono font-medium">#{String(orderData.id ?? '').slice(-8)}</p>
                  </div>
                </div>
              </div>

              {/* Endereço de entrega */}
              <div className="bg-palette-card p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Endereço de Entrega</h3>
                <div className="text-sm space-y-1">
                  {!isEditingAddress ? (
                    <>
                      <p>{orderData.shippingAddress?.street ?? ''} {orderData.shippingAddress?.number ? `, ${orderData.shippingAddress.number}` : ''}</p>
                      {orderData.shippingAddress?.complement && <p>{orderData.shippingAddress.complement}</p>}
                      <p>{orderData.shippingAddress?.city ?? ''}, {orderData.shippingAddress?.state ?? ''}</p>
                      <p>CEP: {orderData.shippingAddress?.postalCode ?? ''}</p>
                      <p>{orderData.shippingAddress?.country ?? ''}</p>
                      <div className="mt-2">
                        <button onClick={startEditAddress} className="text-palette-primary hover:underline text-sm mr-3">Editar</button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-palette-mute">Logradouro</label>
                        <input value={addressForm?.street || ''} onChange={(e) => handleAddressChange('street', e.target.value)} className="w-full mt-1 p-2 border rounded" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-palette-mute">Número</label>
                          <input value={addressForm?.number || ''} onChange={(e) => handleAddressChange('number', e.target.value)} className="w-full mt-1 p-2 border rounded" />
                        </div>
                        <div>
                          <label className="text-xs text-palette-mute">Complemento</label>
                          <input value={addressForm?.complement || ''} onChange={(e) => handleAddressChange('complement', e.target.value)} className="w-full mt-1 p-2 border rounded" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-palette-mute">Cidade</label>
                          <input value={addressForm?.city || ''} onChange={(e) => handleAddressChange('city', e.target.value)} className="w-full mt-1 p-2 border rounded" />
                        </div>
                        <div>
                          <label className="text-xs text-palette-mute">Estado</label>
                          <input value={addressForm?.state || ''} onChange={(e) => handleAddressChange('state', e.target.value)} className="w-full mt-1 p-2 border rounded" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-palette-mute">CEP</label>
                          <input value={addressForm?.postalCode || ''} onChange={(e) => handleAddressChange('postalCode', e.target.value)} className="w-full mt-1 p-2 border rounded" />
                        </div>
                        <div>
                          <label className="text-xs text-palette-mute">País</label>
                          <input value={addressForm?.country || ''} onChange={(e) => handleAddressChange('country', e.target.value)} className="w-full mt-1 p-2 border rounded" />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={saveAddress} className="bg-palette-primary text-palette-side px-4 py-2 rounded">Salvar</button>
                        <button onClick={cancelEditAddress} className="px-4 py-2 border rounded">Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Ações */}
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/orders')}
                  className="w-full bg-palette-primary text-palette-side py-3 px-4 rounded-lg hover:bg-palette-primary/90 transition-colors"
                >
                  Ver Todos os Pedidos
                </button>
                
                <button
                  onClick={() => router.push('/')}
                  className="w-full border border-palette-primary text-palette-primary py-3 px-4 rounded-lg hover:bg-palette-primary hover:text-palette-side transition-colors"
                >
                  Continuar Comprando
                </button>

                {orderData.payment?.status === 'COMPLETED' && (
                  <button
                    onClick={() => window.print()}
                    className="w-full border border-gray-300 text-palette-base py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Imprimir Pedido
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <Benefits />
      </div>
    </PrivateRoute>
  );
};

export default OrderStatusPage;

