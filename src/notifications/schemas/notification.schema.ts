import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Types,
} from 'mongoose';

export enum NotificationType {
  GENERAL = 'GENERAL',

  ORDER = 'ORDER',

  PAYMENT = 'PAYMENT',

  DESIRE_CREDIT = 'DESIRE_CREDIT',

  ACCOUNT = 'ACCOUNT',
}

export type NotificationDocument =
  HydratedDocument<Notification>;

@Schema({
  timestamps: true,
})
export class Notification {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user: Types.ObjectId;

  @Prop({
    type: String,
    enum: NotificationType,
    default: NotificationType.GENERAL,
    index: true,
  })
  type: NotificationType;

  @Prop({
    required: true,
    trim: true,
    maxlength: 150,
  })
  title: string;

  @Prop({
    required: true,
    trim: true,
    maxlength: 1000,
  })
  message: string;

  @Prop({
    trim: true,
    default: '',
  })
  link: string;

  @Prop({
    default: false,
    index: true,
  })
  read: boolean;

  @Prop({
    type: Date,
    default: null,
  })
  readAt: Date | null;

  @Prop({
    type: Object,
    default: {},
  })
  metadata: Record<string, unknown>;
}

export const NotificationSchema =
  SchemaFactory.createForClass(
    Notification,
  );

NotificationSchema.index({
  user: 1,
  createdAt: -1,
});

NotificationSchema.index({
  user: 1,
  read: 1,
  createdAt: -1,
});