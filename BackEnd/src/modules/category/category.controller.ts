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
import { CategoryService } from './category.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryResponseDto,
} from './dto/category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { Public } from '../../decorators/public.decorator';
import { ApiErrorResponse } from '../../interfaces/api-error-response.interface';

@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Criar uma nova categoria',
    description: 'Cria uma nova categoria no sistema. Requer permissão de ADMIN.'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Categoria criada com sucesso',
    type: CategoryResponseDto
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
    type: ApiErrorResponse
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Já existe uma categoria com este nome',
    type: ApiErrorResponse
  })
  async create(@Body() createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDto> {
    return this.categoryService.create(createCategoryDto);
  }

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Listar todas as categorias',
    description: 'Retorna uma lista de todas as categorias disponíveis.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de categorias retornada com sucesso',
    type: [CategoryResponseDto]
  })
  async findAll(): Promise<CategoryResponseDto[]> {
    return this.categoryService.findAll();
  }

  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Buscar uma categoria pelo ID',
    description: 'Retorna os detalhes de uma categoria específica.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID da categoria',
    type: String,
    required: true
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Categoria encontrada com sucesso',
    type: CategoryResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Categoria não encontrada',
    type: ApiErrorResponse
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<CategoryResponseDto> {
    return this.categoryService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Atualizar uma categoria',
    description: 'Atualiza os dados de uma categoria existente. Requer permissão de ADMIN.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID da categoria',
    type: String,
    required: true
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Categoria atualizada com sucesso',
    type: CategoryResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Categoria não encontrada',
    type: ApiErrorResponse
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Já existe uma categoria com este nome',
    type: ApiErrorResponse
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Excluir uma categoria',
    description: 'Remove uma categoria do sistema. Requer permissão de ADMIN.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID da categoria',
    type: String,
    required: true
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Categoria excluída com sucesso'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Categoria não encontrada',
    type: ApiErrorResponse
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Categoria possui produtos ou subcategorias associadas',
    type: ApiErrorResponse
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.categoryService.remove(id);
  }

  @Get(':id/products')
  @Public()
  @ApiOperation({
    summary: 'Listar produtos por categoria',
    description: 'Retorna todos os produtos de uma categoria.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID da categoria',
    type: String,
    required: true
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Produtos da categoria retornados com sucesso',
    type: [Object] // Ajuste para o DTO correto se necessário
  })
  async getProductsByCategory(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    return this.categoryService.getProductsByCategory(id);
  }
}
