import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AddressesService } from './addresses.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(
    private readonly addressesService: AddressesService,
  ) {}

  @Post()
  create(
    @CurrentUser() user: any,
    @Body() createAddressDto: CreateAddressDto,
  ) {
    return this.addressesService.create(
      user.id,
      createAddressDto,
    );
  }

  @Get()
  findAll(
    @CurrentUser() user: any,
  ) {
    return this.addressesService.findAllForUser(
      user.id,
    );
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.addressesService.findOneForUser(
      user.id,
      id,
    );
  }

  @Patch(':id')
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.addressesService.update(
      user.id,
      id,
      updateAddressDto,
    );
  }

  @Patch(':id/default')
  setDefault(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.addressesService.setDefault(
      user.id,
      id,
    );
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.addressesService.remove(
      user.id,
      id,
    );
  }
}