import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  CreditApplication,
  CreditApplicationSchema,
} from './schemas/credit-application.schema';

import {
  CreditAccount,
  CreditAccountSchema,
} from './schemas/credit-account.schema';

import {
  CreditPurchase,
  CreditPurchaseSchema,
} from './schemas/credit-purchase.schema';

import {
  Installment,
  InstallmentSchema,
} from './schemas/installment.schema';

import {
  Payment,
  PaymentSchema,
} from '../payments/schemas/payment.schema';

import {
  Order,
  OrderSchema,
} from '../orders/schemas/order.schema';

import {
  DesireCreditController,
} from './desire-credit.controller';

import {
  DesireCreditService,
} from './desire-credit.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: CreditApplication.name,
        schema: CreditApplicationSchema,
      },
      {
        name: CreditAccount.name,
        schema: CreditAccountSchema,
      },
      {
        name: CreditPurchase.name,
        schema: CreditPurchaseSchema,
      },
      {
        name: Installment.name,
        schema: InstallmentSchema,
      },
      {
        name: Payment.name,
        schema: PaymentSchema,
      },
      {
        name: Order.name,
        schema: OrderSchema,
      },
    ]),
  ],

  controllers: [
    DesireCreditController,
  ],

  providers: [
    DesireCreditService,
  ],

  exports: [
    DesireCreditService,
    MongooseModule,
  ],
})
export class DesireCreditModule {}