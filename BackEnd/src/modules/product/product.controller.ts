import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
  ParseUUIDPipe,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ProductService } from './product.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductResponseDto,
  GetProductsQueryDto,
  ProductListResponseDto,
} from './dto/product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { Public } from '../../decorators/public.decorator';
import { ApiErrorResponse } from '../../interfaces/api-error-response.interface';

@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar um novo produto' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Produto criado com sucesso',
    type: ProductResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Dados inválidos',
    type: ApiErrorResponse 
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'SKU já existe',
    type: ApiErrorResponse 
  })
  async create(@Body(ValidationPipe) createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    return this.productService.create(createProductDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Listar produtos com filtros e paginação' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Lista de produtos retornada com sucesso',
    type: ProductListResponseDto 
  })
  async findAll(@Query(ValidationPipe) query: GetProductsQueryDto): Promise<ProductListResponseDto> {
    return this.productService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Buscar um produto pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do produto' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Produto encontrado',
    type: ProductResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Produto não encontrado',
    type: ApiErrorResponse 
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ProductResponseDto> {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar um produto' })
  @ApiParam({ name: 'id', description: 'ID do produto' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Produto atualizado com sucesso',
    type: ProductResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Produto não encontrado',
    type: ApiErrorResponse 
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'SKU já existe',
    type: ApiErrorResponse 
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body(ValidationPipe) updateProductDto: UpdateProductDto
  ): Promise<ProductResponseDto> {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover um produto' })
  @ApiParam({ name: 'id', description: 'ID do produto' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Produto removido com sucesso' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Produto não encontrado',
    type: ApiErrorResponse 
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    return this.productService.remove(id);
  }

  @Patch(':id/stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar estoque do produto' })
  @ApiParam({ name: 'id', description: 'ID do produto' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Estoque atualizado com sucesso',
    type: ProductResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Produto não encontrado',
    type: ApiErrorResponse 
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'Estoque insuficiente',
    type: ApiErrorResponse 
  })
  async updateStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('quantity', new ParseIntPipe()) quantity: number
  ): Promise<ProductResponseDto> {
    return this.productService.updateStock(id, quantity);
  }
}
