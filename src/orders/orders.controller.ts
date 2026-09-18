import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { OrdersService } from './orders.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { Roles } from '../auth/decorators/roles.decorator';

import { Role } from '../common/enums/role.enum';

import { CreateOrderDto } from './dto/create-order.dto';

import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService:
      OrdersService,
  ) {}

  // ==========================
  // USER ROUTES
  // ==========================

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: any,

    @Body()
    createOrderDto:
      CreateOrderDto,
  ) {
    return this.ordersService.create(
      user.id,
      createOrderDto,
    );
  }

  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  findMyOrders(
    @CurrentUser() user: any,
  ) {
    return this.ordersService.findMyOrders(
      user.id,
    );
  }

  @Get('my-orders/:id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @CurrentUser() user: any,

    @Param('id')
    id: string,
  ) {
    return this.ordersService.findOne(
      user.id,
      id,
    );
  }

  // ==========================
  // ADMIN ROUTES
  // ==========================

  @Get()
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(Role.ADMIN)
  findAll() {
    return this.ordersService.findAll();
  }

  @Get('admin/:id')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(Role.ADMIN)
  findOneAdmin(
    @Param('id')
    id: string,
  ) {
    return this.ordersService.findOneAdmin(
      id,
    );
  }

  @Patch(':id/status')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(Role.ADMIN)
  updateStatus(
    @Param('id')
    id: string,

    @Body()
    updateOrderStatusDto:
      UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(
      id,
      updateOrderStatusDto,
    );
  }

  @Patch(':id/payment-status')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(Role.ADMIN)
  updatePaymentStatus(
    @Param('id')
    id: string,

    @Body()
    updatePaymentStatusDto:
      UpdatePaymentStatusDto,
  ) {
    return this.ordersService.updatePaymentStatus(
      id,
      updatePaymentStatusDto,
    );
  }
}