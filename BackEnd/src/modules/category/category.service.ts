import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto, CategoryResponseDto } from './dto/category.dto';
import { Category, Prisma } from '@prisma/client';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const existingCategory = await this.prisma.category.findUnique({
      where: { name: createCategoryDto.name },
    });

    if (existingCategory) {
      throw new ConflictException('Já existe uma categoria com este nome');
    }

    if (createCategoryDto.parentId) {
      const parentCategory = await this.prisma.category.findUnique({
        where: { id: createCategoryDto.parentId },
      });

      if (!parentCategory) {
        throw new NotFoundException('Categoria pai não encontrada');
      }
    }

    const category = await this.prisma.category.create({
      data: createCategoryDto,
      include: {
        children: true,
        parent: true,
      },
    });

    return this.mapToResponseDto(category);
  }

  async findAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.prisma.category.findMany({
      include: {
        children: true,
        parent: true,
      },
    });

    return categories.map(category => this.mapToResponseDto(category));
  }

  async findOne(id: string): Promise<CategoryResponseDto> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        parent: true,
        products: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    return this.mapToResponseDto(category);
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    const existingCategory = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new NotFoundException('Categoria não encontrada');
    }

    if (updateCategoryDto.name) {
      const categoryWithSameName = await this.prisma.category.findFirst({
        where: {
          name: updateCategoryDto.name,
          id: { not: id },
        },
      });

      if (categoryWithSameName) {
        throw new ConflictException('Já existe uma categoria com este nome');
      }
    }

    if (updateCategoryDto.parentId) {
      const parentCategory = await this.prisma.category.findUnique({
        where: { id: updateCategoryDto.parentId },
      });

      if (!parentCategory) {
        throw new NotFoundException('Categoria pai não encontrada');
      }

      if (updateCategoryDto.parentId === id) {
        throw new ConflictException('Uma categoria não pode ser sua própria pai');
      }
    }

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
      include: {
        children: true,
        parent: true,
      },
    });

    return this.mapToResponseDto(updatedCategory);
  }

  async remove(id: string): Promise<void> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        products: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    if (category.products.length > 0) {
      throw new ConflictException('Não é possível excluir uma categoria que possui produtos');
    }

    if (category.children.length > 0) {
      throw new ConflictException('Não é possível excluir uma categoria que possui subcategorias');
    }

    await this.prisma.category.delete({
      where: { id },
    });
  }

  async getProductsByCategory(id: string): Promise<any[]> {
    const category = await this.prisma.category.findUnique({
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
    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }
    return category.products.map(product => ({
      ...product,
      price: Number(product.price),
      brand: {
        ...product.brand,
        logo: product.brand.logo || undefined
      }
    }));
  }

  private mapToResponseDto(category: Category & {
    children?: Category[];
    parent?: Category | null;
  }): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      parentId: category.parentId,
      createdAt: new Date(), // Temporariamente usando a data atual
      updatedAt: new Date(), // Temporariamente usando a data atual
      children: category.children?.map(child => this.mapToResponseDto({
        ...child,
        children: undefined,
        parent: undefined
      })),
      parent: category.parent ? this.mapToResponseDto({
        ...category.parent,
        children: undefined,
        parent: undefined
      }) : undefined,
    };
  }
}
