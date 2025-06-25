import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import { RedisService } from '../redis/redis.service';
import { 
  CreateProductDto, 
  UpdateProductDto, 
  GetProductsQueryDto,
  ProductSortField,
  SortOrder
} from './dto/product.dto';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '@prisma/client';
import { ProductResponse, ProductListResponse } from './types/product.types';
import { Prisma, Product } from '@prisma/client';

@Injectable()
export class ProductService {
  private readonly CACHE_TTL = 300; // 5 minutos
  private readonly CACHE_PREFIX = 'product:';
  private readonly logger = new Logger(ProductService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly notificationService: NotificationService,
  ) {}

  private async getCache<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.redisService.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      this.logger.error(`Erro ao obter cache: ${error.message}`);
      return null;
    }
  }

  private async setCache<T>(key: string, data: T): Promise<void> {
    try {
      await this.redisService.set(key, JSON.stringify(data), this.CACHE_TTL);
    } catch (error) {
      this.logger.error(`Erro ao definir cache: ${error.message}`);
    }
  }

  private transformBrandLogo(logo: string | null): string | undefined {
    return logo === null ? undefined : logo;
  }

  async findAll(query: GetProductsQueryDto): Promise<ProductListResponse> {
    const { page = 1, limit = 10, sortBy = ProductSortField.CREATED_AT, order = SortOrder.DESC } = query;
    const skip = (page - 1) * limit;
    const take = limit;
    const orderBy = { [sortBy]: order.toLowerCase() };
    const where = {};

    const cacheKey = `list:${JSON.stringify({ skip, take, orderBy, where })}`;
    const cachedData = await this.redisService.get(`${this.CACHE_PREFIX}${cacheKey}`);

    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const products = await this.prisma.product.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            parent: { select: { id: true, name: true } },
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    const total = await this.prisma.product.count({ where });

    const totalPages = Math.ceil(total / take);
    const items: ProductResponse[] = products.map(product => ({
      ...product,
      price: Number(product.price),
      brand: {
        ...product.brand,
        logo: product.brand.logo || undefined
      }
    }));

    const result: ProductListResponse = {
      items,
      total,
      page,
      limit,
      totalPages,
    };

    await this.setCache(cacheKey, result);

    return result;
  }

  async findOne(id: string): Promise<ProductResponse> {
    const cacheKey = `${this.CACHE_PREFIX}${id}`;
    
    const cached = await this.getCache<ProductResponse>(cacheKey);
    if (cached) return cached;

    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Produto com ID ${id} não encontrado`);
    }

    const response: ProductResponse = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      stock: product.stock,
      sku: product.sku,
      images: product.images,
      category: product.category,
      brand: {
        id: product.brand.id,
        name: product.brand.name,
        logo: this.transformBrandLogo(product.brand.logo)
      },
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };

    await this.setCache(cacheKey, response);

    return response;
  }

  async create(createProductDto: CreateProductDto): Promise<ProductResponse> {
    const product = await this.prisma.product.create({
      data: createProductDto,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    const response: ProductResponse = {
      ...product,
      price: Number(product.price),
      brand: {
        id: product.brand.id,
        name: product.brand.name,
        logo: product.brand.logo || undefined
      }
    };
    return response;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<ProductResponse> {
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new NotFoundException('Produto não encontrado');
    }

    if (updateProductDto.sku) {
      const skuInUse = await this.prisma.product.findFirst({
        where: {
          sku: updateProductDto.sku,
          id: { not: id },
        },
      });

      if (skuInUse) {
        throw new ConflictException('SKU já está em uso');
      }
    }

    if (updateProductDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateProductDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Categoria não encontrada');
      }
    }

    if (updateProductDto.brandId) {
      const brand = await this.prisma.brand.findUnique({
        where: { id: updateProductDto.brandId },
      });

      if (!brand) {
        throw new NotFoundException('Marca não encontrada');
      }
    }

    await this.invalidateProductCache(id);
    const product = await this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    const response: ProductResponse = {
      ...product,
      price: Number(product.price),
      brand: {
        ...product.brand,
        logo: product.brand.logo || undefined
      }
    };
    return response;
  }

  async remove(id: string): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Notificar administradores sobre a remoção do produto
    const admins = await this.prisma.user.findMany({
      where: {
        role: 'ADMIN'
      }
    });

    await this.prisma.product.delete({
      where: { id },
    });

    await this.invalidateProductCache(id);

    // Enviar notificação para cada administrador
    for (const admin of admins) {
      await this.notificationService.create({
        type: NotificationType.PRODUCT_REMOVED,
        userId: admin.id,
        title: 'Produto Removido',
        message: `O produto "${product.name}" foi removido do catálogo.`,
        link: '/products',
      });
    }
  }

  private readonly STOCK_LOW_THRESHOLD = 10; // Limite para considerar estoque baixo

  async updateStock(id: string, quantity: number): Promise<ProductResponse> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    if (product.stock + quantity < 0) {
      throw new ConflictException('Estoque insuficiente');
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        stock: {
          increment: quantity,
        },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    // Verificar se o novo estoque está baixo
    const newStock = product.stock + quantity;
    if (newStock <= this.STOCK_LOW_THRESHOLD) {
      // Buscar administradores para notificar
      const admins = await this.prisma.user.findMany({
        where: {
          role: 'ADMIN'
        }
      });

      // Enviar notificação para cada administrador
      for (const admin of admins) {
        await this.notificationService.notifyLowStock(
          admin.id,
          product.id,
          product.name
        );
      }
    }

    const response: ProductResponse = {
      ...updatedProduct,
      price: Number(updatedProduct.price),
      brand: {
        ...updatedProduct.brand,
        logo: updatedProduct.brand.logo || undefined
      }
    };
    return response;
  }

  async findNewest(limit: number = 10): Promise<ProductListResponse> {
    const products = await this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true, logo: true } },
      },
    });
    const items: ProductResponse[] = products.map(product => ({
      ...product,
      price: Number(product.price),
      brand: {
        ...product.brand,
        logo: product.brand.logo || undefined
      }
    }));
    return {
      items,
      total: items.length,
      page: 1,
      limit,
      totalPages: 1,
    };
  }

  async findPopular(limit: number = 10): Promise<ProductListResponse> {
    // Corrigido: ordena por createdAt como fallback
    const products = await this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true, logo: true } },
      },
    });
    const items: ProductResponse[] = products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      stock: product.stock,
      sku: product.sku,
      images: product.images,
      category: product.category,
      brand: {
        id: product.brand?.id,
        name: product.brand?.name,
        logo: product.brand?.logo || undefined
      },
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }));
    return {
      items,
      total: items.length,
      page: 1,
      limit,
      totalPages: 1,
    };
  }

  private async invalidateProductCache(id: string): Promise<void> {
    const cacheKey = `${this.CACHE_PREFIX}${id}`;
    await this.redisService.del(cacheKey);

    const listCachePattern = `${this.CACHE_PREFIX}list:*`;
    const listCacheKeys = await this.redisService.keys(listCachePattern);
    await Promise.all(listCacheKeys.map(key => this.redisService.del(key)));
  }
}
