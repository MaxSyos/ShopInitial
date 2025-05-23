import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsInt, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para adicionar um novo item ao carrinho
 * 
 * @remarks
 * Validações:
 * - productId: Deve ser um UUID válido
 * - quantity: Deve ser um número inteiro positivo
 * 
 * @example
 * {
 *   "productId": "550e8400-e29b-41d4-a716-446655440004",
 *   "quantity": 1
 * }
 */
export class AddToCartDto {
  @ApiProperty({
    description: 'ID do produto a ser adicionado ao carrinho',
    example: '550e8400-e29b-41d4-a716-446655440004'
  })
  @IsUUID()
  productId: string;

  @ApiProperty({
    description: 'Quantidade do produto a ser adicionada',
    example: 1,
    minimum: 1
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity: number;
}

/**
 * DTO para atualizar a quantidade de um item no carrinho
 * 
 * @remarks
 * Validações:
 * - quantity: Deve ser um número inteiro positivo
 * 
 * @example
 * {
 *   "quantity": 2
 * }
 */
export class UpdateCartItemDto {
  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity: number;
}

/**
 * DTO para resposta de item do carrinho
 * 
 * @remarks
 * Contém informações detalhadas do item incluindo:
 * - ID único do item no carrinho
 * - Quantidade selecionada
 * - Detalhes do produto (id, nome, preço, imagens, estoque)
 */
export class CartItemResponseDto {
  @ApiProperty({
    description: 'ID único do item no carrinho',
    example: '550e8400-e29b-41d4-a716-446655440005'
  })
  id: string;

  @ApiProperty({
    description: 'Quantidade do item selecionada',
    example: 1
  })
  quantity: number;

  @ApiProperty({
    description: 'Informações do produto',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440004',
      name: 'Samsung Galaxy S24 Ultra',
      price: 9999.99,
      images: [
        'https://shopinitial.com/images/s24-ultra-black.jpg',
        'https://shopinitial.com/images/s24-ultra-detail.jpg'
      ],
      stock: 50
    }
  })
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
    stock: number;
  };
}

/**
 * DTO para resposta completa do carrinho
 * 
 * @remarks
 * Contém todas as informações do carrinho incluindo:
 * - ID único do carrinho
 * - ID do usuário proprietário
 * - Lista de itens com detalhes
 * - Valor total calculado
 * - Timestamps de criação e atualização
 */
export class CartResponseDto {
  @ApiProperty({
    description: 'ID único do carrinho',
    example: '550e8400-e29b-41d4-a716-446655440006'
  })
  id: string;

  @ApiProperty({
    description: 'ID do usuário proprietário do carrinho',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  userId: string;

  @ApiProperty({
    description: 'Lista de itens no carrinho',
    type: [CartItemResponseDto]
  })
  items: CartItemResponseDto[];

  @ApiProperty({
    description: 'Valor total do carrinho',
    example: 9999.99
  })
  total: number;

  @ApiProperty({
    description: 'Data de criação do carrinho',
    example: '2024-05-20T10:00:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização do carrinho',
    example: '2024-05-20T10:00:00Z'
  })
  updatedAt: Date;
}
