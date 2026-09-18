import {
  Module,
} from '@nestjs/common';

import {
  MongooseModule,
} from '@nestjs/mongoose';

import {
  CollectionsController,
} from './collections.controller';

import {
  CollectionsService,
} from './collections.service';

import {
  Collection,
  CollectionSchema,
} from './schemas/collection.schema';

import {
  Product,
  ProductSchema,
} from '../products/schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Collection.name,
        schema:
          CollectionSchema,
      },
      {
        name: Product.name,
        schema:
          ProductSchema,
      },
    ]),
  ],

  controllers: [
    CollectionsController,
  ],

  providers: [
    CollectionsService,
  ],

  exports: [
    CollectionsService,
    MongooseModule,
  ],
})
export class CollectionsModule {}