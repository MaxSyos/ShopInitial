import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { useLanguage } from '../../hooks/useLanguage';
import { IUserInfoRootState } from '../../lib/types/user';
import { ICartRootState } from '../../lib/types/cart';
import { RootState } from '../../store';
import { toast } from 'react-toastify';
import api from '../../lib/axiosClient';
import tokenStore from '../../lib/tokenStore';
import Breadcrumb from '../../components/UI/Breadcrumb';
import Benefits from '../../components/Benefits';
import OrderTracking from '../../components/cart/OrderTracking';
import PrivateRoute from '../../components/auth/PrivateRoute';

interface PaymentData {
  id: string;
  status: string;
  pixCode?: string;
  pixQrCode?: string;
  pixExpiresAt?: string;
  amount: number;
}

const PaymentByIdPage: React.FC = () => {
  const { t } = useLanguage();
  const router = useRouter();
  const { id } = router.query as { id?: string };

  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [pixDataUrl, setPixDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [orderId, setOrderId] = useState<string>('');
  const [shippingAddress, setShippingAddress] = useState<any>(null);
  const [orderSummary, setOrderSummary] = useState<any | null>(null);

  const userInfo = useSelector((state: IUserInfoRootState) => state.userInfo.userInformation);
  const cartItems = useSelector((state: ICartRootState) => state.cart.items);
  const totalAmount = useSelector((state: ICartRootState) => state.cart.totalAmount);

  useEffect(() => {
    if (!userInfo) {
      // redirecionar para login mantendo a rota atual
      router.push(`/login?redirect=/payment/${id || ''}`);
      return;
    }

    // Recuperar endereço selecionado (pode ter sido salvo antes)
    const savedAddress = localStorage.getItem('selectedShippingAddress');
    if (savedAddress) setShippingAddress(JSON.parse(savedAddress));

    // definir orderId quando disponível via rota
    if (id) {
      const idStr = Array.isArray(id) ? id[0] : id;
      setOrderId(idStr);
    }
  }, [userInfo, id, router]);

  useEffect(() => {
    // quando receber o orderId via rota, tentar criar o pagamento para esse pedido
    if (orderId && !paymentData) {
      createPaymentForOrder(orderId);
    }
    // sempre buscar resumo do pedido da API para garantir dados atualizados
    if (orderId) {
      fetchOrderSummary(orderId);
    }
  }, [orderId]);

  // Tentar refazer a busca do resumo se estiver vazio após 2 segundos (fallback caso API demore)
  useEffect(() => {
    if (!orderId || orderSummary?.items?.length > 0) return;
    
    const timer = setTimeout(() => {
      console.log('Tentando buscar resumo novamente pois estava vazio...');
      fetchOrderSummary(orderId);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [orderId, orderSummary?.items?.length]);

  const normalizeOrderItems = (items: any[], amount: number) => {
    if (!items || items.length === 0) {
      return { items: [], totalAmount: amount };
    }
    const normalized = items.map((it: any) => ({
      id: it.id || it.productId,
      name: it.productName || it.product?.name || it.name || '',
      quantity: it.quantity || 1,
      price: it.unitPrice || it.price || 0,
      totalPrice: it.total ?? it.totalPrice ?? ((it.unitPrice || it.price || 0) * (it.quantity || 1)),
    }));
    return { items: normalized, totalAmount: amount };
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (paymentData?.pixExpiresAt) {
      const updateTimer = () => {
        const expiresAt = new Date(paymentData.pixExpiresAt!).getTime();
        const now = new Date().getTime();
        const difference = expiresAt - now;

        if (difference > 0) {
          setTimeLeft(Math.floor(difference / 1000));
        } else {
          setTimeLeft(0);
          clearInterval(interval);
        }
      };

      updateTimer();
      interval = setInterval(updateTimer, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [paymentData?.pixExpiresAt]);

  useEffect(() => {
    let statusInterval: NodeJS.Timeout;

    if (paymentData?.id && paymentData.status === 'WAITING_PAYMENT') {
      statusInterval = setInterval(() => {
        checkPaymentStatus();
      }, 5000);
    }

    return () => {
      if (statusInterval) clearInterval(statusInterval);
    };
  }, [paymentData?.id, paymentData?.status]);

  useEffect(() => {
    let cancelled = false;
    const generate = async () => {
      setPixDataUrl(null);
      if (!paymentData) return;

      if (paymentData.pixQrCode) {
        setPixDataUrl(`data:image/png;base64,${paymentData.pixQrCode}`);
        return;
      }

      if (paymentData.pixCode) {
        try {
          // @ts-ignore
          const qrcode: any = await import('qrcode');
          if (cancelled) return;
          const dataUrl = await qrcode.toDataURL(paymentData.pixCode);
          if (!cancelled) setPixDataUrl(dataUrl as string);
          return;
        } catch (err) {
          if (!cancelled) setPixDataUrl(null);
          return;
        }
      }
    };

    generate();
    return () => { cancelled = true; };
  }, [paymentData]);

  const createPaymentForOrder = async (orderIdParam: string) => {
    if (!orderIdParam) return;
    if (loading) return;
    setLoading(true);
    try {
      let token = tokenStore.getToken() || '';
      if (!token) {
        try {
          const ui = localStorage.getItem('userInfo');
          if (ui) token = JSON.parse(ui).accessToken || '';
        } catch (e) {}
      }

      // recuperar idempotencyKey gerada ao criar o pedido, se presente
      let stored = null;
      try { stored = JSON.parse(localStorage.getItem('createdOrder') || 'null'); } catch (e) { stored = null; }
      const idempotencyKey = stored?.idempotencyKey || undefined;

      const paymentDataReq: any = {
        orderId: orderIdParam,
        amount: totalAmount,
        currency: 'BRL',
        paymentMethod: 'PIX'
      };
      if (idempotencyKey) paymentDataReq.idempotencyKey = idempotencyKey;

      const paymentResponse = await api.post('/payments/create', paymentDataReq);

      const respData = paymentResponse.data || {};
      const mp = respData.mp || {};

      let pixQrBase64: string | undefined = undefined;
      if (mp.qrBase64) {
        const raw = mp.qrBase64 as string;
        pixQrBase64 = raw.startsWith('data:') ? raw.split(',')[1] ?? raw : raw;
      } else if (respData.order && respData.order.mpQrCodeBase64) {
        const raw = respData.order.mpQrCodeBase64 as string;
        pixQrBase64 = raw.startsWith('data:') ? raw.split(',')[1] ?? raw : raw;
      }

      const rawStatus = (respData.order && respData.order.paymentStatus) || 'WAITING_PAYMENT';
      const normalizedStatus = rawStatus === 'PENDING' ? 'WAITING_PAYMENT' : rawStatus;

      const paymentState: PaymentData = {
        id: (mp.id || (respData.order && respData.order.mpPreferenceId) || orderIdParam).toString(),
        status: normalizedStatus,
        pixCode: mp.qr || (respData.order && respData.order.mpQrCodeUrl) || undefined,
        pixQrCode: pixQrBase64,
        pixExpiresAt: respData.order?.paymentExpiresAt ? new Date(respData.order.paymentExpiresAt).toISOString() : undefined,
        amount: paymentDataReq.amount
      };

      setPaymentData(paymentState);
      // se a resposta trouxe o pedido local/upstream, usar para o resumo
      if (respData.order || respData.localOrder) {
        setOrderSummary(respData.order || respData.localOrder);
      }
      toast.success('Pagamento PIX gerado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao gerar pagamento PIX:', error);
      const message = error?.response?.data?.error || error?.message || 'Erro ao gerar pagamento';
      toast.error(`Erro ao gerar pagamento PIX: ${message}`);
      setPaymentData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderSummary = async (idToFetch: string) => {
    try {
      const res = await api.get(`/orders/${idToFetch}`);
      const payload = res.data || {};
      const resolved = payload.order || payload.localOrder || payload;
      
      if (resolved && (resolved.items || resolved.itemsJson)) {
        // Extrair items — podem estar em diferentes formatos
        const rawItems = resolved.items || resolved.itemsJson || [];
        const total = resolved.total ?? resolved.subtotal ?? resolved.amount ?? 0;
        
        // Normalizar items
        const normalizedItems = (rawItems || []).map((it: any) => ({
          id: it.id || it.productId,
          name: it.productName || it.product?.name || it.name || '',
          quantity: it.quantity || 1,
          price: it.unitPrice || it.price || 0,
          totalPrice: it.total ?? it.totalPrice ?? ((it.unitPrice || it.price || 0) * (it.quantity || 1)),
        }));
        
        setOrderSummary({ items: normalizedItems, totalAmount: total });
        console.log('Order Summary carregado da API:', { items: normalizedItems, total });
        return;
      }
    } catch (e) {
      console.warn('Falha ao buscar resumo do pedido da API:', e);
    }
    
    // Se a API falhar ou não retornar items, tentar localStorage como fallback
    try {
      const stored = JSON.parse(localStorage.getItem('createdOrder') || 'null');
      if (stored && (stored.items || stored.itemsJson)) {
        const total = stored.total ?? stored.totalAmount ?? 0;
        const rawItems = stored.items || stored.itemsJson || [];
        const normalizedItems = (rawItems || []).map((it: any) => ({
          id: it.id || it.productId,
          name: it.productName || it.product?.name || it.name || '',
          quantity: it.quantity || 1,
          price: it.unitPrice || it.price || 0,
          totalPrice: it.totalPrice ?? ((it.unitPrice || it.price || 0) * (it.quantity || 1)),
        }));
        setOrderSummary({ items: normalizedItems, totalAmount: total });
        console.log('Order Summary carregado do localStorage:', { items: normalizedItems, total });
        return;
      }
    } catch (fallbackErr) {
      console.warn('Fallback localStorage também falhou:', fallbackErr);
    }
    
    // Se tudo falhar mas temos cartItems do Redux, usar como última opção
    if (cartItems && cartItems.length > 0) {
      const normalizedItems = cartItems.map((item: any) => ({
        id: item.id || item.productId,
        name: item.productName || item.product?.name || item.name || '',
        quantity: item.quantity || 1,
        price: item.unitPrice || item.price || item.pricePerQuantity || 0,
        totalPrice: item.totalPrice ?? item.total ?? ((item.unitPrice || item.price || item.pricePerQuantity || 0) * (item.quantity || 1)),
      }));
      setOrderSummary({ items: normalizedItems, totalAmount });
      console.log('Order Summary carregado do Redux cartItems:', { items: normalizedItems, totalAmount });
    }
  };

  const checkPaymentStatus = async () => {
    if (!paymentData?.id) return;

    try {
      const response = await api.get(`/payments/${paymentData.id}/pix-status`);

      if (response.data.status === 'COMPLETED') {
        toast.success('Pagamento aprovado!');
        router.push(`/order-status/${orderId}`);
      } else if (response.data.status === 'FAILED' || response.data.status === 'EXPIRED') {
        toast.error('Pagamento não foi aprovado');
        setPaymentData(prev => prev ? { ...prev, status: response.data.status } : null);
      }
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error);
    } finally {
      // Sempre fazer refresh da página após verificar o status
      router.reload();
    }
  };

  const copyPixCode = () => {
    if (paymentData?.pixCode) {
      navigator.clipboard.writeText(paymentData.pixCode);
      toast.success('Código PIX copiado!');
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    // Se não há horas, mostrar apenas MM:SS (mais compacto)
    if (hrs === 0) {
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

  return (
    <PrivateRoute>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Breadcrumb />

        <OrderTracking currentStep={2} />

        <div className="mt-8">
          <h1 className="text-3xl font-bold mb-8 text-center">Pagamento PIX</h1>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Coluna principal - QR Code e instruções */}
            <div className="space-y-6">
              {paymentData && (
                <>
                  {/* Status do pagamento */}
                  <div className={`p-4 rounded-lg text-center ${
                    paymentData.status === 'WAITING_PAYMENT'
                      ? 'bg-yellow-100 text-yellow-800'
                      : paymentData.status === 'COMPLETED'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    <p className="font-semibold">
                      {paymentData.status === 'WAITING_PAYMENT' && 'Aguardando Pagamento'}
                      {paymentData.status === 'COMPLETED' && 'Pagamento Aprovado'}
                      {paymentData.status === 'FAILED' && 'Pagamento Rejeitado'}
                      {paymentData.status === 'EXPIRED' && 'Pagamento Expirado'}
                    </p>
                  </div>

                  {/* Timer de expiração */}
                  {timeLeft > 0 && paymentData.status === 'WAITING_PAYMENT' && (
                    <div className="bg-palette-fill p-4 rounded-lg text-center">
                      <p className="text-sm text-palette-mute mb-2">Tempo restante para pagamento:</p>
                      <p className="text-2xl font-bold text-palette-primary">{formatTime(timeLeft)}</p>
                    </div>
                  )}

                  {/* QR Code */}
                  {(pixDataUrl || paymentData.pixQrCode) && paymentData.status === 'WAITING_PAYMENT' && (
                    <div className="bg-palette-card p-6 rounded-lg shadow-md text-center">
                      <h2 className="text-xl font-semibold mb-4">Escaneie o QR Code</h2>
                      <div className="flex justify-center mb-4">
                        <img 
                          src={pixDataUrl ? pixDataUrl : `data:image/png;base64,${paymentData.pixQrCode}`}
                          alt="QR Code PIX"
                          className="w-64 h-64 border-2 border-gray-200 rounded-lg"
                        />
                      </div>
                      <p className="text-sm text-palette-mute">
                        Abra o app do seu banco e escaneie o código
                      </p>
                    </div>
                  )}

                  {/* Código PIX para cópia */}
                  {paymentData.pixCode && paymentData.status === 'WAITING_PAYMENT' && (
                    <div className="bg-palette-card p-6 rounded-lg shadow-md">
                      <h3 className="text-lg font-semibold mb-4">Ou copie o código PIX</h3>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={paymentData.pixCode}
                          readOnly
                          className="flex-1 p-3 border border-gray-300 rounded-lg bg-palette-fill text-sm dark:border-gray-600 dark:text-gray-300"
                        />
                        <button
                          onClick={copyPixCode}
                          className="bg-palette-primary text-palette-side px-4 py-3 rounded-lg hover:bg-palette-primary/90 transition-colors"
                        >
                          Copiar
                        </button>
                      </div>
                      <p className="text-xs text-palette-mute mt-2">
                        Cole este código no seu app de pagamento PIX
                      </p>
                    </div>
                  )}

                  {/* Instruções */}
                  <div className="bg-palette-fill p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Como pagar com PIX:</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Abra o app do seu banco ou carteira digital</li>
                      <li>Escolha a opção PIX</li>
                      <li>Escaneie o QR Code ou cole o código PIX</li>
                      <li>Confirme os dados e finalize o pagamento</li>
                      <li>Pronto! Você receberá a confirmação em instantes</li>
                    </ol>
                  </div>
                </>
              )}
            </div>

            {/* Coluna lateral - Resumo do pedido */}
            <div className="space-y-6">
              {/* Resumo do pedido */}
              <div className="bg-palette-card p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">Resumo do Pedido</h3>

                {/* Itens do pedido */}
                <div className="space-y-3 mb-6">
                  {(orderSummary?.items && orderSummary.items.length > 0 ? orderSummary.items : (cartItems && cartItems.length > 0 ? cartItems : [])).map((item: any) => (
                    <div key={item.id || item.slug?.current || item.productId || item.name} className="flex justify-between text-sm">
                      <span className="flex-1">
                        {item.name || item.productName || item.product?.name || 'Produto'} x {item.quantity || 1}
                      </span>
                      <span className="font-medium">R$ {Number(item.totalPrice || item.total || 0).toFixed(2)}</span>
                    </div>
                  ))}
                  {(!orderSummary?.items || orderSummary.items.length === 0) && (!cartItems || cartItems.length === 0) && (
                    <p className="text-palette-mute text-sm italic">Carregando itens do pedido...</p>
                  )}
                </div>

                <div className="border-t pt-4 mb-6">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>
                      R$ {Number(
                        orderSummary?.totalAmount ?? 
                        (orderSummary?.items?.reduce((sum: number, item: any) => sum + (item.totalPrice || item.total || 0), 0) || 0) ||
                        totalAmount || 0
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Endereço de entrega */}
              {shippingAddress && (
                <div className="bg-palette-card p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold mb-4">Endereço de Entrega</h3>
                  <div className="text-sm space-y-1">
                    <p>{shippingAddress.street}</p>
                    <p>{shippingAddress.city}, {shippingAddress.state}</p>
                    <p>CEP: {shippingAddress.postalCode}</p>
                    <p>{shippingAddress.country}</p>
                  </div>
                </div>
              )}

              {/* Botões de ação */}
              <div className="space-y-3">
                {paymentData?.status === 'WAITING_PAYMENT' && (
                  <button
                    onClick={checkPaymentStatus}
                    className="w-full bg-palette-secondary text-palette-side py-3 px-4 rounded-lg hover:bg-palette-secondary/90 transition-colors"
                  >
                    Verificar Pagamento
                  </button>
                )}

                <button
                  onClick={() => router.push('/cart')}
                  className="w-full border border-palette-primary text-palette-primary py-3 px-4 rounded-lg hover:bg-palette-primary hover:text-palette-side transition-colors"
                >
                  Voltar ao Carrinho
                </button>
              </div>
            </div>
          </div>
        </div>

        <Benefits />
      </div>
    </PrivateRoute>
  );
};

export default PaymentByIdPage;
