import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from 'react-redux';
import { useLanguage } from '../hooks/useLanguage';
import { IUserInfoRootState } from '../lib/types/user';
import { ICartRootState } from '../lib/types/cart';
import { ShippingAddress, fetchUserAddresses, addShippingAddress, deleteShippingAddress } from '../store/order-slice';
import { cartActions } from '../store/cart-slice';
import { userInfoActions } from '../store/user-slice';
import { RootState, AppDispatch } from '../store';
import { toast } from 'react-toastify';
import Breadcrumb from '../components/UI/Breadcrumb';
import Input from '../components/UI/Input';
import Benefits from '../components/Benefits';
import OrderTracking from '../components/cart/OrderTracking';
import PrivateRoute from '../components/auth/PrivateRoute';
import DeliveryMethodModal from '../components/shipping/DeliveryMethodModal';
import api from '../lib/axiosClient';
import { maskCPF, maskWhatsApp, isValidCPFFormat, isValidWhatsAppFormat } from '../utilities/masks';

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

  // Estados para campos faltando do perfil
  const [missingProfileFields, setMissingProfileFields] = useState<string[]>([]);
  const [profileFieldValues, setProfileFieldValues] = useState({ name: '', cpf: '', whatsapp: '' });
  const [savingProfileFields, setSavingProfileFields] = useState(false);
  const [profileFieldErrors, setProfileFieldErrors] = useState<{ [key: string]: string }>({});
  const [userDataLoaded, setUserDataLoaded] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const userInfo = useSelector(
    (state: IUserInfoRootState) => state.userInfo.userInformation
  );
  const hasCpf = !!(userInfo && userInfo.cpf && String(userInfo.cpf).trim() !== '');
  const hasWhatsapp = !!(userInfo && userInfo.whatsapp && String(userInfo.whatsapp).trim() !== '');
  const showMissingProfileSection = missingProfileFields.length > 0 && !(hasCpf && hasWhatsapp);
  // determinar se o nome realmente precisa ser solicitado (baseado no userInfo atual)
  const requireName = !userInfo || !userInfo.name || String(userInfo.name).trim() === '';
  const cartItems = useSelector((state: ICartRootState) => state.cart.items);
  const totalAmount = useSelector((state: ICartRootState) => state.cart.totalAmount);
  const { shippingAddresses = [], loading, error } = useSelector((state: RootState) => state.order);

  // Verificar se todos os campos obrigatórios estão preenchidos
  const areAllProfileFieldsFilled = hasCpf && hasWhatsapp && (userInfo?.name && String(userInfo.name).trim() !== '');
  const isAddressSelected = selectedAddressIndex >= 0;
  const canProceedToPayment = areAllProfileFieldsFilled && isAddressSelected;

  useEffect(() => {
    if (!userInfo) {
      router.push('/login?redirect=/shipping-address');
      return;
    }
    
    if (cartItems.length === 0) {
      router.push('/cart');
      return;
    }

    // Carregar dados do usuário apenas uma vez na primeira montagem
    if (userDataLoaded) {
      return;
    }

    // Buscar dados mais recentes do usuário no backend para decidir quais campos faltam
    const loadUser = async () => {
      try {
        const resp = await api.get('/auth/me');
        const serverUser = resp?.data?.user || userInfo || {};
        const missing: string[] = [];
        if (!serverUser.name || String(serverUser.name).trim() === '') missing.push('name');
        if (!serverUser.cpf) missing.push('cpf');
        if (!serverUser.whatsapp) missing.push('whatsapp');

        // Sincronizar os dados do servidor com Redux para garantir que hasCpf e hasWhatsapp sejam verdadeiros
        if (serverUser.cpf || serverUser.whatsapp || serverUser.name) {
          dispatch(userInfoActions.updateUserInfo({
            cpf: serverUser.cpf,
            whatsapp: serverUser.whatsapp,
            name: serverUser.name
          }));
        }

        setMissingProfileFields(missing);
        setProfileFieldValues({
          name: serverUser.name || '',
          cpf: serverUser.cpf || '',
          whatsapp: serverUser.whatsapp || ''
        });

        // Marcar que os dados foram carregados para evitar loop infinito
        setUserDataLoaded(true);
      } catch (err) {
        // fallback para dados locais
        const missing: string[] = [];
        if (!userInfo.name || String(userInfo.name).trim() === '') missing.push('name');
        if (!userInfo.cpf) missing.push('cpf');
        if (!userInfo.whatsapp) missing.push('whatsapp');
        setMissingProfileFields(missing);
        setProfileFieldValues({
          name: userInfo.name || '',
          cpf: userInfo.cpf || '',
          whatsapp: userInfo.whatsapp || ''
        });
        
        // Marcar que os dados foram carregados mesmo em caso de erro
        setUserDataLoaded(true);
      }
    };

    loadUser();

    dispatch(fetchUserAddresses());
  }, []);

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

  const handleDeleteAddress = async (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const addressToDelete = shippingAddresses[index] as any;
    if (!addressToDelete || !addressToDelete.id) {
      toast.error('Endereço inválido para deleção');
      return;
    }

    if (!window.confirm('Tem certeza que deseja deletar este endereço?')) return;

    try {
      await dispatch(deleteShippingAddress(addressToDelete.id)).unwrap();
      toast.success('Endereço deletado com sucesso');
      if (selectedAddressIndex === index) setSelectedAddressIndex(-1);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao deletar endereço');
    }
  };

  const handleProfileFieldChange = (field: 'name' | 'cpf' | 'whatsapp', value: string) => {
    let formattedValue = value;
    
    if (field === 'cpf') {
      formattedValue = maskCPF(value);
    } else if (field === 'whatsapp') {
      // Preferir máscara sem country code no input (começando pelo DDD)
      formattedValue = maskWhatsApp(value, false);
    }
    
    setProfileFieldValues(prev => ({
      ...prev,
      [field]: formattedValue
    }));
    setProfileFieldErrors(prev => ({ ...prev, [field]: '' }));
  };

  // Valida apenas os campos que serão atualizados (se providedFields for informado)
  const validateProfileFields = (providedFields?: string[]) => {
    const errors: { [key: string]: string } = {};

    const shouldValidate = (field: string) => {
      if (!providedFields) return true; // validar tudo (fallback)
      return providedFields.includes(field);
    };

    const requireName = !userInfo || !userInfo.name || String(userInfo.name).trim() === '';
    if (requireName && shouldValidate('name')) {
      if (!profileFieldValues.name || profileFieldValues.name.trim() === '') {
        errors.name = 'Nome é obrigatório';
      }
    }

    if (shouldValidate('cpf')) {
      if (!profileFieldValues.cpf) {
        errors.cpf = 'CPF é obrigatório';
      } else if (!isValidCPFFormat(profileFieldValues.cpf)) {
        errors.cpf = 'CPF inválido. Deve conter 11 dígitos';
      }
    }

    if (shouldValidate('whatsapp')) {
      if (!profileFieldValues.whatsapp) {
        errors.whatsapp = 'WhatsApp é obrigatório';
      } else if (!isValidWhatsAppFormat(profileFieldValues.whatsapp)) {
        errors.whatsapp = 'WhatsApp inválido. Deve conter 11 ou 13 dígitos';
      }
    }

    return errors;
  };

  const handleSaveProfileFields = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construir payload: o endpoint exige `name`, então sempre enviar (usar userInfo.name quando não houver alteração)
    const updateData: any = {};
    // prefer profileFieldValues.name quando fornecido, senão usar userInfo.name (se existir)
    updateData.name = (profileFieldValues.name && profileFieldValues.name.trim() !== '') ? profileFieldValues.name : (userInfo?.name || '');
    if (missingProfileFields.includes('cpf')) {
      updateData.cpf = profileFieldValues.cpf;
    }
    if (missingProfileFields.includes('whatsapp')) {
      updateData.whatsapp = profileFieldValues.whatsapp;
    }

    // Validar somente os campos que vamos enviar
    const errors = validateProfileFields(Object.keys(updateData));
    if (Object.keys(errors).length > 0) {
      setProfileFieldErrors(errors);
      toast.error('Preencha todos os campos obrigatórios corretamente.');
      return;
    }

    setSavingProfileFields(true);
    try {
      await api.put('/auth/update', updateData);
      toast.success('Dados do perfil atualizados com sucesso!');
      
      // Atualizar o Redux com os novos dados
      dispatch(userInfoActions.updateUserInfo(updateData));
      
      setMissingProfileFields([]); // Limpar campos faltando após salvar
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || 'Erro ao salvar dados do perfil';
      toast.error(errorMsg);
      console.error('Erro ao atualizar perfil:', error);
    } finally {
      setSavingProfileFields(false);
    }
  };

  const handleInputChange = (field: keyof typeof newAddress, value: string | boolean) => {
    setNewAddress(prev => ({
      ...prev,
      [field]: value,
    }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const formatCepMask = (digits: string) => {
    if (!digits) return '';
    const d = digits.replace(/\D/g, '');
    if (d.length <= 5) return d;
    return `${d.slice(0,5)}-${d.slice(5,8)}`;
  };

  const handleCepChange = async (cep: string) => {
    // Format cep visually as XXXXX-XXX while keeping digits for API
    const cleanCep = String(cep || '').replace(/\D/g, '');
    const masked = formatCepMask(cleanCep);
    setNewAddress(prev => ({ ...prev, postalCode: masked }));

    if (cleanCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();

        if (!data.erro) {
          setNewAddress(prev => ({
            ...prev,
            postalCode: formatCepMask(cleanCep),
            street: data.logradouro || prev.street,
            number: prev.number,
            complement: data.complemento || prev.complement,
            city: data.localidade || prev.city,
            state: data.uf || prev.state,
            country: 'BR'
          }));
          toast.success('Endereço preenchido automaticamente pelo CEP');
        } else {
          toast.error('CEP não encontrado. Verifique e tente novamente.');
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        toast.error('Erro ao buscar CEP. Tente novamente.');
      }
    }
  };

  const validateAddress = () => {
    const newErrors: { [key: string]: string } = {};
    if (!newAddress.street || typeof newAddress.street !== 'string') newErrors.street = 'Rua obrigatória';
    if (!newAddress.number || typeof newAddress.number !== 'string') newErrors.number = 'Número obrigatório';
    if (!newAddress.city || typeof newAddress.city !== 'string') newErrors.city = 'Cidade obrigatória';
    if (!newAddress.state || typeof newAddress.state !== 'string') newErrors.state = 'Estado obrigatório';
    else if ((newAddress.state || '').length !== 2) newErrors.state = 'Estado deve ter 2 caracteres (ex: SP)';
    if (!newAddress.country || typeof newAddress.country !== 'string') newErrors.country = 'País obrigatório';
    // postalCode deve ter 8 dígitos (CEP sem máscara)
    const cleanCep = String(newAddress.postalCode || '').replace(/\D/g, '');
    if (!cleanCep || cleanCep.length !== 8) newErrors.postalCode = 'CEP inválido (8 dígitos)';
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
      // Normalizar alguns campos antes do envio
      const cleanPostal = String(newAddress.postalCode).replace(/\D/g, '');
      const payload = {
        ...newAddress,
        street: String(newAddress.street),
        number: String(newAddress.number),
        complement: String(newAddress.complement || ''),
        city: String(newAddress.city),
        state: String(newAddress.state).toUpperCase(),
        country: 'BR',
        postalCode: cleanPostal,
        isDefault: Boolean(newAddress.isDefault),
      };

      await dispatch(addShippingAddress(payload)).unwrap();
      toast.success('Endereço adicionado com sucesso!');
      
      // Recarregar endereços do servidor para garantir sincronização
      const updatedAddresses = await dispatch(fetchUserAddresses()).unwrap();
      
      setShowNewAddressForm(false);
      // Selecionar automaticamente o novo endereço (será o último da lista)
      setSelectedAddressIndex(updatedAddresses.length - 1);
      
      // Resetar o formulário
      setNewAddress({
        street: '',
        number: '',
        complement: '',
        city: '',
        state: '',
        country: 'Brasil',
        postalCode: '',
        isDefault: false,
      });
    } catch (error: any) {
      toast.error(error.message || 'Erro ao adicionar endereço');
    }
  };

  const handleContinueToPayment = () => {
    // Verificar se todos os campos obrigatórios estão preenchidos
    const missingFields: string[] = [];
    
    if (!userInfo?.name || String(userInfo.name).trim() === '') {
      missingFields.push('Nome');
    }
    if (!hasCpf) {
      missingFields.push('CPF');
    }
    if (!hasWhatsapp) {
      missingFields.push('WhatsApp');
    }
    if (selectedAddressIndex === -1) {
      missingFields.push('Endereço');
    }

    if (missingFields.length > 0) {
      toast.error(`Campos obrigatórios faltando: ${missingFields.join(', ')}`);
      return;
    }

    // Abrir modal de forma de pagamento
    setShowDeliveryModal(true);
  };

  const handleDeliveryMethodConfirm = async (isLocalPickup: boolean) => {
    const selectedAddress = selectedAddressIndex >= 0
      ? shippingAddresses[selectedAddressIndex]
      : newAddress;

    if (!selectedAddress.street || !selectedAddress.city || !selectedAddress.postalCode) {
      toast.error('Por favor, selecione ou preencha um endereço válido');
      return;
    }

    setIsProcessingPayment(true);
    try {
      // Montar dados do pedido - usar totalPrice/quantity para considerar desconto
      const items = cartItems.map((it: any) => ({ 
        productId: it.id, 
        quantity: it.quantity, 
        price: it.totalPrice / it.quantity // Preço final com desconto já aplicado
      }));
      const orderData = { shippingAddress: selectedAddress, items, isLocalPickup };

      // @ts-ignore dispatch typing
      const created = await dispatch((await import('../store/order-slice')).createOrder(orderData)).unwrap();

      // salvar order criado para uso na página de pagamento/confirmation
      try {
        // gerar idempotencyKey local para reutilizar no fluxo de pagamento
        let idempotencyKey = '';
        try {
          // @ts-ignore
          idempotencyKey = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
        } catch (e) {
          idempotencyKey = `id-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
        }
        const createdWithKey = { ...created, idempotencyKey };
        localStorage.setItem('createdOrder', JSON.stringify(createdWithKey));
      } catch (e) {
        // ignore
      }

      // Associar listas salvas localmente (user_lists_v1) aos orderItems criados
      try {
        const rawLists = localStorage.getItem('user_lists_v1');
        if (rawLists) {
          const parsedLists = JSON.parse(rawLists || '{}') || {};
          const orderItems = (created && (created.localOrder?.items || created.items)) || [];
          for (const it of orderItems) {
            const orderItemId = it.id || it.orderItemId;
            if (!orderItemId) continue;

            // possíveis chaves usadas ao salvar: cartItemId | productId | product.slug.current
            const productId = it.productId || it.product?.id || (it.product && it.product.id);
            const slug = it.product?.slug?.current || (it.product && it.product.slug && it.product.slug.current);
            const possibleKeys: string[] = [];
            if ((it as any).cartItemId) possibleKeys.push(String((it as any).cartItemId));
            if (productId) possibleKeys.push(String(productId));
            if (slug) possibleKeys.push(String(slug));

            let foundKey: string | null = null;
            for (const k of possibleKeys) {
              if (parsedLists[k]) { foundKey = k; break; }
            }

            if (foundKey) {
              try {
                // usar cliente axios `api` para enviar header Authorization automaticamente
                const resp = await api.post('/orders/lists', { orderItemId, rows: parsedLists[foundKey] });
                if (resp && resp.data) {
                  // remover da lista local
                  delete parsedLists[foundKey];
                } else {
                  console.warn('orders/lists POST sem resposta esperada', resp);
                }
              } catch (e) {
                console.warn('Falha ao salvar lista do pedido no servidor', e);
              }
            }
          }

          // persistir o que sobrou ou remover a chave se vazia
          try {
            const remaining = Object.keys(parsedLists || {});
            if (!remaining || remaining.length === 0) {
              localStorage.removeItem('user_lists_v1');
            } else {
              localStorage.setItem('user_lists_v1', JSON.stringify(parsedLists));
            }
          } catch (e) {}
        }
      } catch (e) {
        console.warn('Erro ao associar listas locais ao pedido:', e);
      }

      // Limpar o carrinho local APENAS após o pedido ser criado com sucesso
      try {
        dispatch(cartActions.clearCart());
      } catch (e) {
        console.warn('Falha ao limpar o carrinho local:', e);
      }

      setShowDeliveryModal(false);
      router.push(`/payment/${created.id}`);
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao criar pedido');
    } finally {
      setIsProcessingPayment(false);
    }
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
          
          {/* Seção de campos faltando do perfil */}
          {showMissingProfileSection && (
            <div className="mb-8 p-6 bg-blue-50 dark:bg-slate-800 border-l-4 border-blue-500 dark:border-blue-400 rounded-lg shadow-md dark:shadow-lg">
              <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-300 mb-4">
                ⚠️ Campos do Perfil Incompletos
              </h2>
              <p className="text-blue-800 dark:text-blue-200 mb-4">
                Para continuar, preencha os seguintes campos:
              </p>
              
              <form onSubmit={handleSaveProfileFields} className="space-y-4">
                {/* Campo Nome */}
                {(!userInfo || !userInfo.name || String(userInfo.name).trim() === '') && (
                  <div>
                    <label className="block text-sm font-medium text-palette-text mb-2">
                      Nome *
                    </label>
                    <input
                      type="text"
                      value={profileFieldValues.name}
                      onChange={(e) => handleProfileFieldChange('name', e.target.value)}
                      placeholder="Digite seu nome"
                      className="w-full px-4 py-2 border border-palette-border bg-palette-card text-palette-text rounded-lg focus:outline-none focus:ring-2 focus:ring-palette-primary"
                    />
                    {profileFieldErrors.name && (
                      <p className="text-red-500 text-xs mt-1">{profileFieldErrors.name}</p>
                    )}
                  </div>
                )}

                {/* Campo CPF */}
                {missingProfileFields.includes('cpf') && (
                  <div>
                    <label className="block text-sm font-medium text-palette-text mb-2">
                      CPF *
                    </label>
                    <input
                      type="tel"
                      value={profileFieldValues.cpf}
                      onChange={(e) => handleProfileFieldChange('cpf', e.target.value)}
                      placeholder="XXX.XXX.XXX-XX"
                      maxLength={14}
                      className="w-full px-4 py-2 border border-palette-border bg-palette-card text-palette-text rounded-lg focus:outline-none focus:ring-2 focus:ring-palette-primary"
                    />
                    {profileFieldErrors.cpf && (
                      <p className="text-red-500 text-xs mt-1">{profileFieldErrors.cpf}</p>
                    )}
                  </div>
                )}

                {/* Campo WhatsApp */}
                {missingProfileFields.includes('whatsapp') && (
                  <div>
                    <label className="block text-sm font-medium text-palette-text mb-2">
                      WhatsApp *
                    </label>
                    <input
                      type="tel"
                      value={profileFieldValues.whatsapp}
                      onChange={(e) => handleProfileFieldChange('whatsapp', e.target.value)}
                      placeholder="(11) 99999-9999"
                      maxLength={20}
                      className="w-full px-4 py-2 border border-palette-border bg-palette-card text-palette-text rounded-lg focus:outline-none focus:ring-2 focus:ring-palette-primary"
                    />
                    {profileFieldErrors.whatsapp && (
                      <p className="text-red-500 text-xs mt-1">{profileFieldErrors.whatsapp}</p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={savingProfileFields}
                  className="w-full bg-palette-primary text-palette-side font-medium py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {savingProfileFields ? 'Salvando...' : 'Salvar e Continuar'}
                </button>
              </form>
            </div>
          )}
          
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
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-medium text-palette-base">{address.street}{address.number ? `, ${address.number}` : ''}</p>
                            {address.complement && (
                              <p className="text-sm text-palette-mute">{address.complement}</p>
                            )}
                            <p className="text-sm text-palette-mute">
                              {address.city}, {address.state} - CEP: {address.postalCode}
                            </p>
                            <p className="text-sm text-palette-mute">{address.country}</p>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-1 ${
                              selectedAddressIndex === index 
                                ? 'bg-palette-primary border-palette-primary' 
                                : 'border-gray-300'
                            }`}>
                              {selectedAddressIndex === index && (
                                <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                              )}
                            </div>
                            <button
                              onClick={(e) => handleDeleteAddress(index, e)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition-colors flex-shrink-0"
                              title="Deletar endereço"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
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
                      maxLength={9}
                      placeholder="CEP"
                      onChange={(e) => handleCepChange(e.target.value)}
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
                        id="Number"
                        type="text"
                        required
                        value={newAddress.number}
                        placeholder="Número"
                        onChange={(e) => handleInputChange('number', e.target.value)}
                        classes={errors.number ? 'border-red-500' : ''}
                      />
                      {errors.number && <span className="text-red-500 text-xs block md:col-span-2">{errors.number}</span>}
                      <Input
                        id="Neighborhood"
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
                  {cartItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
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

                {/* Aviso de campos faltando */}
                {!canProceedToPayment && (
                  <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-2">⚠️ Campos obrigatórios:</p>
                    <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                      {(!userInfo?.name || String(userInfo?.name).trim() === '') && <li>• Nome</li>}
                      {!hasCpf && <li>• CPF</li>}
                      {!hasWhatsapp && <li>• WhatsApp</li>}
                      {selectedAddressIndex === -1 && <li>• Selecione um endereço</li>}
                    </ul>
                  </div>
                )}

                <button
                  onClick={handleContinueToPayment}
                  className="w-full bg-palette-primary text-palette-side py-3 px-4 rounded-lg hover:bg-palette-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!canProceedToPayment}
                  title={!canProceedToPayment ? 'Preencha todos os campos obrigatórios (CPF, WhatsApp e selecione um endereço)' : 'Continuar para pagamento'}
                >
                  Continuar para Pagamento
                </button>
              </div>
            </div>
          </div>
        </div>

        <Benefits />

        {/* Modal de Forma de Pagamento */}
        <DeliveryMethodModal
          isOpen={showDeliveryModal}
          onClose={() => setShowDeliveryModal(false)}
          onConfirm={handleDeliveryMethodConfirm}
          isLoading={isProcessingPayment}
        />
      </div>
    </PrivateRoute>
  );
};

export default ShippingAddressPage;

