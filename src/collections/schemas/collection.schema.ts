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

export type CollectionDocument =
  HydratedDocument<Collection>;

@Schema({
  timestamps: true,
})
export class Collection {
  @Prop({
    required: true,
    trim: true,
    unique: true,
  })
  name: string;

  @Prop({
    required: true,
    trim: true,
    unique: true,
    lowercase: true,
  })
  slug: string;

  @Prop({
    trim: true,
    default: '',
  })
  description: string;

  @Prop({
    trim: true,
    default: '',
  })
  coverImage: string;

  @Prop({
    type: [
      {
        type: Types.ObjectId,
        ref: Product.name,
      },
    ],
    default: [],
  })
  products: Types.ObjectId[];

  @Prop({
    default: false,
  })
  featured: boolean;

  @Prop({
    default: true,
  })
  isActive: boolean;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  sortOrder: number;
}

export const CollectionSchema =
  SchemaFactory.createForClass(
    Collection,
  );