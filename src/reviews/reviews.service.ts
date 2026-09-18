import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import {
  Model,
  Types,
} from 'mongoose';

import {
  Review,
  ReviewDocument,
} from './schemas/review.schema';

import {
  Order,
  OrderDocument,
  OrderStatus,
  PaymentStatus,
} from '../orders/schemas/order.schema';

import {
  Product,
  ProductDocument,
} from '../products/schemas/product.schema';

import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { UpdateReviewStatusDto } from './dto/update-review-status.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,

    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,

    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async create(
    userId: string,
    dto: CreateReviewDto,
  ) {
    this.validateObjectId(
      userId,
      'Invalid user ID',
    );

    this.validateObjectId(
      dto.productId,
      'Invalid product ID',
    );

    this.validateObjectId(
      dto.orderId,
      'Invalid order ID',
    );

    const userObjectId =
      new Types.ObjectId(userId);

    const productObjectId =
      new Types.ObjectId(dto.productId);

    const product =
      await this.productModel.findById(
        productObjectId,
      );

    if (!product) {
      throw new NotFoundException(
        'Product not found',
      );
    }

    const order =
      await this.orderModel.findOne({
        _id: dto.orderId,
        user: userObjectId,
      });

    if (!order) {
      throw new NotFoundException(
        'Order not found',
      );
    }

    if (
      order.paymentStatus !==
      PaymentStatus.PAID
    ) {
      throw new BadRequestException(
        'Only paid orders can be reviewed',
      );
    }

    if (
      order.status !==
      OrderStatus.DELIVERED
    ) {
      throw new BadRequestException(
        'You can only review products from delivered orders',
      );
    }

    const purchasedProduct =
      order.items.some((item) => {
        return (
          item.product.toString() ===
          productObjectId.toString()
        );
      });

    if (!purchasedProduct) {
      throw new BadRequestException(
        'This product was not purchased in the selected order',
      );
    }

    const existingReview =
      await this.reviewModel.findOne({
        user: userObjectId,
        product: productObjectId,
        order: order._id,
      });

    if (existingReview) {
      throw new ConflictException(
        'You have already reviewed this product for this order',
      );
    }

    const review =
      await this.reviewModel.create({
        user: userObjectId,
        product: productObjectId,
        order: order._id,
        rating: dto.rating,
        title:
          dto.title?.trim() || '',
        comment:
          dto.comment.trim(),
        isActive: true,
        isVerifiedPurchase: true,
      });

    return {
      message:
        'Review submitted successfully',
      review,
    };
  }

  async findProductReviews(
    productId: string,
    page = 1,
    limit = 10,
  ) {
    this.validateObjectId(
      productId,
      'Invalid product ID',
    );

    const productObjectId =
      new Types.ObjectId(productId);

    const product =
      await this.productModel.exists({
        _id: productObjectId,
        isActive: true,
      });

    if (!product) {
      throw new NotFoundException(
        'Product not found',
      );
    }

    const safePage =
      Math.max(1, Number(page) || 1);

    const safeLimit =
      Math.min(
        50,
        Math.max(
          1,
          Number(limit) || 10,
        ),
      );

    const skip =
      (safePage - 1) * safeLimit;

    const filter = {
      product: productObjectId,
      isActive: true,
    };

    const [
      reviews,
      totalReviews,
      ratingSummary,
    ] = await Promise.all([
      this.reviewModel
        .find(filter)
        .populate(
          'user',
          'firstName lastName',
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(safeLimit),

      this.reviewModel.countDocuments(
        filter,
      ),

      this.reviewModel.aggregate([
        {
          $match: filter,
        },
        {
          $group: {
            _id: null,
            averageRating: {
              $avg: '$rating',
            },
            totalRatings: {
              $sum: 1,
            },
          },
        },
      ]),
    ]);

    const averageRating =
      ratingSummary.length > 0
        ? Number(
            ratingSummary[0]
              .averageRating.toFixed(1),
          )
        : 0;

    return {
      reviews,
      rating: {
        averageRating,
        totalRatings:
          ratingSummary[0]
            ?.totalRatings || 0,
      },
      pagination: {
        page: safePage,
        limit: safeLimit,
        totalReviews,
        totalPages: Math.ceil(
          totalReviews / safeLimit,
        ),
      },
    };
  }

  async findMyReviews(
    userId: string,
  ) {
    this.validateObjectId(
      userId,
      'Invalid user ID',
    );

    const reviews =
      await this.reviewModel
        .find({
          user: new Types.ObjectId(
            userId,
          ),
        })
        .populate(
          'product',
          'name slug images price',
        )
        .populate(
          'order',
          'orderNumber status paymentStatus',
        )
        .sort({
          createdAt: -1,
        });

    return {
      reviews,
    };
  }

  async findOneForUser(
    userId: string,
    reviewId: string,
  ) {
    this.validateObjectId(
      userId,
      'Invalid user ID',
    );

    this.validateObjectId(
      reviewId,
      'Invalid review ID',
    );

    const review =
      await this.reviewModel
        .findOne({
          _id: reviewId,
          user: new Types.ObjectId(
            userId,
          ),
        })
        .populate(
          'product',
          'name slug images price',
        )
        .populate(
          'order',
          'orderNumber status paymentStatus',
        );

    if (!review) {
      throw new NotFoundException(
        'Review not found',
      );
    }

    return {
      review,
    };
  }

  async update(
    userId: string,
    reviewId: string,
    dto: UpdateReviewDto,
  ) {
    this.validateObjectId(
      userId,
      'Invalid user ID',
    );

    this.validateObjectId(
      reviewId,
      'Invalid review ID',
    );

    const review =
      await this.reviewModel.findOne({
        _id: reviewId,
        user: new Types.ObjectId(
          userId,
        ),
      });

    if (!review) {
      throw new NotFoundException(
        'Review not found',
      );
    }

    if (dto.rating !== undefined) {
      review.rating = dto.rating;
    }

    if (dto.title !== undefined) {
      review.title =
        dto.title.trim();
    }

    if (dto.comment !== undefined) {
      review.comment =
        dto.comment.trim();
    }

    await review.save();

    return {
      message:
        'Review updated successfully',
      review,
    };
  }

  async remove(
    userId: string,
    reviewId: string,
  ) {
    this.validateObjectId(
      userId,
      'Invalid user ID',
    );

    this.validateObjectId(
      reviewId,
      'Invalid review ID',
    );

    const review =
      await this.reviewModel.findOneAndDelete({
        _id: reviewId,
        user: new Types.ObjectId(
          userId,
        ),
      });

    if (!review) {
      throw new NotFoundException(
        'Review not found',
      );
    }

    return {
      message:
        'Review deleted successfully',
    };
  }

  async findAll(
    page = 1,
    limit = 20,
    isActive?: boolean,
  ) {
    const safePage =
      Math.max(1, Number(page) || 1);

    const safeLimit =
      Math.min(
        100,
        Math.max(
          1,
          Number(limit) || 20,
        ),
      );

    const skip =
      (safePage - 1) * safeLimit;

    const filter: Record<
      string,
      unknown
    > = {};

    if (
      typeof isActive ===
      'boolean'
    ) {
      filter.isActive = isActive;
    }

    const [
      reviews,
      totalReviews,
    ] = await Promise.all([
      this.reviewModel
        .find(filter)
        .populate(
          'user',
          'firstName lastName email',
        )
        .populate(
          'product',
          'name slug images price',
        )
        .populate(
          'order',
          'orderNumber status paymentStatus',
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(safeLimit),

      this.reviewModel.countDocuments(
        filter,
      ),
    ]);

    return {
      reviews,
      pagination: {
        page: safePage,
        limit: safeLimit,
        totalReviews,
        totalPages: Math.ceil(
          totalReviews / safeLimit,
        ),
      },
    };
  }

  async updateStatus(
    reviewId: string,
    dto: UpdateReviewStatusDto,
  ) {
    this.validateObjectId(
      reviewId,
      'Invalid review ID',
    );

    const review =
      await this.reviewModel.findById(
        reviewId,
      );

    if (!review) {
      throw new NotFoundException(
        'Review not found',
      );
    }

    review.isActive =
      dto.isActive;

    await review.save();

    return {
      message: dto.isActive
        ? 'Review activated successfully'
        : 'Review hidden successfully',
      review,
    };
  }

  async removeByAdmin(
    reviewId: string,
  ) {
    this.validateObjectId(
      reviewId,
      'Invalid review ID',
    );

    const review =
      await this.reviewModel.findByIdAndDelete(
        reviewId,
      );

    if (!review) {
      throw new NotFoundException(
        'Review not found',
      );
    }

    return {
      message:
        'Review deleted successfully',
    };
  }

  private validateObjectId(
    value: string,
    message: string,
  ) {
    if (
      !Types.ObjectId.isValid(value)
    ) {
      throw new BadRequestException(
        message,
      );
    }
  }
}