import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';

import {
  UsersService,
} from './users.service';

import {
  JwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';

import {
  RolesGuard,
} from '../auth/guards/roles.guard';

import {
  CurrentUser,
} from '../auth/decorators/current-user.decorator';

import {
  Roles,
} from '../auth/decorators/roles.decorator';

import {
  Role,
} from '../common/enums/role.enum';

import {
  UpdateProfileDto,
} from './dto/update-profile.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService:
      UsersService,
  ) {}

  // ==========================
  // CUSTOMER ROUTES
  // ==========================

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(
    @CurrentUser() user: any,
  ) {
    return this.usersService.getMe(
      user.id,
    );
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMe(
    @CurrentUser() user: any,

    @Body()
    updateProfileDto:
      UpdateProfileDto,
  ) {
    return this.usersService.updateMe(
      user.id,
      updateProfileDto,
    );
  }

  // ==========================
  // ADMIN CUSTOMER ROUTES
  // ==========================

  @Get('admin/customers')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(Role.ADMIN)
  getAdminCustomers() {
    return this.usersService.getAdminCustomers();
  }

  @Get('admin/customers/:id')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(Role.ADMIN)
  getAdminCustomer(
    @Param('id')
    id: string,
  ) {
    return this.usersService.getAdminCustomer(
      id,
    );
  }
}