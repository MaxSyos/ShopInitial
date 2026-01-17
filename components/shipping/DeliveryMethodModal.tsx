import React, { useState } from 'react';
import { toast } from 'react-toastify';

interface DeliveryMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (isLocalPickup: boolean) => void;
  isLoading?: boolean;
}

const DeliveryMethodModal: React.FC<DeliveryMethodModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const [isLocalPickup, setIsLocalPickup] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(isLocalPickup);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-palette-card rounded-lg shadow-2xl max-w-lg w-full p-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-palette-text mb-2">💳 Forma de Pagamento</h2>
          <div className="h-1 w-16 bg-palette-primary rounded"></div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="bg-palette-fill p-4 rounded-lg border border-palette-border">
            <p className="text-palette-text leading-relaxed">
              O pagamento é realizado em duas etapas:
            </p>
            <ul className="mt-3 space-y-2 text-palette-text">
              <li className="flex items-start gap-3">
                <span className="text-palette-primary font-bold">1️⃣</span>
                <span>Uma entrada será cobrada no momento do pedido</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-palette-primary font-bold">2️⃣</span>
                <span>O restante será cobrado na retirada do produto</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-palette-primary font-bold">📦</span>
                <span>No momento da retirada, será adicionado o valor do envio</span>
              </li>
            </ul>
          </div>

          {/* Local Pickup Option */}
          <div className="border-2 border-palette-border rounded-lg p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isLocalPickup}
                onChange={(e) => setIsLocalPickup(e.target.checked)}
                className="w-5 h-5 rounded border-palette-border cursor-pointer accent-palette-primary"
              />
              <span className="text-palette-text font-medium">
                Desejo retirar pessoalmente na loja 🏪
              </span>
            </label>
            {isLocalPickup && (
              <p className="text-sm text-palette-mute ml-8 bg-palette-fill p-2 rounded">
                ✓ Sua entrega será marcada como local (sem rastreamento)
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-palette-border">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg border border-palette-border text-palette-text hover:bg-palette-fill transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg bg-palette-primary text-palette-side font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? 'Processando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryMethodModal;
