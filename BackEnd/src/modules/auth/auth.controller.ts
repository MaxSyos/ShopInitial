import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RegisterDto,
  AuthResponseDto,
  RefreshTokenDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiErrorResponse } from '../../interfaces/api-error-response.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Login de usuário',
    description: 'Autentica um usuário com email e senha, retornando tokens de acesso e atualização.'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Login realizado com sucesso',
    type: AuthResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Credenciais inválidas',
    type: ApiErrorResponse 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Dados inválidos',
    type: ApiErrorResponse 
  })
  async login(@Body() loginDto: LoginDto) {
    console.log('🔍 [AUTH] Login - Dados recebidos:', {
      email: loginDto.email,
      hasPassword: !!loginDto.password,
    });
    return this.authService.login(loginDto);
  }

  @Post('register')
  @ApiOperation({ 
    summary: 'Registro de novo usuário',
    description: 'Cria uma nova conta de usuário no sistema.'
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Usuário registrado com sucesso',
    type: AuthResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Dados inválidos ou email já existe',
    type: ApiErrorResponse 
  })
  async register(@Body() registerDto: RegisterDto) {
    console.log('🔍 [AUTH] Register - Dados recebidos:', {
      email: registerDto.email,
      name: registerDto.name,
      hasPassword: !!registerDto.password,
    });
    return this.authService.register(registerDto);
  }

  @Post('refresh')
  @ApiOperation({ 
    summary: 'Atualizar token',
    description: 'Gera um novo token de acesso usando o token de atualização.'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Token atualizado com sucesso',
    type: AuthResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Token de atualização inválido ou expirado',
    type: ApiErrorResponse 
  })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Perfil do usuário',
    description: 'Retorna os dados do usuário autenticado.'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Perfil recuperado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        email: { type: 'string', format: 'email' },
        name: { type: 'string' },
        role: { type: 'string', enum: ['USER', 'ADMIN', 'MANAGER'] }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Token inválido ou expirado',
    type: ApiErrorResponse 
  })
  async getProfile(@Req() req: Request & { user: any }) {
    return req.user;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Logout do usuário',
    description: 'Invalida o token de atualização do usuário.'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Logout realizado com sucesso' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Token inválido ou expirado',
    type: ApiErrorResponse 
  })
  async logout(@Req() req: Request & { user: any }) {
    return this.authService.logout(req.user.id);
  }
}
