import {
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class RecordInstallmentPaymentDto {
  @IsMongoId()
  installmentId: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsMongoId()
  paymentId: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  paymentReference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}