import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ 
    example: 'Eletrônicos',
    description: 'Nome da categoria',
    minLength: 3,
    maxLength: 100
  })
  @IsString()
  name: string;

  @ApiProperty({ 
    example: 'Produtos eletrônicos incluindo smartphones, tablets, notebooks e acessórios',
    description: 'Descrição da categoria',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ 
    example: '550e8400-e29b-41d4-a716-446655440007',
    description: 'ID da categoria pai (para subcategorias)',
    required: false
  })
  @IsUUID()
  @IsOptional()
  parentId?: string;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

export class CategoryResponseDto {
  @ApiProperty({ 
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'ID único da categoria'
  })
  id: string;

  @ApiProperty({ 
    example: 'Smartphones',
    description: 'Nome da categoria'
  })
  name: string;

  @ApiProperty({ 
    example: 'Celulares e smartphones de última geração das melhores marcas',
    description: 'Descrição da categoria',
    required: false
  })
  description?: string | null;

  @ApiProperty({ 
    example: '550e8400-e29b-41d4-a716-446655440007',
    description: 'ID da categoria pai',
    required: false
  })
  parentId?: string | null;

  @ApiProperty({
    example: '2024-05-20T10:00:00Z',
    description: 'Data de criação do registro'
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-05-20T10:00:00Z',
    description: 'Data da última atualização'
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Lista de subcategorias',
    type: () => [CategoryResponseDto],
    required: false,
    example: [{
      id: '550e8400-e29b-41d4-a716-446655440008',
      name: 'Samsung',
      description: 'Smartphones Samsung',
      parentId: '550e8400-e29b-41d4-a716-446655440001',
      createdAt: '2024-05-20T10:00:00Z',
      updatedAt: '2024-05-20T10:00:00Z'
    }]
  })
  children?: CategoryResponseDto[];

  @ApiProperty({
    description: 'Categoria pai',
    type: () => CategoryResponseDto,
    required: false,
    example: {
      id: '550e8400-e29b-41d4-a716-446655440007',
      name: 'Eletrônicos',
      description: 'Produtos eletrônicos incluindo smartphones, tablets, notebooks e acessórios',
      parentId: null,
      createdAt: '2024-05-20T10:00:00Z',
      updatedAt: '2024-05-20T10:00:00Z'
    }
  })
  parent?: CategoryResponseDto;
}
