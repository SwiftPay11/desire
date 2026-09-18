import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Types,
} from 'mongoose';

@Schema({
  timestamps: true,
})
export class Address {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
  })
  fullName: string;

  @Prop({
    required: true,
    trim: true,
  })
  phone: string;

  @Prop({
    required: true,
    trim: true,
  })
  addressLine1: string;

  @Prop({
    trim: true,
    default: '',
  })
  addressLine2: string;

  @Prop({
    required: true,
    trim: true,
  })
  city: string;

  @Prop({
    required: true,
    trim: true,
  })
  state: string;

  @Prop({
    required: true,
    trim: true,
  })
  country: string;

  @Prop({
    trim: true,
    default: '',
  })
  postalCode: string;

  @Prop({
    default: false,
  })
  isDefault: boolean;
}

export type AddressDocument =
  HydratedDocument<Address>;

export const AddressSchema =
  SchemaFactory.createForClass(Address);