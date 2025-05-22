import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsUrl, IsOptional } from 'class-validator';

export class CreateBrandDto {
  @ApiProperty({
    description: 'Nome da marca',
    example: 'Nike',
    minLength: 2,
    maxLength: 100
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'URL do logo da marca',
    example: 'https://exemplo.com/logo.png',
    required: false
  })
  @IsOptional()
  @IsUrl()
  logo?: string;
}

export class UpdateBrandDto extends PartialType(CreateBrandDto) {}

export class BrandResponseDto {
  @ApiProperty({
    description: 'ID único da marca',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({
    description: 'Nome da marca',
    example: 'Nike'
  })
  name: string;

  @ApiProperty({
    description: 'URL do logo da marca',
    example: 'https://exemplo.com/logo.png',
    required: false
  })
  logo?: string;

  @ApiProperty({
    description: 'Data de criação do registro',
    example: '2025-05-20T10:00:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2025-05-20T10:00:00Z'
  })
  updatedAt: Date;
}
