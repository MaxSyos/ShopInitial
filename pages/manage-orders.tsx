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
  isLocalPickup?: boolean;
}

interface EditingOrder {
  id: string;
  trackingCode: string;
  deliveryMethod: string;
  isDelivered: boolean;
  isLocalPickup?: boolean;
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

      // Polling automático a cada 10 segundos (econômico)
      const pollInterval = setInterval(() => {
        fetchOrders();
      }, 10000);

      // Listener para quando a página volta ao foco (aba ativa)
      const handlePageFocus = () => {
        console.log('[ManageOrders] Página voltou ao foco, atualizando pedidos...');
        fetchOrders();
      };

      window.addEventListener('focus', handlePageFocus);

      return () => {
        clearInterval(pollInterval);
        window.removeEventListener('focus', handlePageFocus);
      };
    }, 100);

    return () => clearTimeout(timer);
  }, [userInfo]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = tokenStore.getToken();
      const response = await api.get('/admin/orders');
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
      deliveryMethod: order.isLocalPickup ? 'LOCAL' : (order.deliveryMethod || 'PENDING'),
      isDelivered: order.isDelivered || false,
      isLocalPickup: order.isLocalPickup || false,
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

  const getDeliveryStatusColor = (status: string, isDelivered: boolean, isLocalPickup?: boolean) => {
    if (isLocalPickup) return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
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

  const getDeliveryStatusText = (deliveryMethod: string, isDelivered: boolean, isLocalPickup?: boolean) => {
    if (isDelivered) return 'Entregue';
    if (isLocalPickup) return 'Entrega local (sem rastreamento)';
    switch (deliveryMethod?.toUpperCase()) {
      case 'CORREIOS':
        return 'Correios';
      case 'LOCAL':
        return 'Entrega Local';
      default:
        return 'Pendente';
    }
  };

  const [showListsModal, setShowListsModal] = useState(false);
  const [listsForOrder, setListsForOrder] = useState<Record<string, any[]>>({});
  const [listsLoading, setListsLoading] = useState(false);
  const [currentOrderForLists, setCurrentOrderForLists] = useState<OrderData | null>(null);

  async function openListsModal(order: OrderData) {
    setShowListsModal(true);
    setListsForOrder({});
    setCurrentOrderForLists(order);
    setListsLoading(true);
    try {
      const out: Record<string, any[]> = {};
      // fetch lists for each order item
      await Promise.all(order.items.map(async (it) => {
        try {
          const resp = await fetch(`/api/orders/lists?orderItemId=${encodeURIComponent(it.id)}`);
          if (!resp.ok) return;
          const data = await resp.json();
          out[it.id] = data || [];
        } catch (err) {
          out[it.id] = [];
        }
      }));
      setListsForOrder(out);
    } catch (err) {
      console.error('Erro ao buscar listas do pedido', err);
      toast.error('Erro ao carregar listas do pedido');
    } finally {
      setListsLoading(false);
    }
  }

  function exportListAsXls(orderId: string, productName: string, listRows: any[], idx: number) {
    // create CSV content with UTF-8 encoding and semicolon separator (compatible with Excel)
    const headers = ['Nome', 'Número', 'Tamanho'];
    const lines = [headers.join(';')];
    for (const r of listRows) {
      const name = (r.name || '').replace(/[;\n\r]/g, ' ');
      const number = (r.number || '').toString().replace(/[;\n\r]/g, ' ');
      const size = (r.size || '').replace(/[;\n\r]/g, ' ');
      lines.push([name, number, size].join(';'));
    }
    // Adicionar BOM UTF-8 para garantir que o Excel reconheça a codificação corretamente
    const bom = '\uFEFF';
    const csv = bom + lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const fileName = `order_${orderId}_${productName.replace(/\s+/g, '_')}_list_${idx + 1}.csv`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

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
                  <th className="px-4 py-3 text-left font-semibold">Listas</th>
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
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${getDeliveryStatusColor(order.deliveryMethod || '', order.isDelivered || false, order.isLocalPickup)}`}>
                          {getDeliveryStatusText(order.deliveryMethod || '', order.isDelivered || false, order.isLocalPickup)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openListsModal(order)}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-md hover:opacity-75 transition"
                          title="Ver listas do pedido"
                        >
                          Listas
                        </button>
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
                {/* Aviso de retirada local */}
                {editingOrder.isLocalPickup && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-3">
                    <p className="text-sm text-purple-800 dark:text-purple-300 font-medium">
                      ℹ️ Esta é uma <strong>retirada pessoal na loja</strong> (sem rastreamento)
                    </p>
                  </div>
                )}

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
                    disabled={editingOrder.isLocalPickup}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
                      placeholder="Ex: OR999999999BR"
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

        {/* Modal de Listas por produto */}
        {showListsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-6 z-[9999] overflow-auto">
            <div className="bg-palette-card rounded-lg p-6 max-w-4xl w-full shadow-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold mb-4">Listas do Pedido</h2>
                <button onClick={() => setShowListsModal(false)} className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Fechar</button>
              </div>
              {listsLoading ? (
                <div className="py-8 text-center">Carregando listas...</div>
              ) : (
                <div className="space-y-6">
                  {filteredOrders.length === 0 ? (
                    <p>Nenhuma lista encontrada</p>
                  ) : (
                    // percorre os produtos do pedido e mostra as listas relacionadas
                    Object.keys(listsForOrder).length === 0 ? (
                      <p className="text-palette-mute">Nenhuma lista registrada para este pedido.</p>
                    ) : (
                      orders
                        .filter(o => o.id && o.items && o.items.length)
                        .map((o) => {
                          // só mostrar para o pedido atualmente com modal aberto
                          // assumimos que modal é aberto para um pedido e listsForOrder contém chaves
                          return null;
                        })
                    )
                  )}

                  {/* Exibir listas por produto usando listasForOrder - ordena pelos items do pedido que abriu o modal */}
                  <div className="space-y-6">
                    {currentOrderForLists && currentOrderForLists.items.map((item) => {
                      const lists = listsForOrder[item.id] || [];
                      return (
                        <div key={item.id} className="border rounded-md p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium">Produto: {item.productName}</p>
                              <p className="text-xs text-palette-mute">Quantidade no pedido: {item.quantity}</p>
                            </div>
                          </div>

                          {lists.length === 0 ? (
                            <p className="text-palette-mute">Nenhuma lista registrada para este produto.</p>
                          ) : (
                            <div className="space-y-3">
                              {lists.map((lst: any, idx: number) => (
                                <div key={lst.id} className="bg-white dark:bg-gray-900 p-3 rounded-md shadow-sm">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="text-sm font-semibold">Lista #{idx + 1}</div>
                                    <button
                                      className="px-3 py-1 bg-palette-primary text-white rounded-md text-sm"
                                      onClick={() => exportListAsXls(currentOrderForLists.id, item.productName, lst.rows || [], idx)}
                                    >
                                      Exportar .XLS
                                    </button>
                                  </div>
                                  <div className="overflow-auto">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="text-left text-xs text-palette-mute">
                                          <th className="py-1 px-2">Nome</th>
                                          <th className="py-1 px-2">Número</th>
                                          <th className="py-1 px-2">Tamanho</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(lst.rows || []).map((r: any, i: number) => (
                                          <tr key={i} className="border-t">
                                            <td className="py-1 px-2">{r.name}</td>
                                            <td className="py-1 px-2">{r.number}</td>
                                            <td className="py-1 px-2">{r.size}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <Benefits />
      </div>
    </PrivateRoute>
  );
};

export default ManageOrdersPage;
