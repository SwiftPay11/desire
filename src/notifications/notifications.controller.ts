import {
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';

import {
  NotificationsService,
} from './notifications.service';

import {
  JwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';

import {
  CurrentUser,
} from '../auth/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService:
      NotificationsService,
  ) {}

  @Get()
  findMyNotifications(
    @CurrentUser() user: any,
  ) {
    return this.notificationsService
      .findMyNotifications(
        user.id,
      );
  }

  @Get('unread-count')
  getUnreadCount(
    @CurrentUser() user: any,
  ) {
    return this.notificationsService
      .getUnreadCount(
        user.id,
      );
  }

  @Patch('read-all')
  markAllAsRead(
    @CurrentUser() user: any,
  ) {
    return this.notificationsService
      .markAllAsRead(
        user.id,
      );
  }

  @Patch(':id/read')
  markAsRead(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.notificationsService
      .markAsRead(
        user.id,
        id,
      );
  }
}