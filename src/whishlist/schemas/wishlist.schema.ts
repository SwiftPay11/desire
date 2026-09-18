import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Types,
} from 'mongoose';

import {
  Product,
} from '../../products/schemas/product.schema';

export type WishlistDocument =
  HydratedDocument<Wishlist>;

@Schema({
  timestamps: true,
})
export class Wishlist {
  @Prop({
    type: Types.ObjectId,
    required: true,
    unique: true,
    index: true,
  })
  user: Types.ObjectId;

  @Prop({
    type: [
      {
        product: {
          type: Types.ObjectId,
          ref: Product.name,
          required: true,
        },

        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    default: [],
  })
  items: Array<{
    product: Types.ObjectId;
    addedAt: Date;
  }>;
}

export const WishlistSchema =
  SchemaFactory.createForClass(
    Wishlist,
  );

