import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import {
  CreditInstallmentPlan,
} from '../enums/credit-installment-plan.enum';

import {
  EmploymentStatus,
} from '../schemas/credit-application.schema';

export class ApplyCreditDto {
  @IsNumber()
  @Min(5000)
  @Max(1000000)
  requestedAmount: number;

  @IsEnum(EmploymentStatus)
  employmentStatus: EmploymentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  employerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  occupation?: string;

  @IsNumber()
  @Min(0)
  @Max(100000000)
  monthlyIncome: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phone: string;

  @IsEmail()
  @MaxLength(150)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  residentialAddress: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  state: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nextOfKinName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  nextOfKinPhone: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nextOfKinRelationship: string;

  @IsEnum(CreditInstallmentPlan)
  preferredInstallmentPlan: CreditInstallmentPlan;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}