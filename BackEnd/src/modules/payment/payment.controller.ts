import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Headers,
  RawBody,
  HttpStatus,
  NotFoundException,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../../decorators/get-user.decorator';
import { User, Payment } from '@prisma/client';
import { ApiErrorResponse } from '../../interfaces/api-error-response.interface';
import { Logger } from '@nestjs/common';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly paymentService: PaymentService,
    private readonly configService: ConfigService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({
    summary: 'Criar pagamento',
    description: 'Cria um novo pagamento para um pedido.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Pagamento criado com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos ou pagamento já existe',
    type: ApiErrorResponse,
  })
  async create(@GetUser() user: User, @Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.create(createPaymentDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Buscar pagamento',
    description: 'Retorna os detalhes de um pagamento.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do pagamento',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pagamento encontrado',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pagamento não encontrado',
    type: ApiErrorResponse,
  })
  async findOne(@Param('id') id: string) {
    const payment = await this.paymentService.findOne(id);
    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado');
    }
    return payment;
  }

  @Post(':id/refund')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reembolsar pagamento',
    description: 'Processa o reembolso de um pagamento.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do pagamento',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reembolso processado com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Pagamento não encontrado ou erro no processamento',
    type: ApiErrorResponse,
  })
  async refund(@Param('id') id: string) {
    return this.paymentService.refund(id);
  }

  @Post('webhook')
  @ApiOperation({
    summary: 'Webhook do Mercado Pago',
    description: 'Endpoint para receber notificações do Mercado Pago',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notificação processada com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Payload inválido ou erro no processamento',
  })
  async webhook(
    @Headers('x-signature') signature: string,
    @RawBody() rawBody: Buffer,
    @Query('data.id') paymentId?: string,
    @Query('type') type?: string,
  ) {
    try {
      // Validar presença do body
      if (!rawBody) {
        this.logger.error('Raw body não encontrado na requisição');
        return {
          received: false,
          message: 'Raw body não encontrado na requisição',
        };
      }

      this.logger.debug('Webhook recebido', {
        signature,
        paymentId,
        type,
        rawBody: rawBody.toString(),
      });

      // Notificação via query params (IPN antigo)
      if (paymentId && type === 'payment') {
        try {
          await this.paymentService.processPaymentUpdate(paymentId);
          return { received: true };
        } catch (error: any) {
          if (error.message.includes('Pagamento não encontrado')) {
            // Retorna 200 mesmo se o pagamento não existir
            return { 
              received: true,
              message: 'Pagamento ainda não existe no sistema'
            };
          }
          throw error;
        }
      }

      // Notificação via webhook (novo formato)
      const result = await this.paymentService.webhook(signature, rawBody);
      
      // Sempre retorna 200 para o Mercado Pago, mesmo em caso de erro
      // apenas muda a flag received e adiciona mensagem de erro se necessário
      return result;
    } catch (error) {
      this.logger.error('Erro ao processar webhook', error);
      // Retorna 200 mesmo em caso de erro, mas com received: false
      return {
        received: false,
        message: error.message,
      };
    }
  }

  @Get(':id/pix-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Verificar status do PIX',
    description: 'Verifica o status atual de um pagamento PIX.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do pagamento',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status do PIX retornado com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pagamento não encontrado',
    type: ApiErrorResponse,
  })
  async checkPixStatus(@Param('id') id: string) {
    return this.paymentService.checkPaymentStatus(id);
  }
}
