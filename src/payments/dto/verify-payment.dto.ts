import {
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class VerifyPaymentDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  providerReference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  failureReason?: string;
}