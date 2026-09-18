import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Order,
  OrderSchema,
} from '../orders/schemas/order.schema';

import {
  Payment,
  PaymentSchema,
} from '../payments/schemas/payment.schema';

import {
  Product,
  ProductSchema,
} from '../products/schemas/product.schema';

import {
  User,
  UserSchema,
} from '../users/schemas/user.schema';

import {
  CreditApplication,
  CreditApplicationSchema,
} from '../desire-credit/schemas/credit-application.schema';

import {
  CreditAccount,
  CreditAccountSchema,
} from '../desire-credit/schemas/credit-account.schema';

import {
  AdminDashboardController,
} from './admin-dashboard.controller';

import {
  AdminDashboardService,
} from './admin-dashboard.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Order.name,
        schema: OrderSchema,
      },
      {
        name: Payment.name,
        schema: PaymentSchema,
      },
      {
        name: Product.name,
        schema: ProductSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: CreditApplication.name,
        schema: CreditApplicationSchema,
      },
      {
        name: CreditAccount.name,
        schema: CreditAccountSchema,
      },
    ]),
  ],

  controllers: [
    AdminDashboardController,
  ],

  providers: [
    AdminDashboardService,
  ],

  exports: [
    AdminDashboardService,
  ],
})
export class AdminDashboardModule {}