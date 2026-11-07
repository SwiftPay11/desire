import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Payment,
  PaymentSchema,
} from './schemas/payment.schema';

import {
  Order,
  OrderSchema,
} from '../orders/schemas/order.schema';

import {
  Product,
  ProductSchema,
} from '../products/schemas/product.schema';

import {
  CreditPurchase,
  CreditPurchaseSchema,
} from '../desire-credit/schemas/credit-purchase.schema';

import {
  Installment,
  InstallmentSchema,
} from '../desire-credit/schemas/installment.schema';

import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

import { NotificationsModule } from '../notifications/notifications.module';

// Required for UsersService injection
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Payment.name,
        schema: PaymentSchema,
      },
      {
        name: Order.name,
        schema: OrderSchema,
      },
      {
        name: Product.name,
        schema: ProductSchema,
      },
      {
        name: CreditPurchase.name,
        schema: CreditPurchaseSchema,
      },
      {
        name: Installment.name,
        schema: InstallmentSchema,
      },
    ]),

    NotificationsModule,

    UsersModule,
  ],

  controllers: [
    PaymentsController,
  ],

  providers: [
    PaymentsService,
  ],

  exports: [
    PaymentsService,
  ],
})
export class PaymentsModule {}