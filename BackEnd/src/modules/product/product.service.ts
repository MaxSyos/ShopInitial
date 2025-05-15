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
  ProductResponseDto,
  ProductSortField,
  SortOrder
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

  private async getFromCache<T>(key: string): Promise<T | null> {
    try {
      const cachedData = await this.redisService.get(`${this.CACHE_PREFIX}${key}`);
      return cachedData ? JSON.parse(cachedData) : null;
    } catch (error) {
      console.error(`Erro ao buscar cache: ${error.message}`);
      return null;
    }
  }

  private async setCache<T>(key: string, data: T): Promise<void> {
    try {
      await this.redisService.setex(
        `${this.CACHE_PREFIX}${key}`,
        this.CACHE_TTL,
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

  async create(createProductDto: CreateProductDto): Promise<Product> {
    try {
      // Verifica se já existe um produto com o mesmo SKU
      const existingProduct = await this.prisma.product.findUnique({
        where: { sku: createProductDto.sku },
      });

      if (existingProduct) {
        throw new ConflictException('SKU já está em uso');
      }

      // Verifica se a categoria existe
      const category = await this.prisma.category.findUnique({
        where: { id: createProductDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Categoria não encontrada');
      }

      // Verifica se a marca existe
      const brand = await this.prisma.brand.findUnique({
        where: { id: createProductDto.brandId },
      });

      if (!brand) {
        throw new NotFoundException('Marca não encontrada');
      }

      // Cria o produto
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

  async findAll(query: GetProductsQueryDto): Promise<ProductListResponseDto> {
    const cacheKey = `${this.CACHE_PREFIX}list:${JSON.stringify(params)}`;
    const cachedData = await this.redisService.get(cacheKey);

    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const { skip, take, cursor, where, orderBy } = params;

    const products = await this.prisma.product.findMany({
      skip,
      take,
      cursor,
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
    });

    const total = await this.prisma.product.count({ where });

    const result = {
      products,
      total,
    };

    await this.redisService.set(
      cacheKey,
      JSON.stringify(result),
      this.CACHE_TTL,
    );

    return result;
  }

  async findOne(id: string) {
    const cacheKey = `${this.CACHE_PREFIX}${id}`;
    const cachedProduct = await this.redisService.get(cacheKey);

    if (cachedProduct) {
      return JSON.parse(cachedProduct);
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
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    await this.redisService.set(
      cacheKey,
      JSON.stringify(product),
      this.CACHE_TTL,
    );

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    // Verifica se o produto existe
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Se estiver atualizando o SKU, verifica se já está em uso
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

    // Se estiver atualizando a categoria, verifica se existe
    if (updateProductDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateProductDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Categoria não encontrada');
      }
    }

    // Se estiver atualizando a marca, verifica se existe
    if (updateProductDto.brandId) {
      const brand = await this.prisma.brand.findUnique({
        where: { id: updateProductDto.brandId },
      });

      if (!brand) {
        throw new NotFoundException('Marca não encontrada');
      }
    }

    // Atualiza o produto e invalida o cache
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

  async remove(id: string) {
    // Verifica se o produto existe
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    await this.prisma.product.delete({
      where: { id },
    });

    return { message: 'Produto removido com sucesso' };
  }

  async searchProducts(searchTerm: string, params: {
    skip?: number;
    take?: number;
    orderBy?: Prisma.ProductOrderByWithRelationInput;
  }) {
    const { skip, take, orderBy } = params;

    const where = {
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { sku: { contains: searchTerm, mode: 'insensitive' } },
      ],
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take,
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

    return {
      products,
      total,
    };
  }

  async updateStock(id: string, quantity: number) {
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

  private async invalidateProductCache(id: string) {
    const cacheKey = `${this.CACHE_PREFIX}${id}`;
    await this.redisService.del(cacheKey);

    // Invalida também os caches de lista que podem conter este produto
    const listCachePattern = `${this.CACHE_PREFIX}list:*`;
    const listCacheKeys = await this.redisService.keys(listCachePattern);
    await Promise.all(listCacheKeys.map(key => this.redisService.del(key)));
  }

  private async refreshProductCache(product: any) {
    const cacheKey = `${this.CACHE_PREFIX}${product.id}`;
    await this.redisService.set(
      cacheKey,
      JSON.stringify(product),
      this.CACHE_TTL,
    );
  }
}
