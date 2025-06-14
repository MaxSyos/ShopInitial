import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { Address } from '../../lib/types/address';
import Input from '../UI/Input';
import { toast } from 'react-toastify';

interface AddressFormProps {
  savedAddresses?: Address[];
  onSubmit: (address: Address) => void;
  isLoading?: boolean;
}

const AddressForm: React.FC<AddressFormProps> = ({ savedAddresses, onSubmit, isLoading }) => {
  const { t } = useLanguage();
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState<Address>({
    street: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    isDefault: false,
  });

  useEffect(() => {
    if (savedAddresses?.length && savedAddresses[0]) {
      const defaultAddress = savedAddresses.find(addr => addr.isDefault) || savedAddresses[0];
      setSelectedAddress(defaultAddress);
      setFormData(defaultAddress);
    }
  }, [savedAddresses]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.street || !formData.city || !formData.state || !formData.country || !formData.postalCode) {
      toast.error(t.FillAllFields || 'Por favor, preencha todos os campos');
      return;
    }
    onSubmit(formData);
  };

  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
    setFormData(address);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {savedAddresses && savedAddresses.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">{t.SavedAddresses || 'Endereços Salvos'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedAddresses.map((address) => (
              <div
                key={address.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors
                  ${selectedAddress?.id === address.id 
                    ? 'border-palette-primary bg-palette-card/10' 
                    : 'border-gray-200 hover:border-palette-primary'
                  }`}
                onClick={() => handleAddressSelect(address)}
              >
                <p className="font-medium">{address.street}</p>
                <p className="text-sm text-gray-600">
                  {address.city}, {address.state}
                </p>
                <p className="text-sm text-gray-600">
                  {address.country}, {address.postalCode}
                </p>
                {address.isDefault && (
                  <span className="inline-block mt-2 text-xs bg-palette-primary/20 text-palette-primary px-2 py-1 rounded">
                    {t.DefaultAddress || 'Endereço Padrão'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          name="street"
          value={formData.street}
          onChange={handleChange}
          placeholder={t.Street || 'Rua'}
          required
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder={t.City || 'Cidade'}
            required
          />
          <Input
            name="state"
            value={formData.state}
            onChange={handleChange}
            placeholder={t.State || 'Estado'}
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            name="country"
            value={formData.country}
            onChange={handleChange}
            placeholder={t.Country || 'País'}
            required
          />
          <Input
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            placeholder={t.PostalCode || 'CEP'}
            required
          />
        </div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="isDefault"
            checked={formData.isDefault}
            onChange={handleChange}
            className="form-checkbox text-palette-primary"
          />
          <span>{t.SetAsDefault || 'Definir como endereço padrão'}</span>
        </label>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-palette-primary text-white px-6 py-2 rounded-md hover:bg-palette-dark 
              transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading 
              ? t.Saving || 'Salvando...'
              : t.ConfirmAddress || 'Confirmar Endereço'
            }
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddressForm;
