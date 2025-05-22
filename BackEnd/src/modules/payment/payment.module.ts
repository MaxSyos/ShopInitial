import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { NotificationModule } from '../notification/notification.module';
import { PrismaService } from '../../services/prisma.service';
import { RedisModule } from '../redis/redis.module';
import { MercadoPagoProvider } from './providers/mercadopago.provider';
import { StripeProvider } from './providers/stripe.provider';

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
    StripeProvider,
  ],
  exports: [PaymentService, MercadoPagoProvider, StripeProvider],
})
export class PaymentModule {}
