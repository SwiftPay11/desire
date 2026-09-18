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
  Wishlist,
  WishlistDocument,
} from './schemas/wishlist.schema';

import {
  Product,
  ProductDocument,
} from '../products/schemas/product.schema';

import {
  AddWishlistItemDto,
} from './dto/add-wishlist-item.dto';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(Wishlist.name)
    private readonly wishlistModel:
      Model<WishlistDocument>,

    @InjectModel(Product.name)
    private readonly productModel:
      Model<ProductDocument>,
  ) {}

  async getWishlist(
    userId: string,
  ) {
    const userObjectId =
      new Types.ObjectId(userId);

    let wishlist =
      await this.wishlistModel
        .findOne({
          user: userObjectId,
        })
        .populate({
          path: 'items.product',
          select: [
            'name',
            'slug',
            'description',
            'sku',
            'price',
            'compareAtPrice',
            'category',
            'images',
            'sizes',
            'colors',
            'stock',
            'featured',
            'isActive',
          ].join(' '),

          populate: {
            path: 'category',
            select:
              'name slug description isActive',
          },
        })
        .exec();

    if (!wishlist) {
      wishlist =
        await this.wishlistModel.create({
          user: userObjectId,
          items: [],
        });

      await wishlist.populate({
        path: 'items.product',
        select: [
          'name',
          'slug',
          'description',
          'sku',
          'price',
          'compareAtPrice',
          'category',
          'images',
          'sizes',
          'colors',
          'stock',
          'featured',
          'isActive',
        ].join(' '),

        populate: {
          path: 'category',
          select:
            'name slug description isActive',
        },
      });
    }

    return {
      wishlist,
      itemCount:
        wishlist.items.length,
    };
  }

  async addItem(
    userId: string,
    dto: AddWishlistItemDto,
  ) {
    const userObjectId =
      new Types.ObjectId(userId);

    const productObjectId =
      new Types.ObjectId(
        dto.productId,
      );

    const product =
      await this.productModel.findOne({
        _id: productObjectId,
        isActive: true,
      });

    if (!product) {
      throw new NotFoundException(
        'Product not found or unavailable',
      );
    }

    let wishlist =
      await this.wishlistModel.findOne({
        user: userObjectId,
      });

    if (!wishlist) {
      wishlist =
        await this.wishlistModel.create({
          user: userObjectId,
          items: [],
        });
    }

    const itemAlreadyExists =
      wishlist.items.some(
        (item) =>
          item.product.toString() ===
          productObjectId.toString(),
      );

    if (itemAlreadyExists) {
      throw new BadRequestException(
        'Product is already in your wishlist',
      );
    }

    wishlist.items.unshift({
      product: productObjectId,
      addedAt: new Date(),
    });

    await wishlist.save();

    await wishlist.populate({
      path: 'items.product',
      select: [
        'name',
        'slug',
        'description',
        'sku',
        'price',
        'compareAtPrice',
        'category',
        'images',
        'sizes',
        'colors',
        'stock',
        'featured',
        'isActive',
      ].join(' '),

      populate: {
        path: 'category',
        select:
          'name slug description isActive',
      },
    });

    return {
      message:
        'Product added to wishlist successfully',
      wishlist,
      itemCount:
        wishlist.items.length,
    };
  }

  async removeItem(
    userId: string,
    productId: string,
  ) {
    const userObjectId =
      new Types.ObjectId(userId);

    const productObjectId =
      new Types.ObjectId(productId);

    const wishlist =
      await this.wishlistModel.findOne({
        user: userObjectId,
      });

    if (!wishlist) {
      throw new NotFoundException(
        'Wishlist not found',
      );
    }

    const itemExists =
      wishlist.items.some(
        (item) =>
          item.product.toString() ===
          productObjectId.toString(),
      );

    if (!itemExists) {
      throw new NotFoundException(
        'Product was not found in your wishlist',
      );
    }

    wishlist.items =
      wishlist.items.filter(
        (item) =>
          item.product.toString() !==
          productObjectId.toString(),
      );

    await wishlist.save();

    await wishlist.populate({
      path: 'items.product',
      select: [
        'name',
        'slug',
        'description',
        'sku',
        'price',
        'compareAtPrice',
        'category',
        'images',
        'sizes',
        'colors',
        'stock',
        'featured',
        'isActive',
      ].join(' '),

      populate: {
        path: 'category',
        select:
          'name slug description isActive',
      },
    });

    return {
      message:
        'Product removed from wishlist successfully',
      wishlist,
      itemCount:
        wishlist.items.length,
    };
  }

  async clearWishlist(
    userId: string,
  ) {
    const userObjectId =
      new Types.ObjectId(userId);

    const wishlist =
      await this.wishlistModel.findOne({
        user: userObjectId,
      });

    if (!wishlist) {
      return {
        message:
          'Wishlist is already empty',
        wishlist: null,
        itemCount: 0,
      };
    }

    wishlist.items = [];

    await wishlist.save();

    return {
      message:
        'Wishlist cleared successfully',
      wishlist,
      itemCount: 0,
    };
  }

  async containsProduct(
    userId: string,
    productId: string,
  ) {
    const wishlist =
      await this.wishlistModel.findOne({
        user: new Types.ObjectId(
          userId,
        ),

        'items.product':
          new Types.ObjectId(
            productId,
          ),
      });

    return {
      inWishlist: Boolean(
        wishlist,
      ),
    };
  }
}