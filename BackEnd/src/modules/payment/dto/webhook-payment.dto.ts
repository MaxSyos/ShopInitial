import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WebhookPaymentDataDto {
  @ApiProperty()
  @IsString()
  id: string;
}

export class WebhookPaymentDto {
  @ApiProperty()
  @IsString()
  action: string;

  @ApiProperty()
  @IsString()
  api_version: string;

  @ApiProperty()
  data: WebhookPaymentDataDto;

  @ApiProperty()
  @IsString()
  date_created: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty()
  @IsBoolean()
  live_mode: boolean;

  @ApiProperty()
  @IsString()
  type: string;

  @ApiProperty()
  @IsNumber()
  user_id: number;
}
