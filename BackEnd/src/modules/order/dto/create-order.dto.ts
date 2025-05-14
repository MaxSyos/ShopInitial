import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para o endereço de entrega do pedido
 * 
 * @remarks
 * Pode ser um endereço existente do usuário ou um novo endereço
 */
export class OrderAddressDto {
  @ApiProperty({
    description: 'ID do endereço existente do usuário (opcional)',
    required: false
  })
  @IsUUID()
  @IsOptional()
  addressId?: string;

  @ApiProperty({
    description: 'Rua',
    example: 'Av. Paulista, 1000'
  })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({
    description: 'Cidade',
    example: 'São Paulo'
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    description: 'Estado',
    example: 'SP'
  })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({
    description: 'País',
    example: 'Brasil'
  })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({
    description: 'CEP',
    example: '01310-100'
  })
  @IsString()
  @IsNotEmpty()
  postalCode: string;
}

/**
 * DTO para criação de um novo pedido
 * 
 * @remarks
 * Contém:
 * - Endereço de entrega
 * - Itens são obtidos automaticamente do carrinho do usuário
 */
export class CreateOrderDto {
  @ApiProperty({
    description: 'Endereço de entrega do pedido'
  })
  @ValidateNested()
  @Type(() => OrderAddressDto)
  shippingAddress: OrderAddressDto;
}
