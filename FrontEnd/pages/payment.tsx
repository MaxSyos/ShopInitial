import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from 'react-redux';
import { useLanguage } from '../hooks/useLanguage';
import { IUserInfoRootState } from '../lib/types/user';
import { ICartRootState } from '../lib/types/cart';
import { RootState, AppDispatch } from '../store';
import { toast } from 'react-toastify';
import api from '../lib/axiosClient';
import tokenStore from '../lib/tokenStore';
import Breadcrumb from '../components/UI/Breadcrumb';
import Benefits from '../components/Benefits';
import OrderTracking from '../components/cart/OrderTracking';
import PrivateRoute from '../components/auth/PrivateRoute';

interface PaymentData {
  id: string;
  status: string;
  pixCode?: string;
  pixQrCode?: string;
  pixExpiresAt?: string;
  amount: number;
}

const PaymentPage: React.FC = () => {
  const { t } = useLanguage();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [pixDataUrl, setPixDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [orderId, setOrderId] = useState<string>('');
  const [shippingAddress, setShippingAddress] = useState<any>(null);

  const userInfo = useSelector(
    (state: IUserInfoRootState) => state.userInfo.userInformation
  );
  const cartItems = useSelector((state: ICartRootState) => state.cart.items);
  const totalAmount = useSelector((state: ICartRootState) => state.cart.totalAmount);

  useEffect(() => {
    if (!userInfo) {
      router.push('/login?redirect=/payment');
      return;
    }
    
    if (cartItems.length === 0) {
      router.push('/cart');
      return;
    }

    // Recuperar endereço selecionado
    const savedAddress = localStorage.getItem('selectedShippingAddress');
    if (!savedAddress) {
      router.push('/shipping-address');
      return;
    }

    setShippingAddress(JSON.parse(savedAddress));
  }, [userInfo, cartItems, router]);


  
  useEffect(() => {
    // Se um pedido já foi criado na página de shipping-address, não criar novamente aqui.
    // Em vez disso, reutilizamos o pedido já criado e apenas geramos o pagamento.
    try {
      const saved = localStorage.getItem('createdOrder');
      if (saved) {
        const parsed = JSON.parse(saved);
        const existingId = parsed?.id || parsed;
        if (existingId) {
          setOrderId(existingId);
          // gerar apenas o pagamento para o pedido já criado
          createPaymentForOrder(existingId);
          return;
        }
      }
    } catch (e) {
      // ignorar parse errors e seguir para fluxo padrão
    }

    if (shippingAddress && !paymentData) {
      createOrder();
    }
  }, [shippingAddress]);

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
      }, 5000); // Verificar a cada 5 segundos
    }

    return () => {
      if (statusInterval) clearInterval(statusInterval);
    };
  }, [paymentData?.id, paymentData?.status]);

  // Gerar data URL do QR quando tivermos paymentData
  useEffect(() => {
    let cancelled = false;
    const generate = async () => {
      setPixDataUrl(null);
      if (!paymentData) return;

      // Se já vier a imagem em base64 (somente base64), monta o data URI
      if (paymentData.pixQrCode) {
        // caso já seja base64 puro
        setPixDataUrl(`data:image/png;base64,${paymentData.pixQrCode}`);
        return;
      }

      // Se vier apenas o payload (pixCode), tentar gerar imagem de QR no cliente
      if (paymentData.pixCode) {
        try {
          // tentar carregar a lib qrcode dinamicamente (se não estiver instalada, pegamos fallback)
          // @ts-ignore: may not be installed in dev environment
          const qrcode: any = await import('qrcode');
          if (cancelled) return;
          const dataUrl = await qrcode.toDataURL(paymentData.pixCode);
          if (!cancelled) setPixDataUrl(dataUrl as string);
          return;
        } catch (err) {
          // não consegui gerar (lib não instalada) — fallback: manter null e mostrar código
          if (!cancelled) setPixDataUrl(null);
          return;
        }
      }
    };

    generate();

    return () => { cancelled = true; };
  }, [paymentData]);

  const createOrder = async () => {
    setLoading(true);
    try {
      // 1. Criar o pedido
      const orderData = {
        shippingAddress,
        items: cartItems.map(item => ({
          productId: (item as any).id || item.slug?.current || item.name,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount || 0
        }))
      };

      // Prefer token from in-memory tokenStore (set at login). Fallback to localStorage userInfo.
      let token = tokenStore.getToken() || '';
      if (!token) {
        try {
          const ui = localStorage.getItem('userInfo');
          if (ui) token = JSON.parse(ui).accessToken || '';
        } catch (e) {}
      }
      // use internal axios client (with tokenStore interceptor) for API calls
      const orderResponse = await api.post('/orders', orderData);

      const newOrderId = orderResponse.data.id;
      setOrderId(newOrderId);
      // Gerar idempotencyKey para este fluxo de compra e armazenar junto com o pedido criado
      let idempotencyKey = '';
      try {
        // usar crypto.randomUUID quando disponível
        // @ts-ignore
        idempotencyKey = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
      } catch (e) {
        idempotencyKey = `id-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
      }

      // Armazenar o pedido criado e a chave de idempotência
      try { 
        localStorage.setItem('createdOrder', JSON.stringify({ id: newOrderId, idempotencyKey })); 
      } catch (e) {}

      // garantir que o endereço selecionado também esteja salvo (mesma chave usada em shipping-address)
      try {
        if (shippingAddress) localStorage.setItem('selectedShippingAddress', JSON.stringify(shippingAddress));
      } catch (e) { }

      // 2. Criar o pagamento PIX para o pedido recém-criado
      await createPaymentForOrder(newOrderId);
    } catch (error: any) {
      console.error('Erro ao criar pedido/pagamento:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPaymentForOrder = async (orderIdParam: string) => {
    if (!orderIdParam) return;
    // evitar chamadas concorrentes
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

      // A rota /api/payments/create retorna { order, mp: { id, qr, qrBase64 } }
      const respData = paymentResponse.data || {};
      const mp = respData.mp || {};

      // mp.qrBase64 pode vir prefixado com data:image..., normalizar
      let pixQrBase64: string | undefined = undefined;
      if (mp.qrBase64) {
        const raw = mp.qrBase64 as string;
        pixQrBase64 = raw.startsWith('data:') ? raw.split(',')[1] ?? raw : raw;
      } else if (respData.order && respData.order.mpQrCodeBase64) {
        const raw = respData.order.mpQrCodeBase64 as string;
        pixQrBase64 = raw.startsWith('data:') ? raw.split(',')[1] ?? raw : raw;
      }

      // Normalizar status: API usa 'PENDING' enquanto a UI espera 'WAITING_PAYMENT'
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
      toast.success('Pagamento PIX gerado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao gerar pagamento PIX:', error);
      // Mostrar mensagem amigável para o usuário
      const message = error?.response?.data?.error || error?.message || 'Erro ao gerar pagamento';
      toast.error(`Erro ao gerar pagamento PIX: ${message}`);
      // limpar estado de pagamento para evitar UI inconsistente
      setPaymentData(null);
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!paymentData?.id) return;

    try {
      // Prefer in-memory token when checking status
      const statusToken = tokenStore.getToken() || localStorage.getItem('token') || '';
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
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
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
                
                <div className="space-y-3 mb-6">
                  {cartItems.map((item) => (
                    <div key={(item as any).id || item.slug?.current || item.name} className="flex justify-between text-sm">
                      <span className="flex-1">{item.name} x {item.quantity}</span>
                      <span className="font-medium">R$ {Number(item.totalPrice || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 mb-6">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>R$ {Number(totalAmount || 0).toFixed(2)}</span>
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

export default PaymentPage;

