import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import { CreateBrandDto, UpdateBrandDto, BrandResponseDto } from './dto/brand.dto';
import { Brand } from '@prisma/client';

@Injectable()
export class BrandService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createBrandDto: CreateBrandDto): Promise<BrandResponseDto> {
    const existingBrand = await this.prisma.brand.findUnique({
      where: { name: createBrandDto.name },
    });

    if (existingBrand) {
      throw new ConflictException('Já existe uma marca com este nome');
    }

    const brand = await this.prisma.brand.create({
      data: createBrandDto,
    });

    return this.mapToResponseDto(brand);
  }

  async findAll(): Promise<BrandResponseDto[]> {
    const brands = await this.prisma.brand.findMany({
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            images: true,
          },
        },
      },
    });

    return brands.map(brand => this.mapToResponseDto(brand));
  }

  async findOne(id: string): Promise<BrandResponseDto> {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            images: true,
          },
        },
      },
    });

    if (!brand) {
      throw new NotFoundException('Marca não encontrada');
    }

    return this.mapToResponseDto(brand);
  }

  async update(id: string, updateBrandDto: UpdateBrandDto): Promise<BrandResponseDto> {
    const existingBrand = await this.prisma.brand.findUnique({
      where: { id },
    });

    if (!existingBrand) {
      throw new NotFoundException('Marca não encontrada');
    }

    if (updateBrandDto.name) {
      const brandWithSameName = await this.prisma.brand.findFirst({
        where: {
          name: updateBrandDto.name,
          id: { not: id },
        },
      });

      if (brandWithSameName) {
        throw new ConflictException('Já existe uma marca com este nome');
      }
    }

    const brand = await this.prisma.brand.update({
      where: { id },
      data: updateBrandDto,
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            images: true,
          },
        },
      },
    });

    return this.mapToResponseDto(brand);
  }

  async remove(id: string): Promise<void> {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });

    if (!brand) {
      throw new NotFoundException('Marca não encontrada');
    }

    if (brand.products.length > 0) {
      throw new ConflictException('Não é possível excluir uma marca que possui produtos');
    }

    await this.prisma.brand.delete({
      where: { id },
    });
  }

  async getProductsByBrand(id: string): Promise<any[]> {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            category: { select: { id: true, name: true } },
            brand: { select: { id: true, name: true, logo: true } },
          },
        },
      },
    });
    if (!brand) {
      throw new NotFoundException('Marca não encontrada');
    }
    return brand.products.map(product => ({
      ...product,
      price: Number(product.price),
      brand: {
        ...product.brand,
        logo: product.brand.logo || undefined
      }
    }));
  }

  private mapToResponseDto(brand: Brand & {
    products?: {
      id: string;
      name: string;
      price: any;
      images: string[];
    }[];
  }): BrandResponseDto {
    return {
      id: brand.id,
      name: brand.name,
      logo: brand.logo || undefined,
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt
    };
  }
}
