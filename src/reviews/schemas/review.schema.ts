import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Types,
} from 'mongoose';

export type ReviewDocument =
  HydratedDocument<Review>;

@Schema({
  timestamps: true,
})
export class Review {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true,
  })
  product: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true,
  })
  order: Types.ObjectId;

  @Prop({
    required: true,
    min: 1,
    max: 5,
  })
  rating: number;

  @Prop({
    trim: true,
    maxlength: 150,
    default: '',
  })
  title: string;

  @Prop({
    required: true,
    trim: true,
    maxlength: 2000,
  })
  comment: string;

  @Prop({
    default: true,
    index: true,
  })
  isActive: boolean;

  @Prop({
    default: false,
    index: true,
  })
  isVerifiedPurchase: boolean;
}

export const ReviewSchema =
  SchemaFactory.createForClass(Review);

ReviewSchema.index(
  {
    user: 1,
    product: 1,
    order: 1,
  },
  {
    unique: true,
  },
);