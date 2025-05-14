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
 *   "productId": "123e4567-e89b-12d3-a456-426614174000",
 *   "quantity": 1
 * }
 */
export class AddToCartDto {
  @ApiProperty({
    description: 'ID do produto a ser adicionado ao carrinho',
    example: '123e4567-e89b-12d3-a456-426614174000'
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
    description: 'ID único do item no carrinho'
  })
  id: string;

  @ApiProperty({
    description: 'Quantidade do item selecionada'
  })
  quantity: number;

  @ApiProperty({
    description: 'Informações do produto',
    type: 'object'
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
    description: 'ID único do carrinho'
  })
  id: string;

  @ApiProperty({
    description: 'ID do usuário proprietário do carrinho'
  })
  userId: string;

  @ApiProperty({
    description: 'Lista de itens no carrinho',
    type: [CartItemResponseDto]
  })
  items: CartItemResponseDto[];

  @ApiProperty({
    description: 'Valor total do carrinho',
    example: 299.99
  })
  total: number;

  @ApiProperty({
    description: 'Data de criação do carrinho'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização do carrinho'
  })
  updatedAt: Date;
}
