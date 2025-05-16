import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';

/**
 * Interface para o item do pedido na resposta da API
 */
export interface IOrderItemResponse {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    price: number;
  };
}

/**
 * Interface para o usuário na resposta do pedido
 */
export interface IOrderUserResponse {
  id: string;
  name: string;
  email: string;
}

/**
 * Interface para o endereço de entrega na resposta da API
 */
export interface IOrderAddressResponse {
  id: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

/**
 * Interface para a resposta completa do pedido
 */
export class OrderResponse {
  @ApiProperty({
    description: 'ID único do pedido'
  })
  id: string;

  @ApiProperty({
    description: 'Status atual do pedido',
    enum: OrderStatus
  })
  status: OrderStatus;

  @ApiProperty({
    description: 'Valor total do pedido',
    example: 299.99
  })
  total: number;

  @ApiProperty({
    description: 'Itens do pedido',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        quantity: { type: 'number' },
        price: { type: 'number' },
        product: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            price: { type: 'number' }
          }
        }
      }
    }
  })
  items: IOrderItemResponse[];

  @ApiProperty({
    description: 'Usuário que fez o pedido',
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      email: { type: 'string' }
    }
  })
  user: IOrderUserResponse;

  @ApiProperty({
    description: 'Endereço de entrega',
    type: 'object',
    properties: {
      id: { type: 'string' },
      street: { type: 'string' },
      city: { type: 'string' },
      state: { type: 'string' },
      country: { type: 'string' },
      postalCode: { type: 'string' }
    }
  })
  shippingAddress: IOrderAddressResponse;

  @ApiProperty({
    description: 'Data de criação do pedido'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização do pedido'
  })
  updatedAt: Date;
}
