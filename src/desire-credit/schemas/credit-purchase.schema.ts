import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Types,
} from 'mongoose';

import { CreditInstallmentPlan } from '../enums/credit-installment-plan.enum';

export enum CreditPurchaseStatus {
  PENDING_COMMITMENT_PAYMENT =
    'PENDING_COMMITMENT_PAYMENT',

  ACTIVE = 'ACTIVE',

  FULLY_PAID = 'FULLY_PAID',

  COMPLETED = 'COMPLETED',

  OVERDUE = 'OVERDUE',

  DEFAULTED = 'DEFAULTED',

  CANCELLED = 'CANCELLED',
}

export type CreditPurchaseDocument =
  HydratedDocument<CreditPurchase>;

@Schema({
  timestamps: true,
})
export class CreditPurchase {
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
    ref: 'Order',
    required: true,
    unique: true,
    index: true,
  })
  order: Types.ObjectId;

  @Prop({
    required: true,
    min: 0,
  })
  orderAmount: number;

  @Prop({
    required: true,
    min: 0,
    default: 5000,
  })
  commitmentPaymentAmount: number;

  @Prop({
    required: true,
    min: 0,
  })
  financedAmount: number;

  @Prop({
    required: true,
    min: 0,
    default: 0,
  })
  amountRepaid: number;

  @Prop({
    required: true,
    min: 0,
  })
  outstandingBalance: number;

  @Prop({
    type: Number,
    enum: [2, 3, 4, 6, 9, 12],
    required: true,
  })
  @Prop({
  type: String,
  enum: CreditInstallmentPlan,
  required: true,
})
installmentPlan: CreditInstallmentPlan;

  @Prop({
    required: true,
    min: 0,
  })
  installmentAmount: number;

  @Prop({
    type: String,
    enum: CreditPurchaseStatus,
    default:
      CreditPurchaseStatus
        .PENDING_COMMITMENT_PAYMENT,
    index: true,
  })
  status: CreditPurchaseStatus;

  @Prop({
    default: false,
  })
  commitmentPaymentPaid: boolean;

  @Prop({
    type: Types.ObjectId,
    ref: 'Payment',
    default: null,
  })
  commitmentPayment: Types.ObjectId | null;

  @Prop({
    trim: true,
    maxlength: 150,
    default: '',
  })
  commitmentPaymentReference: string;

  @Prop({
    type: Date,
    default: null,
  })
  commitmentPaymentPaidAt: Date | null;

  @Prop({
    type: Date,
    default: null,
  })
  activatedAt: Date | null;

  @Prop({
    type: Date,
    default: null,
  })
  firstPaymentDueDate: Date | null;

  @Prop({
    type: Date,
    default: null,
  })
  finalPaymentDueDate: Date | null;

  @Prop({
    type: Date,
    default: null,
  })
  fullyPaidAt: Date | null;

  @Prop({
    type: Date,
    default: null,
  })
  overdueAt: Date | null;

  @Prop({
    type: Date,
    default: null,
  })
  defaultedAt: Date | null;

  @Prop({
    type: Date,
    default: null,
  })
  cancelledAt: Date | null;

  @Prop({
    trim: true,
    maxlength: 1000,
    default: '',
  })
  statusReason: string;

  @Prop({
  trim: true,
  maxlength: 1000,
  default: '',
})
notes: string;
}

export const CreditPurchaseSchema =
  SchemaFactory.createForClass(
    CreditPurchase,
  );

CreditPurchaseSchema.index({
  user: 1,
  createdAt: -1,
});

CreditPurchaseSchema.index({
  creditAccount: 1,
  status: 1,
});

CreditPurchaseSchema.index({
  firstPaymentDueDate: 1,
  status: 1,
});