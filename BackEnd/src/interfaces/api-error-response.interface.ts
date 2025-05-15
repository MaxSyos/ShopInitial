import { ApiProperty } from '@nestjs/swagger';

export class ApiErrorResponse {
  @ApiProperty({ description: 'Código do erro HTTP' })
  statusCode: number;

  @ApiProperty({ description: 'Mensagem de erro', type: [String] })
  message: string | string[];

  @ApiProperty({ description: 'Tipo do erro' })
  error: string;

  @ApiProperty({ description: 'Timestamp do erro' })
  timestamp: string;

  @ApiProperty({ description: 'Caminho da requisição que gerou o erro' })
  path: string;
}
