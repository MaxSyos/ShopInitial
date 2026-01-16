import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { MdCheckCircle } from 'react-icons/md';
import { HiChevronRight } from 'react-icons/hi';

interface OrderStatusBarProps {
  orderStatus: string;
  paymentStatus: string;
  isDelivered?: boolean;
}

const OrderStatusBar: React.FC<OrderStatusBarProps> = ({ orderStatus, paymentStatus, isDelivered = false }) => {
  const { t } = useLanguage();

  // Define os 4 passos do pedido
  const steps = [
    {
      id: 1,
      label: t['shippingAddress'] || 'Endereço',
      description: t['deliveryInformation'] || 'Informações de entrega',
      isCompleted: true, // Endereço é preenchido assim que o pedido é criado
    },
    {
      id: 2,
      label: t['payment'] || 'Pagamento',
      description: t['paymentMethod'] || 'Método de pagamento',
      isCompleted: paymentStatus === 'PAID' || paymentStatus === 'COMPLETED',
    },
    {
      id: 3,
      label: t['confirmation'] || 'Confirmação',
      description: t['orderReview'] || 'Revisão do pedido',
      isCompleted: paymentStatus === 'PAID' || paymentStatus === 'COMPLETED',
    },
    {
      id: 4,
      label: t['completed'] || 'Concluído',
      description: t['orderFinalized'] || 'Pedido finalizado',
      isCompleted: isDelivered === true,
    },
  ];

  const currentStep = steps.findIndex((step) => !step.isCompleted) + 1;

  return (
    <div className="bg-palette-card p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-6">Status do Pedido</h2>
      
      {/* Timeline dos passos */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* Step */}
            <div className="flex flex-col items-center flex-1 w-full md:w-auto">
              <div
                className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 mb-3 transition-all ${
                  step.isCompleted
                    ? 'bg-green-100 border-green-500 dark:bg-green-900/20 dark:border-green-400'
                    : step.id === currentStep
                    ? 'bg-blue-100 border-blue-500 dark:bg-blue-900/20 dark:border-blue-400'
                    : 'bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-600'
                }`}
              >
                {step.isCompleted ? (
                  <MdCheckCircle
                    size={24}
                    className="text-green-600 dark:text-green-400"
                  />
                ) : (
                  <span
                    className={`text-sm font-bold ${
                      step.id === currentStep
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {step.id}
                  </span>
                )}
              </div>

              {/* Texto do passo */}
              <div className="text-center">
                <p
                  className={`text-sm font-semibold ${
                    step.isCompleted
                      ? 'text-green-600 dark:text-green-400'
                      : step.id === currentStep
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-xs text-palette-mute whitespace-nowrap">
                  {step.description}
                </p>
              </div>
            </div>

            {/* Chevron separador (apenas entre passos, não no final) */}
            {index < steps.length - 1 && (
              <div className="hidden md:block mx-2 text-gray-400 dark:text-gray-600">
                <HiChevronRight size={24} />
              </div>
            )}

            {/* Linha conectora em mobile */}
            {index < steps.length - 1 && (
              <div
                className={`md:hidden w-1 h-8 ${
                  step.isCompleted ? 'bg-green-500 dark:bg-green-400' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Barra de progresso visual (opcional) */}
      <div className="mt-6">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 dark:bg-green-400 transition-all"
            style={{
              width: `${((steps.filter((s) => s.isCompleted).length) / steps.length) * 100}%`,
            }}
          />
        </div>
        <p className="text-xs text-palette-mute mt-2 text-center">
          {steps.filter((s) => s.isCompleted).length} de {steps.length} passos completos
        </p>
      </div>
    </div>
  );
};

export default OrderStatusBar;
