import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

import {
  PaymentProvider,
  PaymentPurpose,
} from '../schemas/payment.schema';

export class CreatePaymentDto {
  @IsMongoId()
  orderId: string;

  @IsEnum(
    PaymentProvider,
    {
      message:
        'Provider must be MANUAL, PAYSTACK, FLUTTERWAVE, STRIPE, PAYPAL, or CRYPTO',
    },
  )
  provider: PaymentProvider;

  @IsOptional()
  @IsEnum(PaymentPurpose)
  purpose?: PaymentPurpose;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsOptional()
  @IsMongoId()
  creditPurchaseId?: string;

  @IsOptional()
  @IsMongoId()
  installmentId?: string;
}