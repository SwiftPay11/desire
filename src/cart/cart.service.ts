import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  InjectModel,
} from '@nestjs/mongoose';

import {
  Model,
  Types,
} from 'mongoose';

import {
  Cart,
  CartDocument,
} from './schemas/cart.schema';

import {
  Product,
  ProductDocument,
} from '../products/schemas/product.schema';

import {
  AddCartItemDto,
} from './dto/add-cart-item.dto';

import {
  UpdateCartItemDto,
} from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name)
    private readonly cartModel:
      Model<CartDocument>,

    @InjectModel(Product.name)
    private readonly productModel:
      Model<ProductDocument>,
  ) {}

  async getCart(
    userId: string,
  ) {
    const cart =
      await this.findOrCreateCart(
        userId,
      );

    await cart.populate({
      path: 'items.product',
      select:
        'name slug price images stock sizes colors isActive',
    });

    return this.buildCartResponse(
      cart,
    );
  }

  async addItem(
    userId: string,
    addCartItemDto: AddCartItemDto,
  ) {
    const product =
      await this.productModel.findById(
        addCartItemDto.productId,
      );

    if (!product) {
      throw new NotFoundException(
        'Product not found',
      );
    }

    if (!product.isActive) {
      throw new BadRequestException(
        'This product is currently unavailable',
      );
    }

    this.validateVariant(
      product,
      addCartItemDto.size,
      addCartItemDto.color,
    );

    if (
      addCartItemDto.quantity >
      product.stock
    ) {
      throw new BadRequestException(
        `Only ${product.stock} item(s) are available`,
      );
    }

    const cart =
      await this.findOrCreateCart(
        userId,
      );

    const existingItem =
      cart.items.find(
        (item: any) =>
          item.product &&
          item.product.toString() ===
            product._id.toString() &&
          item.size.toLowerCase() ===
            addCartItemDto.size
              .trim()
              .toLowerCase() &&
          item.color.toLowerCase() ===
            addCartItemDto.color
              .trim()
              .toLowerCase(),
      );

    if (existingItem) {
      const newQuantity =
        existingItem.quantity +
        addCartItemDto.quantity;

      if (newQuantity > 20) {
        throw new BadRequestException(
          'Cart item quantity cannot exceed 20',
        );
      }

      if (
        newQuantity >
        product.stock
      ) {
        throw new BadRequestException(
          `Only ${product.stock} item(s) are available`,
        );
      }

      existingItem.quantity =
        newQuantity;
    } else {
      cart.items.push({
        product:
          product._id as Types.ObjectId,

        quantity:
          addCartItemDto.quantity,

        size:
          addCartItemDto.size.trim(),

        color:
          addCartItemDto.color.trim(),
      });
    }

    await cart.save();

    return {
      message:
        'Product added to cart successfully',

      ...(await this.getCart(userId)),
    };
  }

  async updateItem(
    userId: string,
    itemId: string,
    updateCartItemDto: UpdateCartItemDto,
  ) {
    const cart =
      await this.findOrCreateCart(
        userId,
      );

    const item =
      cart.items.find(
        (cartItem: any) =>
          cartItem._id?.toString() ===
          itemId,
      );

    if (!item) {
      throw new NotFoundException(
        'Cart item not found',
      );
    }

    if (!item.product) {
      throw new BadRequestException(
        'This cart item is no longer available',
      );
    }

    const product =
      await this.productModel.findById(
        item.product,
      );

    if (!product) {
      /*
       * This should normally already have
       * been cleaned by findOrCreateCart(),
       * but this remains as an extra safety
       * check.
       */
      await this.removeCartItemById(
        cart,
        itemId,
      );

      throw new NotFoundException(
        'Product no longer exists and has been removed from your cart',
      );
    }

    if (!product.isActive) {
      throw new BadRequestException(
        'This product is currently unavailable',
      );
    }

    const nextSize =
      updateCartItemDto.size?.trim() ??
      item.size;

    const nextColor =
      updateCartItemDto.color?.trim() ??
      item.color;

    const nextQuantity =
      updateCartItemDto.quantity ??
      item.quantity;

    this.validateVariant(
      product,
      nextSize,
      nextColor,
    );

    if (
      nextQuantity >
      product.stock
    ) {
      throw new BadRequestException(
        `Only ${product.stock} item(s) are available`,
      );
    }

    const duplicateVariant =
      cart.items.find(
        (cartItem: any) =>
          cartItem._id?.toString() !==
            itemId &&
          cartItem.product &&
          cartItem.product.toString() ===
            item.product.toString() &&
          cartItem.size.toLowerCase() ===
            nextSize.toLowerCase() &&
          cartItem.color.toLowerCase() ===
            nextColor.toLowerCase(),
      );

    if (duplicateVariant) {
      throw new BadRequestException(
        'This product variant already exists in your cart',
      );
    }

    item.quantity =
      nextQuantity;

    item.size =
      nextSize;

    item.color =
      nextColor;

    await cart.save();

    return {
      message:
        'Cart item updated successfully',

      ...(await this.getCart(userId)),
    };
  }

  async removeItem(
    userId: string,
    itemId: string,
  ) {
    const cart =
      await this.findOrCreateCart(
        userId,
      );

    const itemIndex =
      cart.items.findIndex(
        (item: any) =>
          item._id?.toString() ===
          itemId,
      );

    if (itemIndex === -1) {
      throw new NotFoundException(
        'Cart item not found',
      );
    }

    cart.items.splice(
      itemIndex,
      1,
    );

    await cart.save();

    return {
      message:
        'Cart item removed successfully',

      ...(await this.getCart(userId)),
    };
  }

  async clearCart(
    userId: string,
  ) {
    const cart =
      await this.findOrCreateCart(
        userId,
      );

    cart.items = [];

    await cart.save();

    return {
      message:
        'Cart cleared successfully',

      ...(await this.getCart(userId)),
    };
  }

  private async findOrCreateCart(
    userId: string,
  ) {
    const userObjectId =
      new Types.ObjectId(
        userId,
      );

    let cart =
      await this.cartModel.findOne({
        user:
          userObjectId,
      });

    if (!cart) {
      cart =
        await this.cartModel.create({
          user:
            userObjectId,

          items:
            [],
        });
    }

    /*
     * IMPORTANT:
     *
     * Clean stale product references every
     * time the cart is loaded.
     *
     * For example, if an administrator
     * deletes a product while that product
     * is still inside a customer's cart,
     * the stale cart item is permanently
     * removed here.
     */
    await this.removeStaleProductReferences(
      cart,
    );

    return cart;
  }

  private async removeStaleProductReferences(
    cart: CartDocument,
  ) {
    if (
      !cart.items ||
      cart.items.length === 0
    ) {
      return;
    }

    /*
     * Extract every product ID currently
     * stored inside the cart.
     */
    const productIds =
      cart.items
        .map(
          (item: any) => {
            if (!item.product) {
              return null;
            }

            /*
             * Handles both:
             *
             * ObjectId
             *
             * and a populated Product
             * document.
             */
            if (
              item.product._id
            ) {
              return item.product._id;
            }

            return item.product;
          },
        )
        .filter(Boolean);

    if (
      productIds.length === 0
    ) {
      cart.items = [];

      await cart.save();

      return;
    }

    /*
     * Ask MongoDB which of the product IDs
     * still actually exist.
     */
    const existingProducts =
      await this.productModel
        .find({
          _id: {
            $in:
              productIds,
          },
        })
        .select('_id')
        .lean();

    const existingProductIds =
      new Set(
        existingProducts.map(
          (product: any) =>
            product._id.toString(),
        ),
      );

    const originalItemCount =
      cart.items.length;

    /*
     * Permanently remove items whose
     * referenced Product no longer exists.
     */
    cart.items =
      cart.items.filter(
        (item: any) => {
          if (!item.product) {
            return false;
          }

          const productId =
            item.product._id
              ? item.product._id.toString()
              : item.product.toString();

          return existingProductIds.has(
            productId,
          );
        },
      );

    /*
     * Only save when something was actually
     * removed.
     */
    if (
      cart.items.length !==
      originalItemCount
    ) {
      await cart.save();
    }
  }

  private async removeCartItemById(
    cart: CartDocument,
    itemId: string,
  ) {
    const itemIndex =
      cart.items.findIndex(
        (item: any) =>
          item._id?.toString() ===
          itemId,
      );

    if (
      itemIndex === -1
    ) {
      return;
    }

    cart.items.splice(
      itemIndex,
      1,
    );

    await cart.save();
  }

  private validateVariant(
    product: ProductDocument,
    size: string,
    color: string,
  ) {
    const normalizedSize =
      size
        .trim()
        .toLowerCase();

    const normalizedColor =
      color
        .trim()
        .toLowerCase();

    const sizeExists =
      product.sizes.some(
        (productSize) =>
          productSize
            .trim()
            .toLowerCase() ===
          normalizedSize,
      );

    if (!sizeExists) {
      throw new BadRequestException(
        'Selected size is not available for this product',
      );
    }

    const colorExists =
      product.colors.some(
        (productColor) =>
          productColor
            .trim()
            .toLowerCase() ===
          normalizedColor,
      );

    if (!colorExists) {
      throw new BadRequestException(
        'Selected color is not available for this product',
      );
    }
  }

  private buildCartResponse(
    cart: CartDocument,
  ) {
    const items =
      cart.items
        .filter(
          (item: any) =>
            item.product,
        )
        .map(
          (item: any) => {
            const product =
              item.product;

            const subtotal =
              product.price *
              item.quantity;

            return {
              id:
                item._id?.toString(),

              product: {
                id:
                  product._id.toString(),

                name:
                  product.name,

                slug:
                  product.slug,

                price:
                  product.price,

                images:
                  product.images,

                stock:
                  product.stock,

                sizes:
                  product.sizes,

                colors:
                  product.colors,

                isActive:
                  product.isActive,
              },

              quantity:
                item.quantity,

              size:
                item.size,

              color:
                item.color,

              subtotal,
            };
          },
        );

    const totalItems =
      items.reduce(
        (
          total,
          item,
        ) =>
          total +
          item.quantity,
        0,
      );

    const totalAmount =
      items.reduce(
        (
          total,
          item,
        ) =>
          total +
          item.subtotal,
        0,
      );

    return {
      cart: {
        id:
          cart._id.toString(),

        items,

        totalItems,

        totalAmount,
      },
    };
  }
}