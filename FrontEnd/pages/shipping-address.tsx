import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from 'react-redux';
import { useLanguage } from '../hooks/useLanguage';
import { IUserInfoRootState } from '../lib/types/user';
import { ICartRootState } from '../lib/types/cart';
import { ShippingAddress, fetchUserAddresses, addShippingAddress } from '../store/order-slice';
import { RootState, AppDispatch } from '../store';
import { toast } from 'react-toastify';
import Breadcrumb from '../components/UI/Breadcrumb';
import Input from '../components/UI/Input';
import Benefits from '../components/Benefits';
import OrderTracking from '../components/cart/OrderTracking';
import PrivateRoute from '../components/auth/PrivateRoute';

const ShippingAddressPage: React.FC = () => {
  const { t } = useLanguage();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(-1);
  const [showNewAddressForm, setShowNewAddressForm] = useState<boolean>(false);
  const [newAddress, setNewAddress] = useState<ShippingAddress & { number: string; complement: string; isDefault: boolean }>({
    street: '',
    number: '',
    complement: '',
    city: '',
    state: '',
    country: 'Brasil',
    postalCode: '',
    isDefault: false,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const userInfo = useSelector(
    (state: IUserInfoRootState) => state.userInfo.userInformation
  );
  const cartItems = useSelector((state: ICartRootState) => state.cart.items);
  const totalAmount = useSelector((state: ICartRootState) => state.cart.totalAmount);
  const { shippingAddresses = [], loading, error } = useSelector((state: RootState) => state.order);

  useEffect(() => {
    if (!userInfo) {
      router.push('/login?redirect=/shipping-address');
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
    setSelectedAddressIndex(index);
    setShowNewAddressForm(false);
  };

  const handleNewAddressClick = () => {
    setShowNewAddressForm(true);
    setSelectedAddressIndex(-1);
  };

  const handleInputChange = (field: keyof typeof newAddress, value: string | boolean) => {
    setNewAddress(prev => ({
      ...prev,
      [field]: value,
    }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleCepChange = async (cep: string) => {
    setNewAddress(prev => ({ ...prev, postalCode: cep }));
    
    // Remover caracteres não numéricos
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setNewAddress(prev => ({
            ...prev,
            street: data.logradouro || prev.street,
            city: data.localidade || prev.city,
            state: data.uf || prev.state,
            country: 'Brasil'
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };

  const validateAddress = () => {
    const newErrors: { [key: string]: string } = {};
    if (!newAddress.street || typeof newAddress.street !== 'string') newErrors.street = 'Rua obrigatória';
    if (!newAddress.number || typeof newAddress.number !== 'string') newErrors.number = 'Número obrigatório';
    if (!newAddress.city || typeof newAddress.city !== 'string') newErrors.city = 'Cidade obrigatória';
    if (!newAddress.state || typeof newAddress.state !== 'string') newErrors.state = 'Estado obrigatório';
    if (!newAddress.country || typeof newAddress.country !== 'string') newErrors.country = 'País obrigatório';
    if (!newAddress.postalCode || typeof newAddress.postalCode !== 'string') newErrors.postalCode = 'CEP obrigatório';
    // complement pode ser opcional
    return newErrors;
  };

  const handleSaveNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateAddress();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Preencha todos os campos obrigatórios corretamente.');
      return;
    }
    try {
      await dispatch(addShippingAddress({
        ...newAddress,
        street: String(newAddress.street),
        number: String(newAddress.number),
        complement: String(newAddress.complement || ''),
        city: String(newAddress.city),
        state: String(newAddress.state),
        country: String(newAddress.country),
        postalCode: String(newAddress.postalCode),
        isDefault: Boolean(newAddress.isDefault),
      })).unwrap();
      toast.success('Endereço adicionado com sucesso!');
      setShowNewAddressForm(false);
      setSelectedAddressIndex(shippingAddresses.length);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao adicionar endereço');
    }
  };

  const handleContinueToPayment = () => {
    const selectedAddress = selectedAddressIndex >= 0 
      ? shippingAddresses[selectedAddressIndex] 
      : newAddress;

    if (!selectedAddress.street || !selectedAddress.city || !selectedAddress.postalCode) {
      toast.error('Por favor, selecione ou preencha um endereço válido');
      return;
    }

    // Salvar endereço selecionado no localStorage para usar na próxima etapa
    localStorage.setItem('selectedShippingAddress', JSON.stringify(selectedAddress));
    router.push('/payment');
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
        
        <OrderTracking currentStep={1} />
        
        <div className="mt-8">
          <h1 className="text-3xl font-bold mb-8 text-center">Endereço de Entrega</h1>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Coluna principal - Endereços */}
            <div className="lg:col-span-2">
              {/* Endereços salvos */}
              {Array.isArray(shippingAddresses) && shippingAddresses.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">Endereços Salvos</h2>
                  <div className="grid gap-4">
                    {shippingAddresses.map((address, index) => (
                      <div
                        key={index}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedAddressIndex === index
                            ? 'border-palette-primary bg-palette-fill shadow-lg'
                            : 'border-gray-200 hover:border-palette-primary hover:shadow-md'
                        }`}
                        onClick={() => handleAddressSelect(index)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-palette-base">{address.street}</p>
                            <p className="text-sm text-palette-mute">
                              {address.city}, {address.state} - CEP: {address.postalCode}
                            </p>
                            <p className="text-sm text-palette-mute">{address.country}</p>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            selectedAddressIndex === index 
                              ? 'bg-palette-primary border-palette-primary' 
                              : 'border-gray-300'
                          }`}>
                            {selectedAddressIndex === index && (
                              <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botão para adicionar novo endereço */}
              <div className="mb-8">
                <button
                  onClick={handleNewAddressClick}
                  className={`w-full p-4 border-2 border-dashed rounded-lg transition-all duration-200 ${
                    showNewAddressForm
                      ? 'border-palette-primary bg-palette-fill'
                      : 'border-gray-300 hover:border-palette-primary'
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <span className="text-2xl mr-2">+</span>
                    <span className="font-medium">Adicionar Novo Endereço</span>
                  </div>
                </button>
              </div>

              {/* Formulário de novo endereço */}
              {showNewAddressForm && (
                <div className="bg-palette-card p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold mb-6">Novo Endereço</h3>
                  
                  <form onSubmit={handleSaveNewAddress} className="space-y-4">
                    <Input
                      id="postalCode"
                      type="text"
                      required
                      value={newAddress.postalCode}
                      placeholder="CEP"
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      classes={errors.postalCode ? 'border-red-500' : ''}
                    />
                    {errors.postalCode && <span className="text-red-500 text-xs">{errors.postalCode}</span>}
                    <Input
                      id="street"
                      type="text"
                      required
                      value={newAddress.street}
                      placeholder="Rua"
                      onChange={(e) => handleInputChange('street', e.target.value)}
                      classes={errors.street ? 'border-red-500' : ''}
                    />
                    {errors.street && <span className="text-red-500 text-xs">{errors.street}</span>}
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        id="number"
                        type="text"
                        required
                        value={newAddress.number}
                        placeholder="Número"
                        onChange={(e) => handleInputChange('number', e.target.value)}
                        classes={errors.number ? 'border-red-500' : ''}
                      />
                      {errors.number && <span className="text-red-500 text-xs block md:col-span-2">{errors.number}</span>}
                      <Input
                        id="complement"
                        type="text"
                        value={newAddress.complement}
                        placeholder="Complemento (opcional)"
                        onChange={(e) => handleInputChange('complement', e.target.value)}
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        id="city"
                        type="text"
                        required
                        value={newAddress.city}
                        placeholder="Cidade"
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        classes={errors.city ? 'border-red-500' : ''}
                      />
                      <Input
                        id="state"
                        type="text"
                        required
                        value={newAddress.state}
                        placeholder="Estado"
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        classes={errors.state ? 'border-red-500' : ''}
                      />
                    </div>
                    <Input
                      id="country"
                      type="text"
                      required
                      value={newAddress.country}
                      placeholder="País"
                      readonly
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      classes={errors.country ? 'border-red-500' : ''}
                    />
                    <div className="flex items-center gap-2">
                      <input
                        id="isDefault"
                        type="checkbox"
                        checked={newAddress.isDefault}
                        onChange={(e) => handleInputChange('isDefault', e.target.checked)}
                      />
                      <label htmlFor="isDefault">Definir como endereço padrão</label>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-palette-primary text-palette-side py-3 px-4 rounded-lg mt-6 hover:bg-palette-primary/90 transition-colors"
                      disabled={loading}
                    >
                      {loading ? 'Salvando...' : 'Salvar Endereço'}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Coluna lateral - Resumo do pedido */}
            <div className="lg:col-span-1">
              <div className="bg-palette-card p-6 rounded-lg shadow-md sticky top-8">
                <h3 className="text-xl font-semibold mb-4">Resumo do Pedido</h3>
                
                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="flex-1">{item.title} x {item.quantity}</span>
                      <span className="font-medium">R$ {item.totalPrice}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 mb-6">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>R$ {totalAmount}</span>
                  </div>
                </div>

                <button
                  onClick={handleContinueToPayment}
                  className="w-full bg-palette-primary text-palette-side py-3 px-4 rounded-lg hover:bg-palette-primary/90 transition-colors"
                  disabled={selectedAddressIndex === -1 && !showNewAddressForm}
                >
                  Continuar para Pagamento
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

export default ShippingAddressPage;

