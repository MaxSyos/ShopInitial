import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../../decorators/get-user.decorator';
import { User } from '@prisma/client';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OrderResponse } from './interfaces/order-response.interface';

/**
 * Controlador responsável pelos endpoints de pedidos
 * 
 * @remarks
 * Todas as rotas requerem autenticação JWT
 */
@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * Cria um novo pedido a partir do carrinho do usuário
   * 
   * @param user - Usuário autenticado
   * @param createOrderDto - Dados do pedido (endereço de entrega)
   * @returns Pedido criado com todos os detalhes
   */
  @Post()
  @ApiOperation({ summary: 'Criar novo pedido' })
  @ApiResponse({
    status: 201,
    description: 'Pedido criado com sucesso',
    type: OrderResponse
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou carrinho vazio'
  })
  async create(
    @GetUser() user: User,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<OrderResponse> {
    return this.orderService.create(user.id, createOrderDto);
  }

  /**
   * Lista todos os pedidos do usuário
   * 
   * @param user - Usuário autenticado
   * @returns Lista de pedidos do usuário
   */
  @Get()
  @ApiOperation({ summary: 'Listar pedidos do usuário' })
  @ApiResponse({ status: 200, description: 'Lista de pedidos retornada com sucesso' })
  async findAll(@GetUser() user: User) {
    return this.orderService.findAll(user.id);
  }

  /**
   * Busca um pedido específico
   * 
   * @param user - Usuário autenticado
   * @param id - ID do pedido
   * @returns Pedido com todos os detalhes
   */
  @Get(':id')
  @ApiOperation({ summary: 'Buscar pedido por ID' })
  @ApiResponse({ status: 200, description: 'Pedido encontrado com sucesso' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
  async findOne(
    @GetUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.orderService.findOne(id, user.id);
  }
}
