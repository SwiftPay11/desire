import {
  IsEnum,
} from 'class-validator';

import {
  PaymentStatus,
} from '../schemas/order.schema';

export class UpdatePaymentStatusDto {
  @IsEnum(
    PaymentStatus,
    {
      message:
        'Payment status must be PENDING, PAID, FAILED, or REFUNDED',
    },
  )
  paymentStatus: PaymentStatus;
}