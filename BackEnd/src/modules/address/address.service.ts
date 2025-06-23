import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';

@Injectable()
export class AddressService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createAddressDto: CreateAddressDto) {
    return this.prisma.address.create({
      data: {
        ...createAddressDto,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.address.findMany({
      where: {
        userId,
      },
    });
  }

  async findOne(id: string, userId: string) {
    const address = await this.prisma.address.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!address) {
      throw new NotFoundException('Endereço não encontrado');
    }

    return address;
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId); // Verifica se o endereço existe e pertence ao usuário

    return this.prisma.address.delete({
      where: {
        id,
      },
    });
  }

  async setDefault(id: string, userId: string) {
    // Primeiro, remove o status de padrão de todos os endereços do usuário
    await this.prisma.address.updateMany({
      where: {
        userId,
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    });

    // Define o novo endereço padrão
    return this.prisma.address.update({
      where: {
        id,
      },
      data: {
        isDefault: true,
      },
    });
  }
}
