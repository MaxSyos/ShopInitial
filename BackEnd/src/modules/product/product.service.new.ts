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
  ProductListResponseDto,
} from './dto/product.dto';
import { Prisma, Product } from '@prisma/client';

@Injectable()
export class ProductService {
  private readonly CACHE_TTL = 300; // 5 minutos
  private readonly CACHE_PREFIX = 'product:';

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  private async setCache<T>(key: string, data: T): Promise<void> {
    try {
      await this.redisService.set(
        `${this.CACHE_PREFIX}${key}`,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error(`Erro ao definir cache: ${error.message}`);
    }
  }

  private async invalidateCache(patterns: string[]): Promise<void> {
    try {
      await Promise.all(
        patterns.map(pattern => 
          this.redisService.del(`${this.CACHE_PREFIX}${pattern}`)
        )
      );
    } catch (error) {
      console.error(`Erro ao invalidar cache: ${error.message}`);
    }
  }

  async findAll(query: GetProductsQueryDto): Promise<ProductListResponseDto> {
    const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = query;
    const skip = (page - 1) * limit;
    const take = limit;
    const orderBy = { [sortBy]: order.toLowerCase() };
    const where = {};

    const cacheKey = `list:${JSON.stringify({ skip, take, orderBy, where })}`;
    const cachedData = await this.redisService.get(`${this.CACHE_PREFIX}${cacheKey}`);

    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        skip,
        take,
        where,
        orderBy,
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
      }),
      this.prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / take);

    const result = {
      items: products.map(product => ({
        ...product,
        price: Number(product.price),
        brand: {
          ...product.brand,
          logo: product.brand.logo || undefined,
        },
      })),
      total,
      page,
      limit,
      totalPages,
    };

    await this.setCache(cacheKey, result);

    return result;
  }

  async findOne(id: string): Promise<Product> {
    const cacheKey = `${id}`;
    const cachedData = await this.redisService.get(`${this.CACHE_PREFIX}${cacheKey}`);

    if (cachedData) {
      return JSON.parse(cachedData);
    }

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

    await this.setCache(cacheKey, product);

    return product;
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const existingProduct = await this.prisma.product.findUnique({
      where: { sku: createProductDto.sku },
    });

    if (existingProduct) {
      throw new ConflictException('SKU já está em uso');
    }

    const category = await this.prisma.category.findUnique({
      where: { id: createProductDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    const brand = await this.prisma.brand.findUnique({
      where: { id: createProductDto.brandId },
    });

    if (!brand) {
      throw new NotFoundException('Marca não encontrada');
    }

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

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
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

    return product;
  }

  async remove(id: string): Promise<{ message: string }> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    await this.prisma.product.delete({
      where: { id },
    });

    await this.invalidateProductCache(id);
    return { message: 'Produto removido com sucesso' };
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    if (product.stock + quantity < 0) {
      throw new ConflictException('Estoque insuficiente');
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        stock: {
          increment: quantity,
        },
      },
    });
  }

  private async invalidateProductCache(id: string): Promise<void> {
    const cacheKey = `${this.CACHE_PREFIX}${id}`;
    await this.redisService.del(cacheKey);

    const listCachePattern = `${this.CACHE_PREFIX}list:*`;
    const listCacheKeys = await this.redisService.keys(listCachePattern);
    await Promise.all(listCacheKeys.map(key => this.redisService.del(key)));
  }
}
