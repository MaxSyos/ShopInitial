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
    example: 'Produtos eletrônicos em geral',
    description: 'Descrição da categoria',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ 
    example: '9f5f3142-719c-4f43-9d12-0f2f1c7f4f92',
    description: 'ID da categoria pai (para subcategorias)',
    required: false
  })
  @IsUUID()
  @IsOptional()
  parentId?: string;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

export class CategoryResponseDto {
  @ApiProperty({ example: '9f5f3142-719c-4f43-9d12-0f2f1c7f4f92' })
  id: string;

  @ApiProperty({ example: 'Eletrônicos' })
  name: string;

  @ApiProperty({ 
    example: 'Produtos eletrônicos em geral',
    required: false
  })
  description?: string | null;

  @ApiProperty({ 
    example: null,
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
  })
  children?: CategoryResponseDto[];

  @ApiProperty({
    description: 'Categoria pai',
    type: () => CategoryResponseDto,
    required: false,
  })
  parent?: CategoryResponseDto;
}
