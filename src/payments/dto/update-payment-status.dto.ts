import {
  IsEnum,
} from 'class-validator';

import {
  PaymentStatus,
} from '../schemas/payment.schema';

export class UpdatePaymentStatusDto {
  @IsEnum(
    PaymentStatus,
    {
      message:
        'Status must be PENDING, PROCESSING, PAID, FAILED, CANCELLED, or REFUNDED',
    },
  )
  status: PaymentStatus;
}