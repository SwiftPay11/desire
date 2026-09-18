import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import {
  CreditInstallmentPlan,
} from '../enums/credit-installment-plan.enum';

import {
  CreditAccountStatus,
} from '../schemas/credit-account.schema';

export class UpdateCreditAccountDto {
  @IsOptional()
  @IsNumber()
  @Min(5000)
  @Max(1000000)
  creditLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000000)
  commitmentPayment?: number;

  @IsOptional()
  @IsEnum(CreditInstallmentPlan)
  installmentPlan?: CreditInstallmentPlan;

  @IsOptional()
  @IsEnum(CreditAccountStatus)
  status?: CreditAccountStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  statusReason?: string;
}