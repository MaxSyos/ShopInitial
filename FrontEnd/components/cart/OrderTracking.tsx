import React from 'react';

interface OrderTrackingProps {
  currentStep: number;
  steps?: Array<{
    id: number;
    title: string;
    description: string;
  }>;
}

const OrderTracking: React.FC<OrderTrackingProps> = ({ 
  currentStep, 
  steps = [
    { id: 1, title: 'Endereço', description: 'Informações de entrega' },
    { id: 2, title: 'Pagamento', description: 'Método de pagamento' },
    { id: 3, title: 'Confirmação', description: 'Revisão do pedido' },
    { id: 4, title: 'Concluído', description: 'Pedido finalizado' }
  ]
}) => {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step.id <= currentStep
                    ? 'bg-palette-primary text-palette-side'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step.id <= currentStep ? (
                  step.id < currentStep ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    step.id
                  )
                ) : (
                  step.id
                )}
              </div>
              <div className="mt-2 text-center">
                <p
                  className={`text-sm font-medium ${
                    step.id <= currentStep ? 'text-palette-primary' : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </p>
                <p className="text-xs text-palette-mute hidden sm:block">
                  {step.description}
                </p>
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-4 transition-colors ${
                  step.id < currentStep ? 'bg-palette-primary' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default OrderTracking;

