import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { NotificationResponseDto } from './dto/notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../../decorators/get-user.decorator';
import { User } from '@prisma/client';
import { ApiErrorResponse } from '../../interfaces/api-error-response.interface';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar notificações',
    description: 'Retorna todas as notificações do usuário.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de notificações retornada com sucesso',
    type: [NotificationResponseDto],
  })
  async findAll(@GetUser() user: User) {
    return this.notificationService.findAll(user.id);
  }

  @Get('unread')
  @ApiOperation({
    summary: 'Listar notificações não lidas',
    description: 'Retorna todas as notificações não lidas do usuário.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de notificações não lidas retornada com sucesso',
    type: [NotificationResponseDto],
  })
  async findUnread(@GetUser() user: User) {
    return this.notificationService.findUnread(user.id);
  }

  @Post(':id/read')
  @ApiOperation({
    summary: 'Marcar como lida',
    description: 'Marca uma notificação específica como lida.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da notificação',
    type: String,
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notificação marcada como lida com sucesso',
    type: NotificationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notificação não encontrada',
    type: ApiErrorResponse,
  })
  async markAsRead(
    @GetUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notificationService.markAsRead(id, user.id);
  }

  @Post('read-all')
  @ApiOperation({
    summary: 'Marcar todas como lidas',
    description: 'Marca todas as notificações do usuário como lidas.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notificações marcadas como lidas com sucesso',
  })
  async markAllAsRead(@GetUser() user: User) {
    return this.notificationService.markAllAsRead(user.id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Excluir notificação',
    description: 'Remove uma notificação específica.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da notificação',
    type: String,
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notificação excluída com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notificação não encontrada',
    type: ApiErrorResponse,
  })
  async delete(
    @GetUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notificationService.delete(id, user.id);
  }

  @Delete()
  @ApiOperation({
    summary: 'Excluir todas as notificações',
    description: 'Remove todas as notificações do usuário.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notificações excluídas com sucesso',
  })
  async deleteAll(@GetUser() user: User) {
    return this.notificationService.deleteAll(user.id);
  }
}
