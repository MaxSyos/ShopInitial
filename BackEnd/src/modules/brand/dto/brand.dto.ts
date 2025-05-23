import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsUrl, IsOptional } from 'class-validator';

export class CreateBrandDto {
  @ApiProperty({
    description: 'Nome da marca',
    example: 'Samsung',
    minLength: 2,
    maxLength: 100
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'URL do logo da marca',
    example: 'https://shopinitial.com/brands/samsung.png',
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
    example: '550e8400-e29b-41d4-a716-446655440002'
  })
  id: string;

  @ApiProperty({
    description: 'Nome da marca',
    example: 'Samsung'
  })
  name: string;

  @ApiProperty({
    description: 'URL do logo da marca',
    example: 'https://shopinitial.com/brands/samsung.png',
    required: false
  })
  logo?: string;

  @ApiProperty({
    description: 'Data de criação do registro',
    example: '2024-05-20T10:00:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2024-05-20T10:00:00Z'
  })
  updatedAt: Date;
}
