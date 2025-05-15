import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitService } from '../rate-limit/rate-limit.service';
import { Observable } from 'rxjs';

export interface RateLimitOptions {
  limit?: number;
  ttl?: number;
  errorMessage?: string;
  keyPrefix?: string;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Obtém as opções de rate limit da rota ou usa os valores padrão
    const options: RateLimitOptions = this.reflector.get(
      'rateLimit',
      context.getHandler(),
    ) || {};

    // Gera um identificador único baseado no IP ou usuário
    const identifier = this.getIdentifier(request);
    const route = this.getRouteKey(request);

    const result = await this.rateLimitService.checkRateLimit(
      identifier,
      route,
      options.limit,
      options.ttl,
    );

    // Adiciona headers de rate limit
    response.header('X-RateLimit-Limit', options.limit || 100);
    response.header('X-RateLimit-Remaining', result.remaining);
    response.header('X-RateLimit-Reset', result.resetTime);

    if (!result.allowed) {
      throw new HttpException(
        options.errorMessage || 'Muitas requisições, tente novamente mais tarde',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private getIdentifier(request: any): string {
    // Prioriza o ID do usuário se estiver autenticado
    if (request.user && request.user.id) {
      return `user:${request.user.id}`;
    }

    // Caso contrário, usa o IP
    const ip = request.ip || 
               request.connection.remoteAddress ||
               request.headers['x-forwarded-for'];

    return `ip:${ip}`;
  }

  private getRouteKey(request: any): string {
    return `${request.method}:${request.route.path}`;
  }
}

// Decorator para aplicar rate limit em rotas específicas
export const RateLimit = (options: RateLimitOptions = {}) => {
  return (target: any, key?: string, descriptor?: any) => {
    Reflect.defineMetadata('rateLimit', options, descriptor.value);
    return descriptor;
  };
};
