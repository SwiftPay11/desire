import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import {
  Type,
} from 'class-transformer';

export class SubmitPaymentProofDto {
  @IsString()
@MinLength(1)
proofOfPaymentUrl: string;

  @IsString()
  @MaxLength(150)
  senderName: string;

  @IsString()
  @MaxLength(150)
  transferReference: string;

  @IsDateString()
  transferDate: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  submittedAmount: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  customerNote?: string;
}