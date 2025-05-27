import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as express from 'express';
import type { Request, Response } from 'express';
import { PrometheusService } from './modules/prometheus/prometheus.service';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { LoggerMiddleware } from './middlewares/logger.middleware';

const compression = require('compression');

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    const app = await NestFactory.create(AppModule, {
      rawBody: true // Habilitando raw body
    });

    // Configuração do Helmet para segurança
    app.use(helmet());

    // Configuração de compressão
    app.use(compression());

    // Middleware de logging
    app.use(new LoggerMiddleware().use);

    // Prefixo global para todas as rotas
    app.setGlobalPrefix('api');

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
        disableErrorMessages: false,
        validateCustomDecorators: true,
        exceptionFactory: (errors) => {
          console.log('🚫 [Validation] Erros de validação:', JSON.stringify(errors, null, 2));
          const formattedErrors = errors.map(error => ({
            property: error.property,
            value: error.value,
            constraints: error.constraints
          }));
          return new BadRequestException(formattedErrors);
        }
      }),
    );

    // Filtro de exceções global
    app.useGlobalFilters(new HttpExceptionFilter());

    // Configuração de monitoramento e métricas
    const prometheusService = app.get(PrometheusService);
    app.use('/metrics', async (req: Request, res: Response) => {
      res.set('Content-Type', prometheusService.getContentType());
      res.end(await prometheusService.getMetrics());
    });

    // Configuração do Swagger
    const config = new DocumentBuilder()
      .setTitle('Shop Initial API')
      .setDescription(`
API de E-commerce desenvolvida com NestJS

Principais recursos:
- 🔐 Autenticação segura via JWT
- 👥 Gestão completa de usuários
- 🏪 Catálogo dinâmico de produtos
- 📊 Métricas e monitoramento

Para começar:
1. Faça login ou crie uma conta em /auth/register
2. Use o token JWT recebido no header Authorization
3. Explore os endpoints disponíveis em cada seção`)
      .setVersion('1.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('Auth', 'Sistema de autenticação com JWT, registro de usuários e gerenciamento de tokens')
      .addTag('Users', 'Gerenciamento de usuários com perfis personalizados, preferências e configurações de conta')
      .addTag('Products', 'Catálogo de produtos com filtros avançados, ordenação customizada e busca inteligente')
      .addTag('Categories', 'Sistema hierárquico de categorias com suporte a subcategorias e organização de produtos')
      .addTag('Brands', 'Gerenciamento de marcas com informações detalhadas e associação de produtos')
      .addTag('Cart', 'Sistema de carrinho de compras com gestão de itens, quantidades e cálculos automáticos')
      .addTag('Orders', 'Gestão completa de pedidos com rastreamento em tempo real e histórico detalhado')
      .addTag('Reviews', 'Sistema de avaliações com suporte a comentários, notas e moderação de conteúdo')
      .addTag('Addresses', 'Gerenciamento de múltiplos endereços com validação e formatação automática')
      .addTag('Favorites', 'Sistema de lista de desejos com sincronização e notificações de disponibilidade')
      .addTag('Payments', 'Processamento seguro de pagamentos com múltiplos métodos e histórico de transações')
      .addTag('Health', 'Monitoramento de saúde do sistema com verificações de dependências e serviços')
      .addTag('Metrics', 'Coleta e análise de métricas de performance, uso e comportamento do sistema')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        displayRequestDuration: true,
        defaultModelExpandDepth: 3,
        defaultModelsExpandDepth: 3,
        showExtensions: true,
        showCommonExtensions: true,
        tryItOutEnabled: true,
        showRequestDuration: true,
      },
      customSiteTitle: 'Shop Initial API Docs',
    });

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
