import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Types,
} from 'mongoose';

export enum PaymentProvider {
  MANUAL = 'MANUAL',
  PAYSTACK = 'PAYSTACK',
  FLUTTERWAVE = 'FLUTTERWAVE',
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  CRYPTO = 'CRYPTO',
}

export enum PaymentPurpose {
  ORDER = 'ORDER',

  DESIRE_CREDIT_COMMITMENT =
    'DESIRE_CREDIT_COMMITMENT',

  DESIRE_CREDIT_INSTALLMENT =
    'DESIRE_CREDIT_INSTALLMENT',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export type PaymentDocument =
  HydratedDocument<Payment>;

@Schema({
  timestamps: true,
})
export class Payment {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true,
  })
  order: Types.ObjectId;

  @Prop({
    required: true,
    unique: true,
    trim: true,
    index: true,
  })
  reference: string;

  @Prop({
    required: true,
    min: 0,
  })
  amount: number;

  @Prop({
    required: true,
    trim: true,
    uppercase: true,
    default: 'NGN',
  })
  currency: string;

  @Prop({
    type: String,
    enum: PaymentProvider,
    default: PaymentProvider.MANUAL,
    index: true,
  })
  provider: PaymentProvider;

  @Prop({
    type: String,
    enum: PaymentPurpose,
    default: PaymentPurpose.ORDER,
    index: true,
  })
  purpose: PaymentPurpose;

  @Prop({
    type: String,
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
    index: true,
  })
  status: PaymentStatus;

  @Prop({
    trim: true,
    default: '',
  })
  providerReference: string;

  @Prop({
    trim: true,
    default: '',
  })
  paymentUrl: string;

  @Prop({
    trim: true,
    default: '',
  })
  proofOfPaymentUrl: string;

  @Prop({
    trim: true,
    maxlength: 150,
    default: '',
  })
  senderName: string;

  @Prop({
    trim: true,
    maxlength: 150,
    default: '',
  })
  transferReference: string;

  @Prop({
    type: Date,
    default: null,
  })
  transferDate: Date | null;

  @Prop({
    min: 0,
    default: 0,
  })
  submittedAmount: number;

  @Prop({
    trim: true,
    maxlength: 1000,
    default: '',
  })
  customerNote: string;

  @Prop({
    type: Date,
    default: null,
  })
  submittedAt: Date | null;

  @Prop({
    trim: true,
    default: '',
  })
  failureReason: string;

  @Prop({
    type: Object,
    default: {},
  })
  metadata: Record<string, unknown>;

  @Prop({
    type: Date,
    default: null,
  })
  paidAt: Date | null;

  @Prop({
    type: Date,
    default: null,
  })
  verifiedAt: Date | null;
}

export const PaymentSchema =
  SchemaFactory.createForClass(Payment);