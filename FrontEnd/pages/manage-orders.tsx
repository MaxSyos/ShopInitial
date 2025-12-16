import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { useLanguage } from '../hooks/useLanguage';
import { IUserInfoRootState } from '../lib/types/user';
import { toast } from 'react-toastify';
import api from '../lib/axiosClient';
import tokenStore from '../lib/tokenStore';
import Breadcrumb from '../components/UI/Breadcrumb';
import Benefits from '../components/Benefits';
import PrivateRoute from '../components/auth/PrivateRoute';
import { MdEdit, MdDelete, MdCheck, MdClose, MdLocalShipping } from 'react-icons/md';

interface OrderItemData {
  id: string;
  productName: string;
  quantity: number;
  price: number;
  unitPrice?: number | null;
  sku?: string;
}

interface OrderData {
  id: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  items: OrderItemData[];
  shippingAddress: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  trackingCode?: string;
  deliveryMethod?: string;
  isDelivered?: boolean;
  deliveredAt?: string;
}

interface EditingOrder {
  id: string;
  trackingCode: string;
  deliveryMethod: string;
  isDelivered: boolean;
}

const ManageOrdersPage: React.FC = () => {
  const { t } = useLanguage();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingOrder, setEditingOrder] = useState<EditingOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const userInfo = useSelector(
    (state: IUserInfoRootState) => state.userInfo.userInformation
  );

  // Verificar se é ADMIN
  useEffect(() => {
    if (!userInfo) {
      router.push('/login');
      return;
    }

    if (userInfo.role !== 'ADMIN') {
      toast.error('Acesso negado. Apenas administradores podem acessar esta página.');
      router.push('/');
      return;
    }

    // ✅ Adicionar delay pequeno para garantir que o token está pronto no tokenStore
    const timer = setTimeout(() => {
      fetchOrders();
    }, 100);

    return () => clearTimeout(timer);
  }, [userInfo]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = tokenStore.getToken();
      console.log('[ManageOrders] Token in tokenStore:', token ? `present (${token.substring(0, 20)}...)` : 'MISSING');
      console.log('[ManageOrders] Fetching orders from /admin/orders...');
      const response = await api.get('/admin/orders');
      console.log('[ManageOrders] Orders fetched successfully:', response.data?.length || 0, 'orders');
      const data = Array.isArray(response.data) ? response.data : response.data.orders || [];
      setOrders(data);
    } catch (error: any) {
      console.error('[ManageOrders] Error fetching orders:', error?.response?.status, error?.response?.data || error?.message);
      toast.error('Erro ao carregar pedidos: ' + (error?.response?.data?.error || error?.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEditOrder = (order: OrderData) => {
    setEditingOrder({
      id: order.id,
      trackingCode: order.trackingCode || '',
      deliveryMethod: order.deliveryMethod || 'PENDING',
      isDelivered: order.isDelivered || false,
    });
  };

  const handleCancelEdit = () => {
    setEditingOrder(null);
  };

  const handleSaveOrder = async () => {
    if (!editingOrder) return;

    try {
      const payload = {
        trackingCode: editingOrder.trackingCode || null,
        deliveryMethod: editingOrder.deliveryMethod,
        isDelivered: editingOrder.isDelivered,
        ...(editingOrder.isDelivered && { deliveredAt: new Date().toISOString() }),
      };

      await api.patch(`/admin/orders?id=${editingOrder.id}`, payload);
      toast.success('Pedido atualizado com sucesso!');
      setEditingOrder(null);
      fetchOrders();
    } catch (error: any) {
      console.error('Erro ao atualizar pedido:', error);
      toast.error('Erro ao atualizar pedido');
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'PAID':
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'FAILED':
      case 'EXPIRED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getDeliveryStatusColor = (status: string, isDelivered: boolean) => {
    if (isDelivered) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    switch (status?.toUpperCase()) {
      case 'CORREIOS':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'LOCAL':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getDeliveryStatusText = (deliveryMethod: string, isDelivered: boolean) => {
    if (isDelivered) return 'Entregue';
    switch (deliveryMethod?.toUpperCase()) {
      case 'CORREIOS':
        return 'Correios';
      case 'LOCAL':
        return 'Entrega Local';
      default:
        return 'Pendente';
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'paid') return order.paymentStatus === 'PAID' || order.paymentStatus === 'COMPLETED';
    if (statusFilter === 'pending_payment') return order.paymentStatus === 'PENDING';
    if (statusFilter === 'delivered') return order.isDelivered;
    if (statusFilter === 'pending_delivery') return !order.isDelivered && (order.paymentStatus === 'PAID' || order.paymentStatus === 'COMPLETED');
    return true;
  });

  if (loading) {
    return (
      <PrivateRoute>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-palette-primary"></div>
        </div>
      </PrivateRoute>
    );
  }

  return (
    <PrivateRoute>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumb />

        <div className="mt-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Gerenciar Pedidos</h1>
            <button
              onClick={() => router.push('/orders')}
              className="px-4 py-2 border border-palette-primary text-palette-primary rounded-lg hover:bg-palette-primary hover:text-palette-side transition"
            >
              Meus Pedidos
            </button>
          </div>

          {/* Filtros */}
          <div className="mb-6 flex gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg transition ${
                statusFilter === 'all'
                  ? 'bg-palette-primary text-palette-side'
                  : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300'
              }`}
            >
              Todos ({orders.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending_payment')}
              className={`px-4 py-2 rounded-lg transition ${
                statusFilter === 'pending_payment'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 hover:opacity-75'
              }`}
            >
              Aguardando Pagamento ({orders.filter(o => o.paymentStatus === 'PENDING').length})
            </button>
            <button
              onClick={() => setStatusFilter('pending_delivery')}
              className={`px-4 py-2 rounded-lg transition ${
                statusFilter === 'pending_delivery'
                  ? 'bg-blue-500 text-white'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 hover:opacity-75'
              }`}
            >
              Aguardando Entrega ({orders.filter(o => !o.isDelivered && (o.paymentStatus === 'PAID' || o.paymentStatus === 'COMPLETED')).length})
            </button>
            <button
              onClick={() => setStatusFilter('delivered')}
              className={`px-4 py-2 rounded-lg transition ${
                statusFilter === 'delivered'
                  ? 'bg-green-500 text-white'
                  : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:opacity-75'
              }`}
            >
              Entregues ({orders.filter(o => o.isDelivered).length})
            </button>
          </div>

          {/* Tabela de pedidos */}
          <div className="overflow-x-auto bg-palette-card rounded-lg shadow-md">
            <table className="w-full text-sm">
              <thead className="bg-palette-fill border-b border-palette-mute">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Pedido</th>
                  <th className="px-4 py-3 text-left font-semibold">Cliente</th>
                  <th className="px-4 py-3 text-left font-semibold">SKU</th>
                  <th className="px-4 py-3 text-left font-semibold">Data</th>
                  <th className="px-4 py-3 text-left font-semibold">Total</th>
                  <th className="px-4 py-3 text-left font-semibold">Pagamento</th>
                  <th className="px-4 py-3 text-left font-semibold">Entrega</th>
                  <th className="px-4 py-3 text-center font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-palette-mute">
                      Nenhum pedido encontrado
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b border-palette-mute hover:bg-palette-fill/50 transition">
                      <td className="px-4 py-3 font-mono font-medium">#{String(order.id).slice(-8)}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{order.user?.name || '-'}</p>
                          <p className="text-xs text-palette-mute">{order.user?.email || '-'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {order.items && order.items.length > 0 ? (
                          <div className="space-y-1">
                            {order.items.map((item) => (
                              <div key={item.id}>{item.sku || '-'}</div>
                            ))}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-palette-mute">
                        {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        R$ {Number(order.totalAmount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                          {order.paymentStatus === 'PENDING' ? 'Pendente' : order.paymentStatus === 'PAID' ? 'Pago' : order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${getDeliveryStatusColor(order.deliveryMethod || '', order.isDelivered || false)}`}>
                          {getDeliveryStatusText(order.deliveryMethod || '', order.isDelivered || false)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleEditOrder(order)}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-md hover:opacity-75 transition"
                          title="Editar rastreamento"
                        >
                          <MdEdit size={16} />
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de edição */}
        {editingOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-palette-card rounded-lg p-6 max-w-md w-full shadow-lg">
              <h2 className="text-xl font-bold mb-4">Gerenciar Rastreamento</h2>

              <div className="space-y-4">
                {/* Opção de tipo de entrega */}
                <div>
                  <label className="block text-sm font-medium mb-2">Tipo de Entrega</label>
                  <select
                    value={editingOrder.deliveryMethod}
                    onChange={(e) =>
                      setEditingOrder({
                        ...editingOrder,
                        deliveryMethod: e.target.value,
                        trackingCode: '',
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  >
                    <option value="PENDING">Selecione uma opção</option>
                    <option value="CORREIOS">Correios (com rastreamento)</option>
                    <option value="LOCAL">Entrega Local (sem rastreamento)</option>
                  </select>
                </div>

                {/* Campo de código de rastreamento (apenas para Correios) */}
                {editingOrder.deliveryMethod === 'CORREIOS' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Código de Rastreamento (Correios)
                    </label>
                    <input
                      type="text"
                      value={editingOrder.trackingCode}
                      onChange={(e) =>
                        setEditingOrder({
                          ...editingOrder,
                          trackingCode: e.target.value,
                        })
                      }
                      placeholder="Ex: AA999999999BR"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                )}

                {/* Checkbox de entrega confirmada (apenas para LOCAL) */}
                {editingOrder.deliveryMethod === 'LOCAL' && (
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isDelivered"
                      checked={editingOrder.isDelivered}
                      onChange={(e) =>
                        setEditingOrder({
                          ...editingOrder,
                          isDelivered: e.target.checked,
                        })
                      }
                      className="w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="isDelivered" className="text-sm font-medium cursor-pointer">
                      Marcar como Entregue
                    </label>
                  </div>
                )}

                {/* Mostrar status de entrega para Correios */}
                {editingOrder.deliveryMethod === 'CORREIOS' && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                      ℹ️ O status será atualizado automaticamente via API dos Correios com base no código de rastreamento.
                    </p>
                  </div>
                )}

                {/* Botões */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleCancelEdit}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveOrder}
                    disabled={editingOrder.deliveryMethod === 'PENDING'}
                    className="flex-1 px-4 py-2 bg-palette-primary text-palette-side rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <Benefits />
      </div>
    </PrivateRoute>
  );
};

export default ManageOrdersPage;
