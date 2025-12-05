import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { useLanguage } from '../../hooks/useLanguage';
import { IUserInfoRootState } from '../../lib/types/user';
import { toast } from 'react-toastify';
import api from '../../lib/axiosClient';

interface Order {
  id: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
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

  useEffect(() => {
    if (!userInfo) {
      router.push('/login');
      return;
    }

    fetchOrders(currentPage);
  }, [userInfo, currentPage]);

  const fetchOrders = async (page: number) => {
    setLoading(true);
    try {
      const response = await api.get('/orders/list', {
        params: {
          page,
          limit: 10
        }
      });

      const data = response.data || {};
      setOrders(data.orders || []);
      setPagination(data.pagination || null);
    } catch (error: any) {
      console.error('Erro ao buscar pedidos:', error);
      toast.error('Erro ao carregar seus pedidos');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const upperStatus = String(status).toUpperCase();
    // Pendente deve ficar vermelho conforme solicitado
    if (upperStatus === 'PENDING' || upperStatus === 'IN_PROCESS') return 'bg-red-100 text-red-800';
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
    if (upperStatus === 'IN_PROCESS') return 'Em Processamento';
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
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
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

                {/* Status */}
                <div className="md:col-span-1">
                  <div className="mb-3">
                    <p className="text-sm text-palette-mute mb-1">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-palette-mute mb-1">Pagamento</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getPaymentColor(order.paymentStatus)}`}>
                      {getPaymentStatusLabel(order.paymentStatus)}
                    </span>
                  </div>
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
