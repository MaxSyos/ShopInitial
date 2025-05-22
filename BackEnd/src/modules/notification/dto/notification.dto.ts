import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

import { NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'Tipo da notificação',
    enum: NotificationType,
    example: NotificationType.ORDER_CREATED,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: 'ID do usuário que receberá a notificação',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Título da notificação',
    example: 'Pedido Confirmado',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Mensagem da notificação',
    example: 'Seu pedido #123 foi confirmado e está em processamento.',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Link relacionado à notificação (opcional)',
    example: '/orders/123',
    required: false,
  })
  @IsString()
  @IsOptional()
  link?: string;
}

export class NotificationResponseDto {
  @ApiProperty({
    description: 'ID da notificação',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Tipo da notificação',
    enum: NotificationType,
    example: NotificationType.ORDER_CREATED,
  })
  type: NotificationType;

  @ApiProperty({
    description: 'ID do usuário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'Título da notificação',
    example: 'Pedido Confirmado',
  })
  title: string;

  @ApiProperty({
    description: 'Mensagem da notificação',
    example: 'Seu pedido #123 foi confirmado e está em processamento.',
  })
  message: string;

  @ApiProperty({
    description: 'Link relacionado à notificação',
    example: '/orders/123',
    required: false,
  })
  link?: string;

  @ApiProperty({
    description: 'Data de criação',
    example: '2025-05-21T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2025-05-21T10:00:00Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Indica se a notificação foi lida',
    example: false,
  })
  read: boolean;
}
