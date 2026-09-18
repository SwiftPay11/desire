import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  InjectModel,
} from '@nestjs/mongoose';

import {
  Model,
  Types,
} from 'mongoose';

import {
  Notification,
  NotificationDocument,
  NotificationType,
} from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel:
      Model<NotificationDocument>,
  ) {}

  async create(
    userId: string,
    data: {
      type?: NotificationType;
      title: string;
      message: string;
      link?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    const notification =
      await this.notificationModel.create({
        user:
          new Types.ObjectId(userId),

        type:
          data.type ||
          NotificationType.GENERAL,

        title:
          data.title.trim(),

        message:
          data.message.trim(),

        link:
          data.link?.trim() || '',

        read:
          false,

        readAt:
          null,

        metadata:
          data.metadata || {},
      });

    return notification;
  }

  async findMyNotifications(
    userId: string,
  ) {
    const notifications =
      await this.notificationModel
        .find({
          user:
            new Types.ObjectId(userId),
        })
        .sort({
          createdAt: -1,
        });

    return {
      notifications,
    };
  }

  async getUnreadCount(
    userId: string,
  ) {
    const count =
      await this.notificationModel
        .countDocuments({
          user:
            new Types.ObjectId(userId),

          read:
            false,
        });

    return {
      unreadCount: count,
    };
  }

  async markAsRead(
    userId: string,
    notificationId: string,
  ) {
    const notification =
      await this.notificationModel.findOne({
        _id:
          notificationId,

        user:
          new Types.ObjectId(userId),
      });

    if (!notification) {
      throw new NotFoundException(
        'Notification not found',
      );
    }

    if (!notification.read) {
      notification.read =
        true;

      notification.readAt =
        new Date();

      await notification.save();
    }

    return {
      message:
        'Notification marked as read',

      notification,
    };
  }

  async markAllAsRead(
    userId: string,
  ) {
    const now =
      new Date();

    await this.notificationModel.updateMany(
      {
        user:
          new Types.ObjectId(userId),

        read:
          false,
      },
      {
        $set: {
          read:
            true,

          readAt:
            now,
        },
      },
    );

    return {
      message:
        'All notifications marked as read',
    };
  }
}