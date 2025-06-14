import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';

interface OrderTrackingProps {
  orderId?: string;
  currentStep?: number;
  status?: 'placed' | 'paid' | 'shipped' | 'inProgress' | 'toRate';
  date?: string;
  amount?: number;
}

const OrderTracking: React.FC<OrderTrackingProps> = ({ 
  orderId, 
  currentStep = 1, 
  status, 
  date, 
  amount 
}) => {
  const { t } = useLanguage();

  // Steps para o fluxo de confirmação de pedido
  const confirmationSteps = [
    { key: 'address', icon: '📍', label: t.address || 'Endereço' },
    { key: 'review', icon: '📋', label: t.review || 'Revisão' },
    { key: 'payment', icon: '💳', label: t.payment || 'Pagamento' },
  ];

  // Steps para o rastreamento do pedido
  const trackingSteps = [
    { key: 'placed', icon: '📋', label: t.OrderPlaced || 'Pedido Realizado' },
    { key: 'paid', icon: '💳', label: t.OrderPaid || 'Pedido Pago' },
    { key: 'shipped', icon: '🚚', label: t.OrderShipped || 'Pedido Enviado' },
    { key: 'inProgress', icon: '📦', label: t.InProgress || 'A Caminho' },
    { key: 'toRate', icon: '⭐', label: t.ToRate || 'A Avaliar' },
  ];

  // Define quais steps usar baseado se é confirmação ou rastreamento
  const steps = orderId ? trackingSteps : confirmationSteps;

  const getStepStatus = (index: number) => {
    if (orderId) {
      // Lógica para pedido já existente
      const statusOrder = ['placed', 'paid', 'shipped', 'inProgress', 'toRate'];
      const currentIndex = statusOrder.indexOf(status || 'placed');
      if (index < currentIndex) return 'completed';
      if (index === currentIndex) return 'current';
      return 'pending';
    } else {
      // Lógica para confirmação de pedido
      if (index + 1 < currentStep) return 'completed';
      if (index + 1 === currentStep) return 'current';
      return 'pending';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-palette-card p-6 rounded-lg shadow-lg">
      {orderId && (
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => window.history.back()}
            className="text-palette-primary hover:text-palette-primary/80"
          >
            ← {t.VOLTAR}
          </button>
          <div className="text-right">
            <p className="text-palette-mute">{t.OrderID || 'ID DO PEDIDO'}: {orderId}</p>
            <p className="text-palette-success">{t.OrderInProgress || 'SEU PEDIDO ESTÁ A CAMINHO'}</p>
          </div>
        </div>
      )}

      <div className="relative">
        <div className="flex justify-between items-center">
          {steps.map((step, index) => (
            <div key={step.key} className="flex flex-col items-center relative flex-1">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl
                  ${getStepStatus(index) === 'completed' ? 'bg-palette-primary text-palette-side' : 
                    getStepStatus(index) === 'current' ? 'bg-palette-primary/80 text-palette-side' : 
                    'bg-gray-200 text-gray-500'}`}
              >
                {step.icon}
              </div>
              <p className="mt-2 text-sm text-center">{step.label}</p>

              {/* Linha conectora */}
              {index < steps.length - 1 && (
                <div className="absolute left-1/2 w-full h-1 top-6">
                  <div
                    className={`h-full ${
                      getStepStatus(index) === 'completed'
                        ? 'bg-palette-primary'
                        : 'bg-gray-200'
                    }`}
                  ></div>
                </div>
              )}
            </div>
          ))}
        </div>

        {orderId && date && (
          <div className="mt-6 text-center text-palette-mute">
            <p>{t.OrderDate || 'Data do Pedido'}: {date}</p>
            {amount && <p>{t.OrderAmount || 'Valor do Pedido'}: R$ {amount.toFixed(2)}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTracking;
