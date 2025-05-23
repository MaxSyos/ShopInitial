import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@shopinitial.com', description: 'Email do usuário' })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @ApiProperty({ example: 'Senha@123456', description: 'Senha do usuário' })
  @IsString({ message: 'Senha deve ser uma string' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'admin@shopinitial.com', description: 'Email do usuário' })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @ApiProperty({ example: 'Admin', description: 'Nome completo do usuário' })
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @ApiProperty({ example: 'Admin@123', description: 'Senha do usuário' })
  @IsString({ message: 'Senha deve ser uma string' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  password: string;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'Token de acesso JWT' })
  accessToken: string;

  @ApiProperty({ description: 'Token de atualização' })
  refreshToken: string;

  @ApiProperty({
    description: 'Dados do usuário',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'admin@shopinitial.com',
      name: 'Admin',
      role: 'ADMIN'
    }
  })
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Token de atualização' })
  @IsString({ message: 'Token de atualização inválido' })
  @IsNotEmpty({ message: 'Token de atualização é obrigatório' })
  refreshToken: string;
}
