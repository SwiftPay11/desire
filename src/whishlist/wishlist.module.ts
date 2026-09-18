import {
  Module,
} from '@nestjs/common';

import {
  MongooseModule,
} from '@nestjs/mongoose';

import {
  Wishlist,
  WishlistSchema,
} from './schemas/wishlist.schema';

import {
  Product,
  ProductSchema,
} from '../products/schemas/product.schema';

import {
  WishlistController,
} from './wishlist.controller';

import {
  WishlistService,
} from './wishlist.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Wishlist.name,
        schema:
          WishlistSchema,
      },

      {
        name: Product.name,
        schema:
          ProductSchema,
      },
    ]),
  ],

  controllers: [
    WishlistController,
  ],

  providers: [
    WishlistService,
  ],

  exports: [
    WishlistService,
  ],
})
export class WishlistModule {}