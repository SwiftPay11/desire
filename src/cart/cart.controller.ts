import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(
    private readonly cartService: CartService,
  ) {}

  @Get()
  getCart(
    @CurrentUser() user: any,
  ) {
    return this.cartService.getCart(
      user.id,
    );
  }

  @Post('items')
  addItem(
    @CurrentUser() user: any,
    @Body() addCartItemDto: AddCartItemDto,
  ) {
    return this.cartService.addItem(
      user.id,
      addCartItemDto,
    );
  }

  @Patch('items/:itemId')
  updateItem(
    @CurrentUser() user: any,
    @Param('itemId') itemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(
      user.id,
      itemId,
      updateCartItemDto,
    );
  }

  @Delete('items/:itemId')
  removeItem(
    @CurrentUser() user: any,
    @Param('itemId') itemId: string,
  ) {
    return this.cartService.removeItem(
      user.id,
      itemId,
    );
  }

  @Delete()
  clearCart(
    @CurrentUser() user: any,
  ) {
    return this.cartService.clearCart(
      user.id,
    );
  }
}