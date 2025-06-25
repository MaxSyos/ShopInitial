import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { BrandService } from './brand.service';
import {
  CreateBrandDto,
  UpdateBrandDto,
  BrandResponseDto,
} from './dto/brand.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { Public } from '../../decorators/public.decorator';
import { ApiErrorResponse } from '../../interfaces/api-error-response.interface';

@ApiTags('Brands')
@Controller('brands')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Criar uma nova marca',
    description: 'Cria uma nova marca no sistema. Requer permissão de ADMIN.'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Marca criada com sucesso',
    type: BrandResponseDto
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
    type: ApiErrorResponse
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Já existe uma marca com este nome',
    type: ApiErrorResponse
  })
  async create(@Body() createBrandDto: CreateBrandDto): Promise<BrandResponseDto> {
    return this.brandService.create(createBrandDto);
  }

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Listar todas as marcas',
    description: 'Retorna uma lista de todas as marcas disponíveis.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de marcas retornada com sucesso',
    type: [BrandResponseDto]
  })
  async findAll(): Promise<BrandResponseDto[]> {
    return this.brandService.findAll();
  }

  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Buscar uma marca pelo ID',
    description: 'Retorna os detalhes de uma marca específica.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID da marca',
    type: String,
    required: true
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Marca encontrada com sucesso',
    type: BrandResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Marca não encontrada',
    type: ApiErrorResponse
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<BrandResponseDto> {
    return this.brandService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Atualizar uma marca',
    description: 'Atualiza os dados de uma marca existente. Requer permissão de ADMIN.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID da marca',
    type: String,
    required: true
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Marca atualizada com sucesso',
    type: BrandResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Marca não encontrada',
    type: ApiErrorResponse
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Já existe uma marca com este nome',
    type: ApiErrorResponse
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBrandDto: UpdateBrandDto,
  ): Promise<BrandResponseDto> {
    return this.brandService.update(id, updateBrandDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Excluir uma marca',
    description: 'Remove uma marca do sistema. Requer permissão de ADMIN.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID da marca',
    type: String,
    required: true
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Marca excluída com sucesso'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Marca não encontrada',
    type: ApiErrorResponse
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Marca possui produtos associados',
    type: ApiErrorResponse
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.brandService.remove(id);
  }

  @Get(':id/products')
  @Public()
  @ApiOperation({
    summary: 'Listar produtos por marca',
    description: 'Retorna todos os produtos de uma marca.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID da marca',
    type: String,
    required: true
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Produtos da marca retornados com sucesso',
    type: [Object] // Ajuste para o DTO correto se necessário
  })
  async getProductsByBrand(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    return this.brandService.getProductsByBrand(id);
  }
}
