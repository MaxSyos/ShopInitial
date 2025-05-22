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

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
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
    summary: 'Webhook de Pagamento',
    description: 'Recebe notificações do provedor de pagamento (Mercado Pago ou Stripe).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook processado com sucesso',
  })
  async webhook(
    @Headers('stripe-signature') stripeSignature: string,
    @Headers('x-mp-signature') mpSignature: string,
    @Headers('x-mp-webhook-id') mpWebhookId: string,
    @RawBody() body: Buffer,
  ): Promise<any> {
    const provider = this.configService.get('PAYMENT_PROVIDER');
    const signature = provider === 'stripe' ? stripeSignature : mpSignature;
    
    return this.paymentService.webhook(signature, body);
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
