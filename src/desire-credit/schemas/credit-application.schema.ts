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

export enum CreditApplicationStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  MORE_INFORMATION_REQUIRED = 'MORE_INFORMATION_REQUIRED',
  CANCELLED = 'CANCELLED',
}

export enum EmploymentStatus {
  EMPLOYED = 'EMPLOYED',
  SELF_EMPLOYED = 'SELF_EMPLOYED',
  BUSINESS_OWNER = 'BUSINESS_OWNER',
  STUDENT = 'STUDENT',
  UNEMPLOYED = 'UNEMPLOYED',
  OTHER = 'OTHER',
}

export type CreditApplicationDocument =
  HydratedDocument<CreditApplication>;

@Schema({
  timestamps: true,
})
export class CreditApplication {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user: Types.ObjectId;

  @Prop({
    required: true,
    min: 5000,
  })
  requestedAmount: number;

  @Prop({
    type: String,
    enum: EmploymentStatus,
    required: true,
  })
  employmentStatus: EmploymentStatus;

  @Prop({
    trim: true,
    maxlength: 150,
    default: '',
  })
  employerName: string;

  @Prop({
    trim: true,
    maxlength: 150,
    default: '',
  })
  occupation: string;

  @Prop({
    required: true,
    min: 0,
  })
  monthlyIncome: number;

  @Prop({
    trim: true,
    maxlength: 30,
    required: true,
  })
  phone: string;

  @Prop({
    trim: true,
    lowercase: true,
    maxlength: 150,
    required: true,
  })
  email: string;

  @Prop({
    trim: true,
    maxlength: 250,
    required: true,
  })
  residentialAddress: string;

  @Prop({
    trim: true,
    maxlength: 100,
    required: true,
  })
  city: string;

  @Prop({
    trim: true,
    maxlength: 100,
    required: true,
  })
  state: string;

  @Prop({
    trim: true,
    maxlength: 100,
    default: 'Nigeria',
  })
  country: string;

  @Prop({
    trim: true,
    maxlength: 150,
    required: true,
  })
  nextOfKinName: string;

  @Prop({
    trim: true,
    maxlength: 30,
    required: true,
  })
  nextOfKinPhone: string;

  @Prop({
    trim: true,
    maxlength: 100,
    required: true,
  })
  nextOfKinRelationship: string;

@Prop({
  type: String,
  enum: Object.values(CreditInstallmentPlan),
  required: true,
})
preferredInstallmentPlan: CreditInstallmentPlan;

  @Prop({
    trim: true,
    maxlength: 1000,
    default: '',
  })
  reason: string;

  @Prop({
    type: String,
    enum: CreditApplicationStatus,
    default: CreditApplicationStatus.PENDING,
    index: true,
  })
  status: CreditApplicationStatus;

  @Prop({
    min: 0,
    default: 0,
  })
  approvedAmount: number;

  @Prop({
  type: String,
  enum: CreditInstallmentPlan,
  default: null,
})
approvedInstallmentPlan: CreditInstallmentPlan | null;

@Prop({
  trim: true,
  maxlength: 1000,
  default: '',
})
informationRequest: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    default: null,
  })
  reviewedBy: Types.ObjectId | null;

  @Prop({
    trim: true,
    maxlength: 1000,
    default: '',
  })
  adminNote: string;

  @Prop({
    trim: true,
    maxlength: 1000,
    default: '',
  })
  rejectionReason: string;

  @Prop({
    type: Date,
    default: null,
  })
  reviewedAt: Date | null;

  @Prop({
    type: Date,
    default: null,
  })
  approvedAt: Date | null;

  @Prop({
    type: Date,
    default: null,
  })
  rejectedAt: Date | null;
}

export const CreditApplicationSchema =
  SchemaFactory.createForClass(
    CreditApplication,
  );

CreditApplicationSchema.index({
  user: 1,
  status: 1,
});

CreditApplicationSchema.index({
  createdAt: -1,
});