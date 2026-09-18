import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Types,
} from 'mongoose';

@Schema()
export class CartItem {
  @Prop({
    type: Types.ObjectId,
    ref: 'Product',
    required: true,
  })
  product: Types.ObjectId;

  @Prop({
    required: true,
    min: 1,
    default: 1,
  })
  quantity: number;

  @Prop({
    required: true,
    trim: true,
  })
  size: string;

  @Prop({
    required: true,
    trim: true,
  })
  color: string;
}

export const CartItemSchema =
  SchemaFactory.createForClass(CartItem);

@Schema({
  timestamps: true,
})
export class Cart {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  user: Types.ObjectId;

  @Prop({
    type: [CartItemSchema],
    default: [],
  })
  items: CartItem[];
}

export type CartDocument =
  HydratedDocument<Cart>;

export const CartSchema =
  SchemaFactory.createForClass(Cart);