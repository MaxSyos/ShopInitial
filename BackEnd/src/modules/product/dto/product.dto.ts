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
    example: 'Smartphone XYZ', 
    description: 'Nome do produto',
    minLength: 3,
    maxLength: 100 
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    example: 'Um smartphone incrível com câmera de 108MP',
    description: 'Descrição detalhada do produto',
    minLength: 10,
    maxLength: 1000
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ 
    example: 1999.99,
    description: 'Preço do produto',
    minimum: 0.01,
    type: Number
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  price: number;

  @ApiProperty({ 
    example: 100,
    description: 'Quantidade em estoque',
    minimum: 0,
    type: Number
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock: number;

  @ApiProperty({ 
    example: 'SKU123456',
    description: 'Código único do produto',
    uniqueItems: true
  })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ 
    example: ['http://example.com/image1.jpg'],
    description: 'URLs das imagens do produto',
    minItems: 1,
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  images: string[];

  @ApiProperty({ 
    example: '9f5f3142-719c-4f43-9d12-0f2f1c7f4f92',
    description: 'ID da categoria do produto'
  })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ 
    example: '1f5f3142-719c-4f43-9d12-0f2f1c7f4f92',
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
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  brandId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, enum: ProductSortField })
  @IsOptional()
  @IsEnum(ProductSortField)
  sortBy?: ProductSortField;

  @ApiProperty({ required: false, enum: SortOrder })
  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minPrice?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxPrice?: number;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  limit?: number = 10;
}

// DTOs de resposta
class CategoryResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

class BrandResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  logo?: string;
}

class ReviewResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  rating: number;

  @ApiProperty({ required: false })
  comment?: string;

  @ApiProperty()
  createdAt: Date;
}

export class ProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  stock: number;

  @ApiProperty()
  sku: string;

  @ApiProperty({ type: [String] })
  images: string[];

  @ApiProperty({ type: CategoryResponse })
  category: CategoryResponse;

  @ApiProperty({ type: BrandResponse })
  brand: BrandResponse;

  @ApiProperty({ type: [ReviewResponse], required: false })
  reviews?: ReviewResponse[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
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
