import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);

    // Configurações globais
    app.use(compression());
    app.use(helmet());
    app.enableCors();

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
      .setTitle('Shop API')
      .setDescription('API para o sistema de e-commerce')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    // Inicialização do servidor
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`Servidor rodando na porta ${port}`);
  } catch (error) {
    console.error(`Erro ao iniciar o servidor: ${error.message}`);
    process.exit(1);
  }
}

bootstrap().catch((err) => {
  console.error('Erro fatal durante o bootstrap:', err);
  process.exit(1);
});
