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
  const { id, installment } = router.query as { id?: string; installment?: string };

  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [pixDataUrl, setPixDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [orderId, setOrderId] = useState<string>('');
  const [shippingAddress, setShippingAddress] = useState<any>(null);
  const [orderSummary, setOrderSummary] = useState<any | null>(null);
  const [currentInstallment, setCurrentInstallment] = useState<number>(1); // 1 ou 2
  const lastFetchOrderRef = React.useRef<number>(0);
  const isCheckingPaymentRef = React.useRef<boolean>(false);
  const pollingIntervalRef = React.useRef<number>(15000); // Começa em 15s (15000ms)
  const pollingElapsedTimeRef = React.useRef<number>(0); // Tempo total decorrido

  const userInfo = useSelector((state: IUserInfoRootState) => state.userInfo.userInformation);
  const cartItems = useSelector((state: ICartRootState) => state.cart.items);
  const totalAmount = useSelector((state: ICartRootState) => state.cart.totalAmount);

  useEffect(() => {
    // Recuperar endereço selecionado (pode ter sido salvo antes)
    const savedAddress = localStorage.getItem('selectedShippingAddress');
    if (savedAddress) setShippingAddress(JSON.parse(savedAddress));

    // definir orderId quando disponível via rota
    if (id) {
      const idStr = Array.isArray(id) ? id[0] : id;
      setOrderId(idStr);
    }

    // Definir qual parcela exibir (padrão: 1)
    if (installment) {
      const instNum = parseInt(Array.isArray(installment) ? installment[0] : installment);
      if (instNum === 2) {
        setCurrentInstallment(2);
      }
    }
  }, [userInfo, id, installment]);

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
      // Polling exponencial: 15s → 30s → 60s → parar após 10 min
      const MAX_POLLING_TIME = 10 * 60 * 1000; // 10 minutos em ms
      
      const scheduleNextCheck = () => {
        // Verificar se já atingiu o tempo máximo
        if (pollingElapsedTimeRef.current >= MAX_POLLING_TIME) {
          console.log('[Payment Polling] Tempo máximo de polling atingido (10 minutos)');
          return;
        }

        // Agendar próxima verificação
        statusInterval = setTimeout(() => {
          checkPaymentStatus();
          
          // Atualizar tempo decorrido
          pollingElapsedTimeRef.current += pollingIntervalRef.current;
          
          // Aumentar intervalo exponencialmente (15s → 30s → 60s)
          if (pollingIntervalRef.current === 15000) {
            pollingIntervalRef.current = 30000; // 30s
          } else if (pollingIntervalRef.current === 30000) {
            pollingIntervalRef.current = 60000; // 60s
          }
          // Mantém 60s para as próximas verificações
          
          console.log(`[Payment Polling] Próxima verificação em ${pollingIntervalRef.current / 1000}s`);
          
          // Agendar próxima verificação recursivamente
          scheduleNextCheck();
        }, pollingIntervalRef.current);
      };

      // Primeira verificação após 15s
      scheduleNextCheck();
    }

    return () => {
      if (statusInterval) clearTimeout(statusInterval);
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

      // Definir endpoint e campos baseado em qual parcela
      let endpoint = '/payments/create';
      let respKey = 'installment1';
      let toastMsg = 'Pagamento PIX (Parcela 1/2) gerado com sucesso!';
      let titleMsg = 'Pagamento PIX - Parcela 1/2';

      if (currentInstallment === 2) {
        endpoint = '/payments/create-second';
        respKey = 'installment2';
        toastMsg = 'Pagamento PIX (Parcela 2/2) gerado com sucesso!';
        titleMsg = 'Pagamento PIX - Parcela 2/2';
      }

      const paymentDataReq: any = {
        orderId: orderIdParam,
        amount: totalAmount,
        currency: 'BRL',
        paymentMethod: 'PIX'
      };
      if (idempotencyKey) paymentDataReq.idempotencyKey = idempotencyKey;

      const paymentResponse = await api.post(endpoint, paymentDataReq);

      const respData = paymentResponse.data || {};
      const installmentData = respData[respKey] || {};
      const mp = respData.mp || {};

      let pixQrBase64: string | undefined = undefined;
      if (mp.qrBase64) {
        const raw = mp.qrBase64 as string;
        pixQrBase64 = raw.startsWith('data:') ? raw.split(',')[1] ?? raw : raw;
      } else if (installmentData?.mpQrCodeBase64) {
        const raw = installmentData.mpQrCodeBase64 as string;
        pixQrBase64 = raw.startsWith('data:') ? raw.split(',')[1] ?? raw : raw;
      }

      const rawStatus = installmentData?.status || 'PAYMENT_CREATED' || 'WAITING_PAYMENT';
      const normalizedStatus = ['PENDING', 'PAYMENT_CREATED'].includes(rawStatus) ? 'WAITING_PAYMENT' : rawStatus;

      // Usar o amount real da parcela do banco de dados (não dividir por 2)
      const installmentAmount = installmentData?.amount || (paymentDataReq.amount / 2);

      const paymentState: PaymentData = {
        id: (mp.id || installmentData?.mpPreferenceId || orderIdParam).toString(),
        status: normalizedStatus,
        pixCode: mp.qr || installmentData?.mpQrCodeUrl || undefined,
        pixQrCode: pixQrBase64,
        pixExpiresAt: installmentData?.expiresAt ? new Date(installmentData.expiresAt).toISOString() : undefined,
        amount: installmentAmount
      };

      // Resetar polling para novo pagamento
      pollingIntervalRef.current = 15000;
      pollingElapsedTimeRef.current = 0;

      setPaymentData(paymentState);
      // se a resposta trouxe o pedido local/upstream, usar para o resumo
      if (respData.order || respData.localOrder) {
        setOrderSummary(respData.order || respData.localOrder);
      }
      toast.success(toastMsg);
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
    // evitar chamadas duplicadas em menos de 5 segundos
    const now = Date.now();
    if (now - lastFetchOrderRef.current < 5000) {
      console.log('Pulando fetchOrderSummary — chamada recente');
      return;
    }
    lastFetchOrderRef.current = now;
    
    try {
      const res = await api.get(`/orders/${idToFetch}`);
      const payload = res.data || {};
      const resolved = payload.order || payload.localOrder || payload;
      
      if (resolved && (resolved.items || resolved.itemsJson)) {
        // Extrair items — podem estar em diferentes formatos
        const rawItems = resolved.items || resolved.itemsJson || [];
        const subtotal = resolved.subtotal ?? 0;
        const shippingCost = resolved.shippingCost ?? 0;
        const total = subtotal + shippingCost;
        
        // Normalizar items
        const normalizedItems = (rawItems || []).map((it: any) => ({
          id: it.id || it.productId,
          name: it.productName || it.product?.name || it.name || '',
          quantity: it.quantity || 1,
          price: it.unitPrice || it.price || 0,
          totalPrice: it.total ?? it.totalPrice ?? ((it.unitPrice || it.price || 0) * (it.quantity || 1)),
        }));
        
        setOrderSummary({ items: normalizedItems, subtotal, total, shippingCost });
        console.log('Order Summary carregado da API:', { items: normalizedItems, subtotal, total, shippingCost });
        return;
      }
    } catch (e) {
      console.warn('Falha ao buscar resumo do pedido da API:', e);
    }
    
    // Se a API falhar ou não retornar items, tentar localStorage como fallback
    try {
      const stored = JSON.parse(localStorage.getItem('createdOrder') || 'null');
      if (stored && (stored.items || stored.itemsJson)) {
        const subtotal = stored.subtotal ?? 0;
        const shippingCost = stored.shippingCost ?? 0;
        const total = subtotal + shippingCost;
        const rawItems = stored.items || stored.itemsJson || [];
        const normalizedItems = (rawItems || []).map((it: any) => ({
          id: it.id || it.productId,
          name: it.productName || it.product?.name || it.name || '',
          quantity: it.quantity || 1,
          price: it.unitPrice || it.price || 0,
          totalPrice: it.totalPrice ?? ((it.unitPrice || it.price || 0) * (it.quantity || 1)),
        }));
        setOrderSummary({ items: normalizedItems, subtotal, total, shippingCost });
        console.log('Order Summary carregado do localStorage:', { items: normalizedItems, subtotal, total, shippingCost });
        return;
      }
    } catch (fallbackErr) {
      console.warn('Fallback localStorage também falhou:', fallbackErr);
    }
    
    // Se tudo falhar mas temos cartItems do Redux, usar como última opção
    if (cartItems && cartItems.length > 0) {
      const subtotal = totalAmount;
      const shippingCost = 0;
      const total = subtotal + shippingCost;
      const normalizedItems = cartItems.map((item: any) => ({
        id: item.id || item.productId,
        name: item.productName || item.product?.name || item.name || '',
        quantity: item.quantity || 1,
        price: item.unitPrice || item.price || item.pricePerQuantity || 0,
        totalPrice: item.totalPrice ?? item.total ?? ((item.unitPrice || item.price || item.pricePerQuantity || 0) * (item.quantity || 1)),
      }));
      setOrderSummary({ items: normalizedItems, subtotal, total, shippingCost });
      console.log('Order Summary carregado do Redux cartItems:', { items: normalizedItems, subtotal, total, shippingCost });
    }
  };

  const checkPaymentStatus = async () => {
    if (!orderId || isCheckingPaymentRef.current) return;
    
    isCheckingPaymentRef.current = true;
    try {
      console.log(`[Payment Check] Verificando status para orderId: ${orderId}, installment: ${currentInstallment}`);
      
      // Usar endpoint correto baseado na parcela
      let statusEndpoint = `/payments/${orderId}/pix-status`;
      if (currentInstallment === 2) {
        statusEndpoint = `/payments/${orderId}/pix-status-second`;
      }

      const response = await api.get(statusEndpoint);
      console.log(`[Payment Check] Response:`, response.data);

      if (response.data.status === 'COMPLETED') {
        toast.success('Pagamento aprovado!');
        // Aguardar um pouco antes de redirecionar para garantir que os dados foram atualizados
        setTimeout(() => {
          router.push(`/order-status/${orderId}`);
        }, 150000);
      } else if (response.data.status === 'FAILED' || response.data.status === 'EXPIRED') {
        toast.error('Pagamento não foi aprovado');
        setPaymentData(prev => prev ? { ...prev, status: response.data.status } : null);
      } else {
        toast.info('Pagamento ainda não foi confirmado. Tente novamente em breve.');
      }
    } catch (error: any) {
      console.error('[Payment Check] Erro ao verificar status do pagamento:', error);
      toast.error('Erro ao verificar pagamento. Tente novamente.');
    } finally {
      isCheckingPaymentRef.current = false;
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
          <h1 className="text-3xl font-bold mb-8 text-center">
            Pagamento PIX - Parcela {currentInstallment}/2
          </h1>

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
                      <div className="mb-6 p-4 bg-palette-fill rounded-lg border-2 border-palette-primary">
                        <p className="text-sm text-palette-mute mb-1">Valor da Parcela</p>
                        <p className="text-3xl font-bold text-palette-primary">
                          R$ {Number(paymentData.amount).toFixed(2)}
                        </p>
                        <p className="text-xs text-palette-mute mt-1">Parcela {currentInstallment}/2</p>
                      </div>
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

                {/* Subtotal */}
                <div className="border-t pt-4 mb-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>
                      R$ {Number(
                        orderSummary?.subtotal ?? 
                        ((orderSummary?.items?.reduce((sum: number, item: any) => sum + (item.totalPrice || item.total || 0), 0) || 0) ||
                        totalAmount || 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Frete */}
                {orderSummary?.shippingCost && orderSummary.shippingCost > 0 && (
                  <div className="flex justify-between text-sm pb-2">
                    <span>Frete</span>
                    <span>R$ {Number(orderSummary.shippingCost).toFixed(2)}</span>
                  </div>
                )}

                {/* Total do Pedido */}
                <div className="border-t pt-4 mb-6">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total do Pedido</span>
                    <span>
                      R$ {Number(
                        orderSummary?.total ?? 
                        (((orderSummary?.subtotal ?? 0) + (orderSummary?.shippingCost ?? 0)) ||
                        totalAmount || 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Valor da Parcela */}
                {paymentData && (
                  <div className="bg-palette-primary/10 border-2 border-palette-primary rounded-lg p-4">
                    <p className="text-sm text-palette-mute mb-1">Você está pagando agora:</p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Parcela {currentInstallment}/2</span>
                      <span className="text-2xl font-bold text-palette-primary">
                        R$ {Number(paymentData.amount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
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
