import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTestPaymentDto {
  @ApiProperty({
    description: 'ID da transação no Mercado Pago',
    example: '123456',
  })
  @IsString()
  transactionId: string;

  @ApiProperty({
    description: 'Valor do pagamento',
    example: 100.00,
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'E-mail do usuário',
    example: 'teste@exemplo.com',
  })
  @IsString()
  userEmail: string;

  @ApiProperty({
    description: 'Nome do usuário',
    example: 'João Silva',
  })
  @IsString()
  userName: string;
}
