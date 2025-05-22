import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddToCartDto, UpdateCartItemDto, CartResponseDto } from './dto/cart.dto';
import { User } from '@prisma/client';
import { GetUser } from '../../decorators/get-user.decorator';

/**
 * Controlador responsável por gerenciar as operações do carrinho de compras
 * 
 * @remarks 
 * Todas as rotas requerem autenticação JWT
 * Os endpoints são protegidos pelo JwtAuthGuard
 * 
 * @swagger
 * Documentado com decorators do Swagger para geração automática da documentação da API
 */
@ApiTags('Cart') // Tag Swagger para agrupar endpoints do carrinho
@Controller('cart') // Prefixo da rota: /cart
@UseGuards(JwtAuthGuard) // Protege todas as rotas com autenticação JWT
@ApiBearerAuth() // Indica que as rotas requerem token Bearer
export class CartController {
  constructor(private readonly cartService: CartService) {}

  /**
   * Obtém o carrinho do usuário atual
   * @param user Usuário autenticado (injetado via decorator)
   * @returns Carrinho com itens e total calculado
   */
  @Get()
  @ApiOperation({ 
    summary: 'Obter carrinho do usuário',
    description: 'Retorna o carrinho atual do usuário com lista de itens e totais calculados'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Carrinho retornado com sucesso',
    type: CartResponseDto
  })
  async getCart(@GetUser() user: User) {
    return this.cartService.getOrCreateCart(user.id);
  }

  /**
   * Adiciona um novo item ao carrinho
   * @param user Usuário autenticado
   * @param addToCartDto DTO com dados do item a ser adicionado
   * @returns Carrinho atualizado
   */
  @Post('items')
  @ApiOperation({ 
    summary: 'Adicionar item ao carrinho',
    description: 'Adiciona um novo produto ao carrinho ou atualiza a quantidade se já existir'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Item adicionado com sucesso',
    type: CartResponseDto
  })
  async addToCart(
    @GetUser() user: User,
    @Body() addToCartDto: AddToCartDto,
  ) {
    return this.cartService.addItem(user.id, addToCartDto);
  }

  /**
   * Atualiza a quantidade de um item no carrinho
   * @param user Usuário autenticado
   * @param itemId ID do item a ser atualizado
   * @param updateCartItemDto DTO com nova quantidade
   * @returns Carrinho atualizado
   */
  @Put('items/:itemId')
  @ApiOperation({ 
    summary: 'Atualizar quantidade do item',
    description: 'Atualiza a quantidade de um item específico no carrinho'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Item atualizado com sucesso',
    type: CartResponseDto
  })
  async updateCartItem(
    @GetUser() user: User,
    @Param('itemId') itemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(user.id, itemId, updateCartItemDto);
  }

  /**
   * Remove um item do carrinho
   * @param user Usuário autenticado
   * @param itemId ID do item a ser removido
   * @returns Carrinho atualizado
   */
  @Delete('items/:itemId')
  @ApiOperation({ 
    summary: 'Remover item do carrinho',
    description: 'Remove um item específico do carrinho'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Item removido com sucesso',
    type: CartResponseDto
  })
  async removeFromCart(
    @GetUser() user: User,
    @Param('itemId') itemId: string,
  ) {
    return this.cartService.removeItem(user.id, itemId);
  }

  /**
   * Limpa o carrinho do usuário
   * @param user Usuário autenticado
   * @returns Carrinho vazio
   */
  @Delete()
  @ApiOperation({ 
    summary: 'Limpar carrinho',
    description: 'Remove todos os itens do carrinho'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Carrinho limpo com sucesso',
    type: CartResponseDto
  })
  async clearCart(@GetUser() user: User) {
    return this.cartService.clear(user.id);
  }
}
