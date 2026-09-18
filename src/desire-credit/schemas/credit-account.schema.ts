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

export enum CreditAccountStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  FROZEN = 'FROZEN',
  CLOSED = 'CLOSED',
}

export type CreditAccountDocument =
  HydratedDocument<CreditAccount>;

@Schema({
  timestamps: true,
})
export class CreditAccount {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  user: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'CreditApplication',
    required: true,
    unique: true,
    index: true,
  })
  application: Types.ObjectId;

  @Prop({
    required: true,
    min: 0,
  })
  creditLimit: number;

  @Prop({
    required: true,
    min: 0,
    default: 0,
  })
  usedCredit: number;

  @Prop({
    required: true,
    min: 0,
  })
  availableCredit: number;

  @Prop({
    required: true,
    min: 0,
    default: 5000,
  })
  commitmentPayment: number;

  @Prop({
  type: String,
  enum: CreditInstallmentPlan,
  required: true,
})
installmentPlan: CreditInstallmentPlan;

  @Prop({
    type: String,
    enum: CreditAccountStatus,
    default: CreditAccountStatus.ACTIVE,
    index: true,
  })
  status: CreditAccountStatus;

  @Prop({
    min: 0,
    default: 0,
  })
  totalBorrowed: number;

  @Prop({
    min: 0,
    default: 0,
  })
  totalRepaid: number;

  @Prop({
    min: 0,
    default: 0,
  })
  outstandingBalance: number;

  @Prop({
    min: 0,
    default: 0,
  })
  overdueBalance: number;

  @Prop({
    min: 0,
    default: 0,
  })
  missedPayments: number;

  @Prop({
    type: Date,
    default: null,
  })
  nextPaymentDueDate: Date | null;

  @Prop({
    min: 0,
    default: 0,
  })
  nextPaymentAmount: number;

  @Prop({
    type: Date,
    default: null,
  })
  lastPaymentAt: Date | null;

  @Prop({
    type: Date,
    default: null,
  })
  activatedAt: Date | null;

  @Prop({
    type: Date,
    default: null,
  })
  suspendedAt: Date | null;

  @Prop({
    type: Date,
    default: null,
  })
  frozenAt: Date | null;

  @Prop({
    type: Date,
    default: null,
  })
  closedAt: Date | null;

  @Prop({
    trim: true,
    maxlength: 1000,
    default: '',
  })
  statusReason: string;
}

export const CreditAccountSchema =
  SchemaFactory.createForClass(
    CreditAccount,
  );

CreditAccountSchema.index({
  status: 1,
  createdAt: -1,
});

CreditAccountSchema.index({
  overdueBalance: -1,
});

CreditAccountSchema.index({
  nextPaymentDueDate: 1,
});