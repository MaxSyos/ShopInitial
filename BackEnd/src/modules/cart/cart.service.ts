import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';
import { ProductService } from '../product/product.service';
import { RedisService } from '../redis/redis.service';

/**
 * Serviço responsável pela lógica de negócios do carrinho de compras
 * 
 * @remarks
 * Este serviço gerencia todas as operações relacionadas ao carrinho:
 * - Criação e recuperação do carrinho
 * - Adição, atualização e remoção de itens
 * - Validação de estoque
 * - Cálculo de totais
 * 
 * @dependencies
 * - PrismaService para acesso ao banco de dados
 * - ProductService para validação de produtos e estoque
 */
@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productService: ProductService,
    private readonly redisService: RedisService, // injeta RedisService
  ) {}

  async findByUserId(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
                stock: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      return null;
    }

    return {
      ...cart,
      total: this.calculateTotal(cart.items),
    };
  }

  async getOrCreateCart(userId: string) {
    // Primeiro tenta buscar no Redis
    const redisKey = `cart:${userId}`;
    const cached = await this.redisService.get(redisKey);
    if (cached) {
      return JSON.parse(cached);
    }
    // Se não encontrar, busca no Postgres
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
                stock: true,
              },
            },
          },
        },
      },
    });
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  images: true,
                  stock: true,
                },
              },
            },
          },
        },
      });
    }
    const result = { ...cart, total: this.calculateTotal(cart.items) };
    // Salva no Redis para próximas consultas
    await this.redisService.set(redisKey, JSON.stringify(result), 3600);
    return result;
  }

  async addItem(userId: string, addToCartDto: AddToCartDto) {
    const product = await this.productService.findOne(addToCartDto.productId);

    if (product.stock < addToCartDto.quantity) {
      throw new BadRequestException('Quantidade solicitada indisponível em estoque');
    }

    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: { items: true },
      });
    }

    const existingItem = cart.items.find(
      (item) => item.productId === addToCartDto.productId,
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + addToCartDto.quantity;
      if (newQuantity > product.stock) {
        throw new BadRequestException('Quantidade total excede o estoque disponível');
      }

      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: addToCartDto.productId,
          quantity: addToCartDto.quantity,
        },
      });
    }
    // Após atualizar o Postgres, remove cache do Redis
    await this.redisService.del(`cart:${userId}`);
    return this.getOrCreateCart(userId);
  }

  async updateItem(
    userId: string,
    itemId: string,
    updateCartItemDto: UpdateCartItemDto,
  ) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart) {
      throw new NotFoundException('Carrinho não encontrado');
    }

    const cartItem = cart.items.find((item) => item.id === itemId);
    if (!cartItem) {
      throw new NotFoundException('Item não encontrado no carrinho');
    }

    const product = await this.productService.findOne(cartItem.productId);
    if (updateCartItemDto.quantity > product.stock) {
      throw new BadRequestException('Quantidade solicitada indisponível em estoque');
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: updateCartItemDto.quantity },
    });
    await this.redisService.del(`cart:${userId}`);
    return this.getOrCreateCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart) {
      throw new NotFoundException('Carrinho não encontrado');
    }

    const cartItem = cart.items.find((item) => item.id === itemId);
    if (!cartItem) {
      throw new NotFoundException('Item não encontrado no carrinho');
    }

    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });
    await this.redisService.del(`cart:${userId}`);
    return this.getOrCreateCart(userId);
  }

  async clear(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException('Carrinho não encontrado');
    }

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
    await this.redisService.del(`cart:${userId}`);
    return this.getOrCreateCart(userId);
  }

  private calculateTotal(items: any[]): number {
    return items.reduce(
      (total, item) => total + Number(item.product.price) * item.quantity,
      0,
    );
  }
}
