import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty, IsOptional, IsEnum, IsUUID, Min } from 'class-validator';

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  PIX = 'PIX',
  BOLETO = 'BOLETO'
}

export class CreatePaymentDto {
  @ApiProperty({
    description: 'ID do pedido associado ao pagamento',
    example: '550e8400-e29b-41d4-a716-446655440010'
  })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({
    description: 'Valor total do pagamento',
    example: 9999.99,
    minimum: 0
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Moeda do pagamento',
    example: 'BRL',
    default: 'BRL'
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({
    description: 'Método de pagamento',
    enum: PaymentMethod,
    example: PaymentMethod.PIX,
    default: PaymentMethod.CREDIT_CARD
  })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiProperty({
    description: 'Número de parcelas para pagamento com cartão',
    example: 1,
    required: false
  })
  @IsNumber()
  @IsOptional()
  installments?: number;

  @ApiProperty({
    description: 'Salvar cartão para futuras compras',
    example: false,
    required: false
  })
  @IsOptional()
  saveCard?: boolean;
}
