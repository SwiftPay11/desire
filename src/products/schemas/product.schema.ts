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
  Category,
} from '../../categories/schemas/category.schema';

export type ProductDocument =
  HydratedDocument<Product>;

@Schema({
  timestamps: true,
})
export class Product {
  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  slug: string;

  @Prop({
    default: '',
  })
  description: string;

  @Prop({
    required: true,
    unique: true,
    trim: true,
  })
  sku: string;

  @Prop({
    required: true,
    min: 0,
  })
  price: number;

  @Prop({
    default: 0,
    min: 0,
  })
  compareAtPrice: number;

  @Prop({
    type: Types.ObjectId,
    ref: Category.name,
    required: true,
  })
  category: Types.ObjectId;

  @Prop({
    type: [String],
    default: [],
  })
  images: string[];

  @Prop({
    type: [String],
    default: [],
  })
  sizes: string[];

  @Prop({
    type: [String],
    default: [],
  })
  colors: string[];

  @Prop({
    default: 0,
    min: 0,
  })
  stock: number;

  @Prop({
    default: false,
  })
  featured: boolean;

  @Prop({
    default: true,
  })
  isActive: boolean;
}

export const ProductSchema =
  SchemaFactory.createForClass(Product);