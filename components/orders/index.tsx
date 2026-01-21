import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { useLanguage } from '../../hooks/useLanguage';
import { IUserInfoRootState } from '../../lib/types/user';
import { toast } from 'react-toastify';
import api from '../../lib/axiosClient';
import tokenStore from '../../lib/tokenStore';

interface Installment {
  id: string;
  installmentNumber: number;
  status: string;
  amount: number;
  mpPreferenceId?: string;
  mpQrCodeBase64?: string;
  expiresAt?: string;
  paidAt?: string;
}

interface Order {
  id: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  isDelivered?: boolean;
  deliveryMethod?: string;
  trackingCode?: string | null;
  isLocalPickup?: boolean;
  installments?: Installment[];
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
}

interface ShippingInfo {
  sedex?: number;
  pac?: number;
  error?: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const Orders: React.FC = () => {
  const { t } = useLanguage();
  const router = useRouter();
  const userInfo = useSelector(
    (state: IUserInfoRootState) => state.userInfo.userInformation
  );

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [shippingInfo, setShippingInfo] = useState<Record<string, ShippingInfo>>({});

  useEffect(() => {
    if (!userInfo) {
      router.push('/login');
      return;
    }

    // ✅ Adicionar delay pequeno para garantir que o token está pronto no tokenStore
    const timer = setTimeout(() => {
      fetchOrders(currentPage);

      // Polling automático a cada 10 segundos (econômico)
      const pollInterval = setInterval(() => {
        fetchOrders(currentPage);
      }, 10000);

      // Listener para quando a página volta ao foco (aba ativa)
      const handlePageFocus = () => {
        console.log('[Orders] Página voltou ao foco, atualizando pedidos...');
        fetchOrders(currentPage);
      };

      window.addEventListener('focus', handlePageFocus);

      return () => {
        clearInterval(pollInterval);
        window.removeEventListener('focus', handlePageFocus);
      };
    }, 100);

    return () => clearTimeout(timer);
  }, [userInfo, currentPage]);

  const fetchOrders = async (page: number) => {
    setLoading(true);
    try {
      const token = tokenStore.getToken();
      const response = await api.get('/orders/list', {
        params: {
          page,
          limit: 10
        }
      });

      console.log('[Orders Component] ✅ Orders fetched successfully');
      const data = response.data || {};
      const ordersData = data.orders || [];
      setOrders(ordersData);
      setPagination(data.pagination || null);

      // Calcular frete para cada pedido
      const shippingCalcs: Record<string, ShippingInfo> = {};
      for (const order of ordersData) {
        if (order.shippingAddress?.postalCode) {
          try {
            const cepNumber = parseInt(order.shippingAddress.postalCode.replace(/\D/g, ''), 10);
            // Se CEP está na faixa restrita, não calcula frete
            if (cepNumber >= 39400000 && cepNumber <= 39409999) {
              shippingCalcs[order.id] = { sedex: 0, pac: 0 };
            } else {
              // Calcular frete com base na quantidade total de itens
              const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
              const shippingResponse = await api.post('/orders/calculate-shipping', {
                quantity: totalItems,
                cep: order.shippingAddress.postalCode
              });
              shippingCalcs[order.id] = shippingResponse.data || {};
            }
          } catch (err: any) {
            console.error('Erro ao calcular frete para pedido', order.id, err);
            shippingCalcs[order.id] = { error: 'Erro ao calcular' };
          }
        }
      }
      setShippingInfo(shippingCalcs);

      try {
        const debugArr = (ordersData || []).map((o: { id: string; status: string; paymentStatus: string; isDelivered?: boolean }) => ({ id: o.id, status: o.status, paymentStatus: o.paymentStatus, isDelivered: o.isDelivered }));
      } catch (e) {
        // ignore
      }
    } catch (error: any) {
      console.error('===== [Orders Component] ❌ Error fetching orders =====');
      console.error('[Orders Component] Error status:', error?.response?.status);
      console.error('[Orders Component] Error data:', error?.response?.data);
      console.error('[Orders Component] Error message:', error?.message);
      toast.error('Erro ao carregar seus pedidos: ' + (error?.response?.data?.error || error?.message));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const upperStatus = String(status).toUpperCase();
    // Pendente deve ficar vermelho conforme solicitado
    if (upperStatus === 'PENDING') return 'bg-red-100 text-red-800';
    if (upperStatus === 'IN_PROCESS' || upperStatus === 'PROCESSING') return 'bg-blue-100 text-blue-800';
    if (upperStatus === 'COMPLETED' || upperStatus === 'DELIVERED') return 'bg-green-100 text-green-800';
    if (upperStatus === 'CANCELLED' || upperStatus === 'FAILED') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Cores específicas para o estado do pagamento (badge de pagamento)
  const getPaymentColor = (status: string) => {
    const up = String(status || '').toUpperCase();
    if (up === 'COMPLETED' || up === 'PAID') return 'bg-green-100 text-green-800';
    if (up === 'PENDING' || up === 'IN_PROCESS') return 'bg-red-100 text-red-800';
    if (up === 'FAILED' || up === 'REJECTED') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusLabel = (status: string) => {
    const upperStatus = String(status).toUpperCase();
    if (upperStatus === 'COMPLETED' || upperStatus === 'PAID') return 'Pago';
    if (upperStatus === 'PENDING') return 'Pendente';
    if (upperStatus === 'FAILED') return 'Falhou';
    return status;
  };

  const getStatusLabel = (status: string) => {
    const upperStatus = String(status).toUpperCase();
    if (upperStatus === 'PENDING') return 'Pendente';
    if (upperStatus === 'IN_PROCESS' || upperStatus === 'PROCESSING') return 'Em Processamento';
    if (upperStatus === 'COMPLETED') return 'Concluído';
    if (upperStatus === 'DELIVERED') return 'Entregue';
    if (upperStatus === 'CANCELLED') return 'Cancelado';
    if (upperStatus === 'FAILED') return 'Falhou';
    return status;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading && orders.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-palette-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-palette-text mb-2">Meus Pedidos</h1>
        <p className="text-palette-mute">Acompanhe o status de seus pedidos</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-palette-card p-8 rounded-lg shadow-md text-center">
          <p className="text-palette-mute text-lg mb-4">Você ainda não realizou nenhum pedido</p>
          <button
            onClick={() => router.push('/products')}
            className="bg-palette-primary text-palette-side px-6 py-3 rounded-lg hover:bg-palette-primary/90 transition-colors"
          >
            Começar a Comprar
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              onClick={() => router.push(`/order-status/${order.id}`)}
              className="bg-palette-card p-6 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer border border-palette-border hover:border-palette-primary"
            >
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-start">
                {/* Informações do Pedido */}
                <div className="md:col-span-2">
                  <div className="mb-3">
                    <p className="text-sm text-palette-mute">Pedido ID</p>
                    <p className="font-semibold text-palette-text">#{order.id.slice(-8).toUpperCase()}</p>
                  </div>
                  <div className="mb-3">
                    <p className="text-sm text-palette-mute">Data do Pedido</p>
                    <p className="text-palette-text">{formatDate(order.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-palette-mute">Itens</p>
                    <p className="text-palette-text font-medium">
                      {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                    </p>
                  </div>
                </div>

                {/* Resumo de Itens */}
                <div className="md:col-span-1">
                  <p className="text-sm text-palette-mute mb-2">Produtos</p>
                  <div className="space-y-1">
                    {order.items.slice(0, 2).map((item, idx) => (
                      <p key={idx} className="text-sm text-palette-text truncate">
                        {item.productName} x{item.quantity}
                      </p>
                    ))}
                    {order.items.length > 2 && (
                      <p className="text-sm text-palette-mute italic">
                        +{order.items.length - 2} mais
                      </p>
                    )}
                  </div>
                </div>

                {/* Parcelas de Pagamento (PIX) */}
                {order.installments && order.installments.length > 0 && (
                  <div className="md:col-span-1">
                    <p className="text-sm text-palette-mute mb-2">Parcelas</p>
                    <div className="space-y-2">
                      {order.installments.map((inst) => {
                        const statusUpper = String(inst.status || '').toUpperCase();
                        let statusColor = 'bg-gray-100 text-gray-800';
                        let statusLabel = inst.status;

                        if (statusUpper === 'PAID') {
                          statusColor = 'bg-green-100 text-green-800';
                          statusLabel = 'Paga';
                        } else if (statusUpper === 'PAYMENT_CREATED') {
                          statusColor = 'bg-blue-100 text-blue-800';
                          statusLabel = 'Pendente';
                        } else if (statusUpper === 'PENDING') {
                          statusColor = 'bg-yellow-100 text-yellow-800';
                          statusLabel = 'Não Iniciada';
                        } else if (statusUpper === 'EXPIRED' || statusUpper === 'FAILED') {
                          statusColor = 'bg-red-100 text-red-800';
                          statusLabel = statusUpper === 'EXPIRED' ? 'Expirada' : 'Falhou';
                        }

                        return (
                          <div
                            key={inst.id}
                            className="border border-palette-border rounded p-2 cursor-pointer hover:bg-palette-border transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (statusUpper === 'PAYMENT_CREATED') {
                                router.push(`/order-status/${order.id}`);
                              }
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-semibold text-palette-text">
                                Parcela {inst.installmentNumber}/2
                              </span>
                              <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${statusColor}`}>
                                {statusLabel}
                              </span>
                            </div>
                            <div className="text-xs text-palette-mute mt-1">
                              {formatCurrency(inst.amount)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Status */}
                <div className="md:col-span-1">
                  <div className="mb-3">
                    <p className="text-sm text-palette-mute mb-1">Status</p>
                    {(() => {
                      // Se pagamento foi feito mas status do pedido ainda é PENDING/PROCESSING, mostrar como EM PROCESSAMENTO
                      const paymentUpper = String(order.paymentStatus || '').toUpperCase();
                      const isPaid = paymentUpper === 'COMPLETED' || paymentUpper === 'PAID';
                      const statusUpper = String(order.status || '').toUpperCase();
                      // Priorizar isDelivered: se marcado como entregue no admin, exibir Entregue
                      if (order.isDelivered === true) {
                        return (
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor('DELIVERED')}`}>
                            {getStatusLabel('DELIVERED')}
                          </span>
                        );
                      }
                      const displayStatus = (isPaid && (statusUpper === 'PENDING' || statusUpper === 'PROCESSING')) ? 'IN_PROCESS' : (order.status || 'PENDING');
                      return (
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(displayStatus)}`}>
                          {getStatusLabel(displayStatus)}
                        </span>
                      );
                    })()}
                  </div>
                  <div>
                    <p className="text-sm text-palette-mute mb-1">Pagamento</p>
                    {(() => {
                      // Calcular status do pagamento baseado nas parcelas, não apenas no campo paymentStatus
                      if (!order.installments || order.installments.length === 0) {
                        // Se não houver parcelas, usar paymentStatus
                        return (
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getPaymentColor(order.paymentStatus)}`}>
                            {getPaymentStatusLabel(order.paymentStatus)}
                          </span>
                        );
                      }

                      // Verificar se todas as parcelas foram pagas
                      const allPaid = order.installments.every(
                        (inst) => String(inst.status || '').toUpperCase() === 'PAID'
                      );
                      const somePaid = order.installments.some(
                        (inst) => String(inst.status || '').toUpperCase() === 'PAID'
                      );

                      if (allPaid) {
                        return (
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getPaymentColor('PAID')}`}>
                            {getPaymentStatusLabel('PAID')}
                          </span>
                        );
                      } else if (somePaid) {
                        return (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            Parcial
                          </span>
                        );
                      } else {
                        return (
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getPaymentColor('PENDING')}`}>
                            {getPaymentStatusLabel('PENDING')}
                          </span>
                        );
                      }
                    })()}
                  </div>
                </div>

                {/* Frete */}
                <div className="md:col-span-1">
                  <p className="text-sm text-palette-mute mb-2">Frete</p>
                  {shippingInfo[order.id]?.error ? (
                    <p className="text-xs text-red-600">{shippingInfo[order.id].error}</p>
                  ) : shippingInfo[order.id]?.sedex !== undefined && shippingInfo[order.id]?.sedex !== 0 ? (
                    <div className="space-y-1">
                      <div>
                        <p className="text-xs text-palette-mute">SEDEX</p>
                        <p className="text-sm font-semibold text-palette-text">
                          {formatCurrency(shippingInfo[order.id].sedex || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-palette-mute">PAC</p>
                        <p className="text-sm font-semibold text-palette-text">
                          {formatCurrency(shippingInfo[order.id].pac || 0)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-palette-mute italic">Frete na zona local</p>
                  )}
                </div>

                {/* Total */}
                <div className="md:col-span-1 text-right">
                  <div className="mb-4">
                    <p className="text-sm text-palette-mute mb-1">Total</p>
                    {/* Cor do valor depende do status do pagamento: verde se pago, vermelho se não pago */}
                    {(() => {
                      const payUpper = String(order.paymentStatus || '').toUpperCase();
                      const isPaid = payUpper === 'COMPLETED' || payUpper === 'PAID';
                      const valueClass = isPaid ? 'text-green-700' : 'text-red-700';
                      return (
                        <p className={`text-xl font-bold ${valueClass}`}>
                          {formatCurrency(order.total)}
                        </p>
                      );
                    })()}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/order-status/${order.id}`);
                    }}
                    className="w-full bg-palette-primary text-palette-side px-3 py-2 rounded-lg hover:bg-palette-primary/90 transition-colors text-sm font-medium"
                  >
                    Visualizar Detalhes
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Paginação */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-4 py-2 rounded-lg border border-palette-border hover:bg-palette-card disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>

              <div className="flex gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      currentPage === page
                        ? 'bg-palette-primary text-palette-side font-semibold'
                        : 'border border-palette-border hover:bg-palette-card'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                disabled={currentPage === pagination.totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-4 py-2 rounded-lg border border-palette-border hover:bg-palette-card disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Orders;
