import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';

/**
 * Interface para o item do pedido na resposta da API
 * 
 * @remarks
 * Contém informações detalhadas de cada item do pedido
 */
export interface IOrderItemResponse {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    images: string[];
  };
}

/**
 * Interface para o endereço de entrega na resposta da API
 */
export interface IOrderAddressResponse {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

/**
 * Interface para a resposta completa do pedido
 * 
 * @remarks
 * Contém todas as informações necessárias para exibição do pedido:
 * - Informações básicas (ID, status, total)
 * - Itens com detalhes dos produtos
 * - Endereço de entrega
 * - Datas importantes
 */
export class OrderResponse {
  @ApiProperty({
    description: 'ID único do pedido'
  })
  id: string;

  @ApiProperty({
    description: 'ID do usuário que fez o pedido'
  })
  userId: string;

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
    type: 'array'
  })
  items: IOrderItemResponse[];

  @ApiProperty({
    description: 'Endereço de entrega'
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
