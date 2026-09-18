import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import {
  CreditInstallmentPlan,
} from '../enums/credit-installment-plan.enum';

export class CreateCreditPurchaseDto {
  @IsMongoId()
  orderId: string;

  @IsEnum(CreditInstallmentPlan)
  installmentPlan: CreditInstallmentPlan;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}