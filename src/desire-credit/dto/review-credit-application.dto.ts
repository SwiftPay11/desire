import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

import {
  CreditInstallmentPlan,
} from '../enums/credit-installment-plan.enum';

import {
  CreditApplicationStatus,
} from '../schemas/credit-application.schema';

export class ReviewCreditApplicationDto {
  @IsEnum(CreditApplicationStatus)
  status: CreditApplicationStatus;

  @ValidateIf(
    (dto: ReviewCreditApplicationDto) =>
      dto.status === CreditApplicationStatus.APPROVED,
  )
  @IsNumber()
  @Min(5000)
  @Max(1000000)
  approvedAmount?: number;

  @ValidateIf(
    (dto: ReviewCreditApplicationDto) =>
      dto.status === CreditApplicationStatus.APPROVED,
  )
  @IsEnum(CreditInstallmentPlan)
  approvedInstallmentPlan?: CreditInstallmentPlan;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000000)
  commitmentPayment?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  adminNote?: string;

  @ValidateIf(
    (dto: ReviewCreditApplicationDto) =>
      dto.status === CreditApplicationStatus.REJECTED,
  )
  @IsString()
  @MaxLength(1000)
  rejectionReason?: string;

  @ValidateIf(
    (dto: ReviewCreditApplicationDto) =>
      dto.status ===
      CreditApplicationStatus.MORE_INFORMATION_REQUIRED,
  )
  @IsString()
  @MaxLength(1000)
  informationRequest?: string;
}