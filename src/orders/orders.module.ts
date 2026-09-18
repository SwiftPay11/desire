import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Order,
  OrderSchema,
} from './schemas/order.schema';

import {
  Cart,
  CartSchema,
} from '../cart/schemas/cart.schema';

import {
  Product,
  ProductSchema,
} from '../products/schemas/product.schema';

import {
  Address,
  AddressSchema,
} from '../addressess/schemas/address.schema';

import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Order.name,
        schema: OrderSchema,
      },
      {
        name: Cart.name,
        schema: CartSchema,
      },
      {
        name: Product.name,
        schema: ProductSchema,
      },
      {
        name: Address.name,
        schema: AddressSchema,
      },
    ]),
  ],

  controllers: [
    OrdersController,
  ],

  providers: [
    OrdersService,
  ],

  exports: [
    OrdersService,
  ],
})
export class OrdersModule {}