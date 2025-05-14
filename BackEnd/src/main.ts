import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuração do Helmet para segurança
  app.use(helmet());

  // Configuração do CORS
  app.enableCors({
    origin: process.env.CORS_ORIGINS.split(','),
    credentials: true,
  });

  // Configuração do Validator global
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

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('E-commerce API')
    .setDescription('API do sistema de e-commerce')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Inicialização do servidor
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Servidor rodando na porta ${port}`);
}
bootstrap();
