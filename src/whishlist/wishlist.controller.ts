import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  WishlistService,
} from './wishlist.service';

import {
  JwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';

import {
  CurrentUser,
} from '../auth/decorators/current-user.decorator';

import {
  AddWishlistItemDto,
} from './dto/add-wishlist-item.dto';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(
    private readonly wishlistService:
      WishlistService,
  ) {}

  @Get()
  getWishlist(
    @CurrentUser() user: any,
  ) {
    return this.wishlistService
      .getWishlist(
        user.id,
      );
  }

  @Post('items')
  addItem(
    @CurrentUser() user: any,

    @Body()
    dto: AddWishlistItemDto,
  ) {
    return this.wishlistService
      .addItem(
        user.id,
        dto,
      );
  }

  @Get('items/:productId/check')
  containsProduct(
    @CurrentUser() user: any,

    @Param('productId')
    productId: string,
  ) {
    return this.wishlistService
      .containsProduct(
        user.id,
        productId,
      );
  }

  @Delete('items/:productId')
  removeItem(
    @CurrentUser() user: any,

    @Param('productId')
    productId: string,
  ) {
    return this.wishlistService
      .removeItem(
        user.id,
        productId,
      );
  }

  @Delete()
  clearWishlist(
    @CurrentUser() user: any,
  ) {
    return this.wishlistService
      .clearWishlist(
        user.id,
      );
  }
}