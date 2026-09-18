import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Types,
} from 'mongoose';

export enum InstallmentStatus {
  PENDING = 'PENDING',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  WAIVED = 'WAIVED',
  CANCELLED = 'CANCELLED',
}

export type InstallmentDocument =
  HydratedDocument<Installment>;

@Schema({
  timestamps: true,
})
export class Installment {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'CreditAccount',
    required: true,
    index: true,
  })
  creditAccount: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'CreditPurchase',
    required: true,
    index: true,
  })
  creditPurchase: Types.ObjectId;

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
  })
  installmentNumber: number;

  @Prop({
    required: true,
    min: 1,
  })
  totalInstallments: number;

  @Prop({
    required: true,
    min: 0,
  })
  amount: number;

  @Prop({
    required: true,
    min: 0,
    default: 0,
  })
  amountPaid: number;

  @Prop({
    required: true,
    min: 0,
  })
  outstandingAmount: number;

  @Prop({
    type: Date,
    required: true,
    index: true,
  })
  dueDate: Date;

  @Prop({
    type: String,
    enum: InstallmentStatus,
    default: InstallmentStatus.PENDING,
    index: true,
  })
  status: InstallmentStatus;

  @Prop({
    type: [Types.ObjectId],
    ref: 'Payment',
    default: [],
  })
  payments: Types.ObjectId[];

  @Prop({
    type: Date,
    default: null,
  })
  firstPaymentAt: Date | null;

  @Prop({
    type: Date,
    default: null,
  })
  paidAt: Date | null;

  @Prop({
    type: Date,
    default: null,
  })
  overdueAt: Date | null;

  @Prop({
    type: Date,
    default: null,
  })
  waivedAt: Date | null;

  @Prop({
    type: Date,
    default: null,
  })
  cancelledAt: Date | null;

  @Prop({
    trim: true,
    maxlength: 150,
    default: '',
  })
  lastPaymentReference: string;

  @Prop({
    trim: true,
    maxlength: 1000,
    default: '',
  })
  adminNote: string;

  @Prop({
    min: 0,
    default: 0,
  })
  lateFee: number;

  @Prop({
    default: false,
  })
  reminderSent: boolean;

  @Prop({
    type: Date,
    default: null,
  })
  reminderSentAt: Date | null;
}

export const InstallmentSchema =
  SchemaFactory.createForClass(
    Installment,
  );

InstallmentSchema.index(
  {
    creditPurchase: 1,
    installmentNumber: 1,
  },
  {
    unique: true,
  },
);

InstallmentSchema.index({
  user: 1,
  status: 1,
  dueDate: 1,
});

InstallmentSchema.index({
  creditAccount: 1,
  status: 1,
});

InstallmentSchema.index({
  dueDate: 1,
  status: 1,
});