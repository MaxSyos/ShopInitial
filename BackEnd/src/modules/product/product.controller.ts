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

@ApiTags('Products')
@Controller('products')
@ApiResponse({
  status: HttpStatus.UNAUTHORIZED,
  description: 'Não autorizado',
  type: ApiErrorResponse
})
@ApiResponse({
  status: HttpStatus.FORBIDDEN,
  description: 'Acesso negado',
  type: ApiErrorResponse
})
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Criar um novo produto',
    description: 'Cria um novo produto no sistema. Requer permissões de ADMIN ou MANAGER.'
  })
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
  async create(@Body() createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    return this.productService.create(createProductDto);
  }

  @Get()
  @Public()
  @ApiOperation({ 
    summary: 'Listar produtos',
    description: 'Retorna uma lista paginada de produtos com filtros opcionais.'
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    description: 'Número da página',
    type: Number 
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    description: 'Quantidade de itens por página',
    type: Number 
  })
  @ApiQuery({ 
    name: 'search', 
    required: false, 
    description: 'Termo de busca para filtrar produtos',
    type: String 
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Lista de produtos retornada com sucesso',
    type: ProductListResponseDto
  })
  async findAll(@Query() query: GetProductsQueryDto): Promise<ProductListResponseDto> {
    return this.productService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ 
    summary: 'Obter um produto',
    description: 'Retorna os detalhes de um produto específico.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID do produto',
    type: String,
    required: true
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Produto encontrado com sucesso',
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Atualizar um produto',
    description: 'Atualiza os dados de um produto existente. Requer permissões de ADMIN ou MANAGER.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID do produto',
    type: String,
    required: true
  })
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
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto
  ): Promise<ProductResponseDto> {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Excluir um produto',
    description: 'Remove um produto do sistema. Requer permissão de ADMIN.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID do produto',
    type: String,
    required: true
  })
  @ApiResponse({ 
    status: HttpStatus.NO_CONTENT, 
    description: 'Produto excluído com sucesso'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Produto não encontrado',
    type: ApiErrorResponse
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.productService.remove(id);
  }
}
