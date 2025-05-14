import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './modules/prisma/prisma.module';
import { RedisModule } from './modules/redis/redis.module';
import { CacheModule } from './modules/cache/cache.module';
import { AuthModule } from './modules/auth/auth.module';
import { MetricsInterceptor } from './interceptors/metrics.interceptor';
import { UserModule } from './modules/user/user.module';
import { ProductModule } from './modules/product/product.module';
import { CartModule } from './modules/cart/cart.module';
import { OrderModule } from './modules/order/order.module';
import { PaymentModule } from './modules/payment/payment.module';
import { NotificationModule } from './modules/notification/notification.module';
import { CustomCacheInterceptor } from './interceptors/cache.interceptor';
import { PrometheusModule } from './modules/prometheus/prometheus.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // Configuração de variáveis de ambiente
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Prisma
    PrismaModule,

    // Rate Limiting
    ThrottlerModule.forRoot([{
      ttl: 60, // 1 minuto
      limit: 100, // 100 requisições por minuto
    }]),

    // Cache e Redis
    CacheModule,

    // Prometheus para Métricas
    PrometheusModule,

    // Módulos da aplicação
    AuthModule,
    UserModule,
    ProductModule,
    CartModule,
    OrderModule,
    HealthModule,
    PaymentModule,
    NotificationModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CustomCacheInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
})
export class AppModule {}
