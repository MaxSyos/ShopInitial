import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, Put } from '@nestjs/common';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequestWithUser } from '../../interfaces/request-with-user.interface';

@ApiTags('addresses')
@ApiBearerAuth()
@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  create(@Request() req: RequestWithUser, @Body() createAddressDto: CreateAddressDto) {
    return this.addressService.create(req.user.id, createAddressDto);
  }

  @Get()
  findAll(@Request() req: RequestWithUser) {
    return this.addressService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.addressService.findOne(id, req.user.id);
  }

  @Delete(':id')
  remove(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.addressService.remove(id, req.user.id);
  }

  @Put(':id/default')
  setDefault(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.addressService.setDefault(id, req.user.id);
  }
}
