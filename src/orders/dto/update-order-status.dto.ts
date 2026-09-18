import {
  IsEnum,
} from 'class-validator';

import {
  OrderStatus,
} from '../schemas/order.schema';

export class UpdateOrderStatusDto {
  @IsEnum(
    OrderStatus,
    {
      message:
        'Status must be PENDING, PROCESSING, SHIPPED, DELIVERED, or CANCELLED',
    },
  )
  status: OrderStatus;
}