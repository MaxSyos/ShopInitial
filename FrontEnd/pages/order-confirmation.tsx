import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from 'react-redux';
import { useLanguage } from '../hooks/useLanguage';
import OrderTracking from '../components/cart/OrderTracking';
import { IUserInfoRootState } from '../lib/types/user';
import { ICartRootState } from '../lib/types/cart';
import { ShippingAddress } from '../store/order-slice';
import { toast } from 'react-toastify';
import Benefits from '../components/Benefits';
import Input from '../components/UI/Input';
import { fetchUserAddresses, addShippingAddress, createOrder } from '../store/order-slice';
import { RootState, AppDispatch } from '../store';

const OrderConfirmation: React.FC = () => {
  const { t } = useLanguage();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [step, setStep] = useState(1);
  const [newAddress, setNewAddress] = useState<ShippingAddress>({
    street: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    number: '',
    complement: '',
  });

  const userInfo = useSelector(
    (state: IUserInfoRootState) => state.userInfo.userInformation
  );
  const cartItems = useSelector((state: ICartRootState) => state.cart.items);
  const totalAmount = useSelector((state: ICartRootState) => state.cart.totalAmount);
  const { shippingAddresses = [], loading, error } = useSelector((state: RootState) => state.order);
  const [selectedAddress, setSelectedAddress] = useState<number>(-1);

  useEffect(() => {
    if (!userInfo) {
      router.push('/login?redirect=/order-confirmation');
      return;
    }
    
    if (cartItems.length === 0) {
      router.push('/cart');
      return;
    }

    dispatch(fetchUserAddresses());
  }, [userInfo, cartItems, dispatch, router]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleAddressSelect = (index: number) => {
    setSelectedAddress(index);
    setStep(2);
  };

  const handleAddNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();

    // Garante que todos os campos obrigatórios são strings e válidos
    const addressToSend = {
      street: String(newAddress.street || '').trim(),
      city: String(newAddress.city || '').trim(),
      state: String(newAddress.state || '').trim(),
      country: String(newAddress.country || '').trim(),
      postalCode: String(newAddress.postalCode || '').trim(),
      number: String(newAddress.number || '').trim(),
      complement: String(newAddress.complement || '').trim(),
      isDefault: !!newAddress.isDefault,
    };

    // Validação extra antes de enviar
    const isValid =
      addressToSend.street.length >= 3 && addressToSend.street.length <= 100 &&
      addressToSend.city.length >= 3 && addressToSend.city.length <= 100 &&
      addressToSend.state.length === 2 &&
      addressToSend.country.length >= 2 && addressToSend.country.length <= 100 &&
      addressToSend.postalCode.length === 8 &&
      addressToSend.number.length >= 1 && addressToSend.number.length <= 20 &&
      addressToSend.complement.length >= 1 && addressToSend.complement.length <= 100;

    if (!isValid) {
      toast.error('Preencha todos os campos obrigatórios corretamente.');
      return;
    }

    try {
      await dispatch(addShippingAddress(addressToSend)).unwrap();
      toast.success(t.addressAddedSuccess);
      setStep(2);
    } catch (error: any) {
      console.error('Erro ao adicionar endereço:', error);
      toast.error(error.message || t.addressAddError);
    }
  };

  const handleConfirmOrder = async () => {
    const selectedShippingAddress = selectedAddress >= 0 
      ? shippingAddresses[selectedAddress] 
      : newAddress;

    try {
      const orderData = {
        shippingAddress: selectedShippingAddress,
        items: cartItems.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount
        }))
      };

      const result = await dispatch(createOrder(orderData)).unwrap();
      toast.success(t.orderCreatedSuccess);
      router.push(`/order/${result.id}`);
    } catch (error: any) {
      toast.error(error.message || t.orderCreateError);
    }
  };

  const handleInputChange = (field: keyof ShippingAddress, value: any) => {
    setNewAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Validação dos campos obrigatórios
  const isAddressValid =
    newAddress.street.length >= 3 &&
    newAddress.city.length >= 3 &&
    newAddress.state.length === 2 &&
    newAddress.country.length >= 2 &&
    newAddress.postalCode.length === 8 &&
    newAddress.number.length >= 1 && newAddress.number.length <= 20 &&
    newAddress.complement.length >= 1 && newAddress.complement.length <= 100;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-palette-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <OrderTracking currentStep={step} />
      
      <div className="mt-8">
        {step === 1 && (
          <>
            <h2 className="text-2xl font-bold mb-6">{t.shippingAddress}</h2>
            
            {/* Lista de endereços salvos */}
            {Array.isArray(shippingAddresses) && shippingAddresses.length > 0 && (
              <div className="grid gap-4 mb-8">
                {shippingAddresses.map((address, index) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedAddress === index
                        ? 'border-palette-primary bg-palette-fill'
                        : 'border-gray-200 hover:border-palette-primary'
                    }`}
                    onClick={() => handleAddressSelect(index)}
                  >
                    <p className="font-medium">{address.street}</p>
                    <p className="text-sm text-gray-600">
                      {address.city}, {address.state} - {address.postalCode}
                    </p>
                    <p className="text-sm text-gray-600">{address.country}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Formulário de novo endereço */}
            <form onSubmit={handleAddNewAddress} className="w-full max-w-xl mx-auto bg-palette-card p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-6">{t.addNewAddress}</h3>
              
              <Input
                id="street"
                type="text"
                required
                value={newAddress.street}
                placeholder={t.street}
                classes={newAddress.street.length < 3 ? 'border-red-500' : ''}
                onInput={(e: React.FormEvent<HTMLInputElement>) => 
                  handleInputChange('street', (e.target as HTMLInputElement).value)
                }
              />
              {newAddress.street.length < 3 && (
                <p className="text-red-500 text-xs mt-1">{t.street} deve ter pelo menos 3 caracteres</p>
              )}

              <Input
                id="city"
                type="text"
                required
                value={newAddress.city}
                placeholder={t.city}
                classes={newAddress.city.length < 3 ? 'border-red-500' : ''}
                onInput={(e: React.FormEvent<HTMLInputElement>) => 
                  handleInputChange('city', (e.target as HTMLInputElement).value)
                }
              />
              {newAddress.city.length < 3 && (
                <p className="text-red-500 text-xs mt-1">{t.city} deve ter pelo menos 3 caracteres</p>
              )}

              <Input
                id="state"
                type="text"
                required
                value={newAddress.state}
                placeholder={t.state}
                minLength={2}
                maxLength={2}
                classes={newAddress.state.length !== 2 ? 'border-red-500' : ''}
                onInput={(e: React.FormEvent<HTMLInputElement>) => 
                  handleInputChange('state', (e.target as HTMLInputElement).value.toUpperCase().slice(0,2))
                }
              />
              {newAddress.state.length !== 2 && (
                <p className="text-red-500 text-xs mt-1">{t.state} deve ter 2 caracteres</p>
              )}

              <Input
                id="postalCode"
                type="text"
                required
                value={newAddress.postalCode}
                placeholder={t.postalCode}
                minLength={8}
                maxLength={8}
                classes={newAddress.postalCode.length !== 8 ? 'border-red-500' : ''}
                onInput={(e: React.FormEvent<HTMLInputElement>) => 
                  handleInputChange('postalCode', (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0,8))
                }
              />
              {newAddress.postalCode.length !== 8 && (
                <p className="text-red-500 text-xs mt-1">{t.postalCode} deve ter 8 caracteres</p>
              )}

              <Input
                id="number"
                type="text"
                required
                value={newAddress.number}
                placeholder={t.number || 'Número'}
                minLength={1}
                maxLength={20}
                classes={newAddress.number.length < 1 || newAddress.number.length > 20 ? 'border-red-500' : ''}
                onInput={(e: React.FormEvent<HTMLInputElement>) => 
                  handleInputChange('number', (e.target as HTMLInputElement).value)
                }
              />
              {(newAddress.number.length < 1 || newAddress.number.length > 20) && (
                <p className="text-red-500 text-xs mt-1">{t.number || 'Número'} deve ter entre 1 e 20 caracteres</p>
              )}

              <Input
                id="complement"
                type="text"
                required
                value={newAddress.complement}
                placeholder={t.complement || 'Complemento'}
                minLength={1}
                maxLength={100}
                classes={newAddress.complement.length < 1 || newAddress.complement.length > 100 ? 'border-red-500' : ''}
                onInput={(e: React.FormEvent<HTMLInputElement>) => 
                  handleInputChange('complement', (e.target as HTMLInputElement).value)
                }
              />
              {(newAddress.complement.length < 1 || newAddress.complement.length > 100) && (
                <p className="text-red-500 text-xs mt-1">{t.complement || 'Complemento'} deve ter entre 1 e 100 caracteres</p>
              )}

              <Input
                id="country"
                type="text"
                required
                value={newAddress.country}
                placeholder={t.country}
                classes={newAddress.country.length < 2 ? 'border-red-500' : ''}
                onInput={(e: React.FormEvent<HTMLInputElement>) => 
                  handleInputChange('country', (e.target as HTMLInputElement).value)
                }
              />
              {newAddress.country.length < 2 && (
                <p className="text-red-500 text-xs mt-1">{t.country} deve ter pelo menos 2 caracteres</p>
              )}

              <div className="flex items-center mb-4">
                <input
                  id="isDefault"
                  type="checkbox"
                  checked={!!newAddress.isDefault}
                  onChange={(e) => handleInputChange('isDefault', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="isDefault" className="text-sm">
                  {t.setAsDefault || 'Definir como endereço padrão'}
                </label>
              </div>

              <button 
                type="submit" 
                className="w-full bg-palette-primary text-palette-side py-3 px-4 rounded-lg mt-6 hover:bg-palette-primary/90 transition-colors"
                disabled={loading || !isAddressValid}
              >
                {loading ? t.processing : t.saveAddress}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">{t.orderSummary}</h2>
            
            {/* Resumo do pedido */}
            <div className="bg-palette-fill rounded-lg p-6">
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.name + item.price} className="flex justify-between">
                    <span>{item.name} x {item.quantity}</span>
                    <span>{item.totalPrice}</span>
                  </div>
                ))}
                <div className="border-t pt-4 font-bold">
                  <div className="flex justify-between">
                    <span>{t.total}</span>
                    <span>{totalAmount}</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleConfirmOrder}
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? t.processing : t.confirmOrder}
            </button>
          </div>
        )}
      </div>

      <Benefits />
    </div>
  );
};

export default OrderConfirmation;
