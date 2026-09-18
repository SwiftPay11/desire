import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { OrdersModule } from './orders/orders.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { UploadsModule } from './uploads/uploads.module';
import { AddressesModule } from './addressess/addresses.module';
import { CartModule } from './cart/cart.module';
import { PaymentsModule } from './payments/payments.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ScheduleModule } from '@nestjs/schedule';
import { DesireCreditModule } from './desire-credit/desire-credit.module';

import { WishlistModule } from './whishlist/wishlist.module';

import { NotificationsModule } from './notifications/notifications.module';
import { AdminDashboardService } from './admin-dashboard/admin-dashboard.service';
import { AdminDashboardController } from './admin-dashboard/admin-dashboard.controller';
import { AdminDashboardModule } from './admin-dashboard/admin-dashboard.module';
import { CollectionsModule } from './collections/collections.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MongooseModule.forRoot(process.env.MONGO_URI as string),

    OrdersModule,

    AuthModule,

    UsersModule,
    CategoriesModule,
    ProductsModule,
    UploadsModule,
    AddressesModule,
    CartModule,
    PaymentsModule,
    ReviewsModule,
    DesireCreditModule,
    WishlistModule,
    NotificationsModule,
    AdminDashboardModule,
    CollectionsModule,
  ],
  controllers: [AppController, AdminDashboardController],
  providers: [AppService, AdminDashboardService],
})
export class AppModule {}
