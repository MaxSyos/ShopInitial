import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'ID do pedido relacionado ao pagamento',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({
    description: 'Token do cartão de crédito (Stripe)',
    example: 'tok_visa'
  })
  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;

  @ApiProperty({
    description: 'Valor total do pagamento',
    example: 99.99
  })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    description: 'Moeda do pagamento',
    example: 'BRL',
    default: 'BRL'
  })
  @IsString()
  @IsOptional()
  currency?: string = 'BRL';
}
