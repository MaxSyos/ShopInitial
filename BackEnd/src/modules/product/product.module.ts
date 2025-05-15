import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { RedisModule } from '../redis/redis.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    RedisModule,
    PrismaModule,
    CacheModule.registerAsync({
      useFactory: () => ({
        ttl: 300, // 5 minutos em segundos
        max: 100, // máximo de itens em cache
      }),
    }),
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
