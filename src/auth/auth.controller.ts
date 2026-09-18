import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AuthService } from './auth.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

import { JwtAuthGuard } from './guards/jwt-auth.guard';

import { CurrentUser } from './decorators/current-user.decorator';

import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

import { Role } from '../common/enums/role.enum';

import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  register(
    @Body() registerDto: RegisterDto,
  ) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  login(
    @Body() loginDto: LoginDto,
  ) {
    return this.authService.login(
      loginDto.email,
      loginDto.password,
    );
  }

  @Get('profile')
@UseGuards(JwtAuthGuard)
profile(@CurrentUser() user: any) {
  return user;
  }

  @Get('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
adminRoute() {
  return {
    message: 'Welcome Admin'
  };
}

@Post('change-password')
@UseGuards(JwtAuthGuard)
changePassword(
  @CurrentUser() user: any,

  @Body()
  changePasswordDto:
    ChangePasswordDto,
) {
  const userId =
    user?.id ??
    user?.userId ??
    user?.sub;

  return this.authService
    .changePassword(
      userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
}
}