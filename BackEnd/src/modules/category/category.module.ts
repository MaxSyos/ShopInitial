import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { PrismaService } from '../../services/prisma.service';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService, PrismaService],
  exports: [CategoryService], // Exporta o serviço para uso em outros módulos
})
export class CategoryModule {}
