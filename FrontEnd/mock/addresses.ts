import { ShippingAddress } from '../store/order-slice';

export const mockAddresses: ShippingAddress[] = [
  {
    street: 'Avenida Paulista, 1000',
    city: 'São Paulo',
    state: 'SP',
    country: 'Brasil',
    postalCode: '01310-100',
    isDefault: true
  },
  {
    street: 'Rua Oscar Freire, 123',
    city: 'São Paulo',
    state: 'SP',
    country: 'Brasil',
    postalCode: '01426-001',
    isDefault: false
  },
  {
    street: 'Avenida Atlântica, 500',
    city: 'Rio de Janeiro',
    state: 'RJ',
    country: 'Brasil',
    postalCode: '22010-000',
    isDefault: false
  }
];
