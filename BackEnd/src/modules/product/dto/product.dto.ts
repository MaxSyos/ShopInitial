import { ApiProperty, PartialType, ApiTags } from '@nestjs/swagger';
import { 
  IsString, 
  IsNumber, 
  IsArray, 
  IsOptional, 
  Min, 
  IsUUID, 
  IsNotEmpty, 
  IsPositive, 
  ArrayMinSize,
  IsEnum,
  IsBoolean
} from 'class-validator';
import { Type } from 'class-transformer';

// DTOs para criação e atualização
@ApiTags('Products')
export class CreateProductDto {
  @ApiProperty({ 
    example: 'Samsung Galaxy S24 Ultra', 
    description: 'Nome do produto',
    minLength: 3,
    maxLength: 100 
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    example: 'O smartphone mais avançado da Samsung com câmera de 200MP, S Pen e tela Dynamic AMOLED 2X de 6.8"',
    description: 'Descrição detalhada do produto',
    minLength: 10,
    maxLength: 1000
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ 
    example: 9999.99,
    description: 'Preço do produto',
    minimum: 0.01,
    type: Number
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  price: number;

  @ApiProperty({ 
    example: 50,
    description: 'Quantidade em estoque',
    minimum: 0,
    type: Number
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock: number;

  @ApiProperty({ 
    example: 'SM-S928B-512GB',
    description: 'Código único do produto',
    uniqueItems: true
  })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ 
    example: [
      'https://shopinitial.com/images/s24-ultra-black.jpg',
      'https://shopinitial.com/images/s24-ultra-detail.jpg'
    ],
    description: 'URLs das imagens do produto',
    minItems: 1,
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  images: string[];

  @ApiProperty({ 
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'ID da categoria do produto'
  })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ 
    example: '550e8400-e29b-41d4-a716-446655440002',
    description: 'ID da marca do produto'
  })
  @IsUUID()
  @IsNotEmpty()
  brandId: string;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// DTOs para consulta e filtros
export enum ProductSortField {
  PRICE = 'price',
  NAME = 'name',
  CREATED_AT = 'createdAt',
  STOCK = 'stock'
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

export class GetProductsQueryDto {
  @ApiProperty({ required: false, example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ required: false, example: '550e8400-e29b-41d4-a716-446655440002' })
  @IsOptional()
  @IsUUID()
  brandId?: string;

  @ApiProperty({ required: false, example: 'samsung galaxy' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, enum: ProductSortField, example: ProductSortField.PRICE })
  @IsOptional()
  @IsEnum(ProductSortField)
  sortBy?: ProductSortField;

  @ApiProperty({ required: false, enum: SortOrder, example: SortOrder.ASC })
  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder;

  @ApiProperty({ required: false, example: 1000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minPrice?: number;

  @ApiProperty({ required: false, example: 10000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxPrice?: number;

  @ApiProperty({ required: false, default: 1, example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 10, example: 10 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  limit?: number = 10;
}

// DTOs de resposta
class CategoryResponse {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  id: string;

  @ApiProperty({ example: 'Smartphones' })
  name: string;
}

class BrandResponse {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  id: string;

  @ApiProperty({ example: 'Samsung' })
  name: string;

  @ApiProperty({ required: false, example: 'https://shopinitial.com/brands/samsung.png' })
  logo?: string;
}

class ReviewResponse {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440003' })
  id: string;

  @ApiProperty({ example: 5 })
  rating: number;

  @ApiProperty({ required: false, example: 'Excelente smartphone, superou minhas expectativas!' })
  comment?: string;

  @ApiProperty({ example: '2024-05-20T10:00:00Z' })
  createdAt: Date;
}

export class ProductResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440004' })
  id: string;

  @ApiProperty({ example: 'Samsung Galaxy S24 Ultra' })
  name: string;

  @ApiProperty({ example: 'O smartphone mais avançado da Samsung com câmera de 200MP, S Pen e tela Dynamic AMOLED 2X de 6.8"' })
  description: string;

  @ApiProperty({ example: 9999.99 })
  price: number;

  @ApiProperty({ example: 50 })
  stock: number;

  @ApiProperty({ example: 'SM-S928B-512GB' })
  sku: string;

  @ApiProperty({ 
    type: [String],
    example: [
      'https://shopinitial.com/images/s24-ultra-black.jpg',
      'https://shopinitial.com/images/s24-ultra-detail.jpg'
    ]
  })
  images: string[];

  @ApiProperty({ type: CategoryResponse })
  category: CategoryResponse;

  @ApiProperty({ type: BrandResponse })
  brand: BrandResponse;

  @ApiProperty({ type: [ReviewResponse], required: false })
  reviews?: ReviewResponse[];

  @ApiProperty({ example: '2024-05-20T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-05-20T10:00:00Z' })
  updatedAt: Date;
}

export class ProductListResponseDto {
  @ApiProperty({ type: [ProductResponseDto] })
  items: ProductResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
