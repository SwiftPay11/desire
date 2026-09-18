import {
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class VerifyCommitmentPaymentDto {
  @IsMongoId()
  creditPurchaseId: string;

  @IsMongoId()
  paymentId: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  paymentReference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  adminNote?: string;
}