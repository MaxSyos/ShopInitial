import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsOptional, Min, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: 'Smartphone XYZ' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Um smartphone incrível com câmera de 108MP' })
  @IsString()
  description: string;

  @ApiProperty({ example: 1999.99 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock: number;

  @ApiProperty({ example: 'SKU123456' })
  @IsString()
  sku: string;

  @ApiProperty({ example: ['http://example.com/image1.jpg'] })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  brandId: string;
}

export class UpdateProductDto {
  @ApiProperty({ example: 'Smartphone XYZ' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'Um smartphone incrível com câmera de 108MP' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 1999.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @ApiProperty({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock?: number;

  @ApiProperty({ example: ['http://example.com/image1.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID()
  brandId?: string;
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

  @ApiProperty()
  images: string[];

  @ApiProperty()
  categoryId: string;

  @ApiProperty()
  category: {
    id: string;
    name: string;
  };

  @ApiProperty()
  brandId: string;

  @ApiProperty()
  brand: {
    id: string;
    name: string;
    logo?: string;
  };

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
