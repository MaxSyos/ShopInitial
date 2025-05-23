import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, IsOptional, ValidateIf } from 'class-validator';

/**
 * DTO para o endereço de entrega do pedido
 * 
 * @remarks
 * Pode ser um endereço existente do usuário ou um novo endereço
 */
export class OrderAddressDto {
  @ApiProperty({
    description: 'ID do endereço existente do usuário (opcional)',
    example: '550e8400-e29b-41d4-a716-446655440009',
    required: false
  })
  @IsUUID()
  @IsOptional()
  addressId?: string;

  @ApiProperty({
    description: 'Rua',
    example: 'Avenida Paulista, 1000'
  })
  @ValidateIf(o => !o.addressId)
  @IsString()
  street?: string;

  @ApiProperty({
    description: 'Cidade',
    example: 'São Paulo'
  })
  @ValidateIf(o => !o.addressId)
  @IsString()
  city?: string;

  @ApiProperty({
    description: 'Estado',
    example: 'SP'
  })
  @ValidateIf(o => !o.addressId)
  @IsString()
  state?: string;

  @ApiProperty({
    description: 'País',
    example: 'Brasil'
  })
  @ValidateIf(o => !o.addressId)
  @IsString()
  country?: string;

  @ApiProperty({
    description: 'CEP',
    example: '01310-100'
  })
  @ValidateIf(o => !o.addressId)
  @IsString()
  postalCode?: string;
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
    description: 'Rua do endereço de entrega',
    example: 'Avenida Paulista, 1000'
  })
  @IsString()
  street: string;

  @ApiProperty({
    description: 'Cidade do endereço de entrega',
    example: 'São Paulo'
  })
  @IsString()
  city: string;

  @ApiProperty({
    description: 'Estado do endereço de entrega',
    example: 'SP'
  })
  @IsString()
  state: string;

  @ApiProperty({
    description: 'País do endereço de entrega',
    example: 'Brasil'
  })
  @IsString()
  country: string;

  @ApiProperty({
    description: 'CEP do endereço de entrega',
    example: '01310-100'
  })
  @IsString()
  postalCode: string;
}
