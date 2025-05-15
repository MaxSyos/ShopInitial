import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { Request, Response } from 'express';
import { PrometheusService } from './modules/prometheus/prometheus.service';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { LoggerMiddleware } from './middlewares/logger.middleware';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    const app = await NestFactory.create(AppModule);

    // Configuração do Helmet para segurança
    app.use(helmet());

    // Configuração de compressão
    app.use(compression());

    // Middleware de logging
    app.use(new LoggerMiddleware().use);

    // Configuração do CORS
    app.enableCors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
      credentials: true,
    });

    // Configuração de validação global
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Filtro de exceções global
    app.useGlobalFilters(new HttpExceptionFilter());    // Configuração de monitoramento e métricas
    const prometheusService = app.get(PrometheusService);
    app.use('/metrics', async (req: Request, res: Response) => {
      res.set('Content-Type', prometheusService.getContentType());
      res.end(await prometheusService.getMetrics());
    });

    // Configuração do Swagger
    const config = new DocumentBuilder()
      .setTitle('E-commerce API')
      .setDescription('API REST do e-commerce com autenticação JWT')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Autenticação e autorização')
      .addTag('users', 'Gerenciamento de usuários')
      .addTag('products', 'Gerenciamento de produtos')
      .addTag('cart', 'Carrinho de compras')
      .addTag('orders', 'Gerenciamento de pedidos')
      .addTag('payments', 'Processamento de pagamentos')
      .addTag('metrics', 'Métricas e monitoramento')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    // Inicialização do servidor
    const port = process.env.PORT || 3000;
    await app.listen(port);
    logger.log(`Servidor rodando na porta ${port}`);
  } catch (error) {
    logger.error(`Erro ao iniciar o servidor: ${error.message}`);
    process.exit(1);
  }
}

bootstrap().catch((err) => {
  console.error('Erro fatal durante o bootstrap:', err);
  process.exit(1);
});
