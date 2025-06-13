import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../services/prisma.service';
import { UserService } from '../user/user.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { User, UserRole } from '@prisma/client';
import { TokenCleanupService } from './services/token-cleanup.service';
import * as bcrypt from 'bcrypt';
import ms from 'ms';
import { Tokens, JwtPayload, DurationString } from './types/auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly tokenCleanupService: TokenCleanupService,
  ) {}

  async validateUser(email: string, password: string): Promise<Omit<User, 'password'> | null> {
    try {
      const user = await this.userService.findByEmail(email);
      if (!user) {
        throw new UnauthorizedException('Email ou senha inválidos');
      }
      
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Email ou senha inválidos');
      }

      const { password: _, ...result } = user;
      return result;
    } catch (error: any) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuário inativo');
    }

    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const { email, password } = registerDto;

    // Verifica se o usuário já existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Email já está em uso');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cria o usuário
    const user = await this.prisma.user.create({
      data: {
        ...registerDto,
        password: hashedPassword,
        role: UserRole.USER,
      },
    });

    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async generateTokens(user: { id: string; email: string; role: UserRole }): Promise<Tokens> {
    const jwtPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        expiresIn: this.configService.get<string>('JWT_EXPIRATION', '15m'),
      }),
      this.jwtService.signAsync(jwtPayload, {
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async saveRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const defaultExpiration = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    const configExpiration = this.configService.get<DurationString>('JWT_REFRESH_EXPIRATION', '7d');
    let expiration: number;
    
    try {
      // Valida se é uma string de duração válida usando o tipo personalizado
      if (configExpiration && typeof configExpiration === 'string') {
        const parsed = ms(configExpiration as DurationString);
        expiration = (typeof parsed === 'number' && parsed > 0) ? parsed : defaultExpiration;
      } else {
        expiration = defaultExpiration;
      }
    } catch {
      expiration = defaultExpiration;
    }
    const expiresAt = new Date(Date.now() + expiration);

    const token = await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt,
      },
    });

    await this.tokenCleanupService.updateTokenLastUsed(token.id);
  }

  async refreshTokens(refreshToken: string): Promise<Tokens> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken);
      
      const tokenRecord = await this.prisma.refreshToken.findFirst({
        where: {
          token: refreshToken,
          userId: payload.sub,
        },
        include: {
          user: true,
        },
      });

      if (!tokenRecord) {
        throw new UnauthorizedException('Token de atualização inválido');
      }

      if (tokenRecord.expiresAt < new Date()) {
        await this.prisma.refreshToken.delete({
          where: { id: tokenRecord.id },
        });
        throw new UnauthorizedException('Token de atualização expirado');
      }

      if (!tokenRecord.user || !tokenRecord.user.isActive) {
        throw new UnauthorizedException('Usuário inválido ou inativo');
      }

      // Gera novos tokens
      const newTokens = await this.generateTokens({
        id: tokenRecord.user.id,
        email: tokenRecord.user.email,
        role: tokenRecord.user.role,
      });

      // Atualiza o registro do refresh token
      await this.prisma.refreshToken.delete({
        where: { id: tokenRecord.id },
      });

      await this.saveRefreshToken(tokenRecord.user.id, newTokens.refreshToken);
      await this.tokenCleanupService.updateTokenLastUsed(tokenRecord.id);

      return newTokens;
    } catch (error) {
      throw new UnauthorizedException('Falha ao atualizar tokens');
    }
  }

  async logout(userId: string): Promise<void> {
    await this.revokeAllUserTokens(userId);
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        token: refreshToken,
      },
    });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
      },
    });
  }
}
