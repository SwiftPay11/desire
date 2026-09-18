import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Types,
} from 'mongoose';

export enum OrderStatus {
  PENDING = 'PENDING',
  AWAITING_COMMITMENT_PAYMENT =
    'AWAITING_COMMITMENT_PAYMENT',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

@Schema({
  _id: false,
})
export class OrderItem {
  @Prop({
    type: Types.ObjectId,
    ref: 'Product',
    required: true,
  })
  product: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    required: true,
    trim: true,
  })
  slug: string;

  @Prop({
    required: true,
    min: 0,
  })
  price: number;

  @Prop({
    required: true,
    min: 1,
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

  @Prop({
    default: '',
  })
  image: string;

  @Prop({
    required: true,
    min: 0,
  })
  subtotal: number;
}

export const OrderItemSchema =
  SchemaFactory.createForClass(
    OrderItem,
  );

@Schema({
  _id: false,
})
export class ShippingAddress {
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
    default: '',
    trim: true,
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
    default: '',
    trim: true,
  })
  postalCode: string;
}

export const ShippingAddressSchema =
  SchemaFactory.createForClass(
    ShippingAddress,
  );

@Schema({
  timestamps: true,
})
export class Order {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user: Types.ObjectId;

  @Prop({
    required: true,
    unique: true,
    index: true,
    trim: true,
  })
  orderNumber: string;

  @Prop({
    type: [OrderItemSchema],
    required: true,
  })
  items: OrderItem[];

  @Prop({
    type: ShippingAddressSchema,
    required: true,
  })
  shippingAddress: ShippingAddress;

  @Prop({
    required: true,
    min: 0,
  })
  subtotal: number;

  @Prop({
    default: 0,
    min: 0,
  })
  shippingFee: number;

  @Prop({
    default: 0,
    min: 0,
  })
  discount: number;

  @Prop({
    required: true,
    min: 0,
  })
  totalAmount: number;

  @Prop({
    enum: OrderStatus,
    default: OrderStatus.PENDING,
    index: true,
  })
  status: OrderStatus;

  @Prop({
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
    index: true,
  })
  paymentStatus: PaymentStatus;

  @Prop({
    default: '',
    trim: true,
  })
  paymentReference: string;

  // Prevents stock from ever being deducted
  // more than once for the same order.
  @Prop({
    default: false,
    index: true,
  })
  inventoryDeducted: boolean;

  @Prop({
    type: Date,
    default: null,
  })
  inventoryDeductedAt: Date | null;

  @Prop({
    default: '',
    trim: true,
  })
  inventoryPaymentReference: string;

  @Prop({
    default: '',
    trim: true,
  })
  notes: string;
}

export type OrderDocument =
  HydratedDocument<Order>;

export const OrderSchema =
  SchemaFactory.createForClass(Order);