import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { NotificationModule } from '../notification/notification.module';
import { PrismaService } from '../../services/prisma.service';
import { RedisModule } from '../redis/redis.module';
import { MercadoPagoProvider } from './providers/mercadopago.provider';

@Module({
  imports: [
    ConfigModule,
    NotificationModule,
    RedisModule,
  ],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    PrismaService,
    MercadoPagoProvider,
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
