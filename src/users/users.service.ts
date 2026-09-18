import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import {
  Model,
  Types,
} from 'mongoose';

import {
  User,
} from './schemas/user.schema';

import {
  Order,
  OrderDocument,
  PaymentStatus,
} from '../orders/schemas/order.schema';

import {
  UpdateProfileDto,
} from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel:
      Model<User>,

    @InjectModel(Order.name)
    private readonly orderModel:
      Model<OrderDocument>,
  ) {}

  async findByEmail(
    email: string,
  ) {
    return this.userModel.findOne({
      email,
    });
  }

  async create(
    data: Partial<User>,
  ) {
    return this.userModel.create(
      data,
    );
  }

  // ==========================
  // CUSTOMER PROFILE
  // ==========================

  async getMe(
    userId: string,
  ) {
    const user =
      await this.userModel
        .findById(
          new Types.ObjectId(
            userId,
          ),
        )
        .select(
          'fullName email phone isAdmin createdAt updatedAt',
        );

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    return {
      user,
    };
  }

  async updateMe(
    userId: string,
    dto: UpdateProfileDto,
  ) {
    const user =
      await this.userModel.findById(
        new Types.ObjectId(
          userId,
        ),
      );

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    if (
      dto.fullName !==
      undefined
    ) {
      user.fullName =
        dto.fullName.trim();
    }

    if (
      dto.phone !==
      undefined
    ) {
      user.phone =
        dto.phone.trim();
    }

    await user.save();

    return {
      message:
        'Profile updated successfully',

      user: {
        id:
          user._id,

        fullName:
          user.fullName,

        email:
          user.email,

        phone:
          user.phone,

        isAdmin:
          user.isAdmin,
      },
    };
  }

  // ==========================
  // ADMIN CUSTOMER MANAGEMENT
  // ==========================

  async getAdminCustomers() {
    /*
     * Only normal customer accounts are
     * returned here. Admin accounts are
     * excluded from the customer list.
     */
    const customers =
      await this.userModel
        .find({
          isAdmin: {
            $ne: true,
          },
        })
        .select(
          'fullName email phone isAdmin createdAt updatedAt',
        )
        .sort({
          createdAt: -1,
        })
        .lean();

    const customerIds =
      customers.map(
        (customer: any) =>
          customer._id,
      );

    /*
     * Calculate order statistics in one
     * aggregation instead of running
     * separate queries for every customer.
     */
    const orderStatistics =
      customerIds.length > 0
        ? await this.orderModel.aggregate([
            {
              $match: {
                user: {
                  $in:
                    customerIds,
                },
              },
            },

            {
              $group: {
                _id: '$user',

                totalOrders: {
                  $sum: 1,
                },

                totalSpent: {
                  $sum: {
                    $cond: [
                      {
                        $eq: [
                          '$paymentStatus',
                          PaymentStatus.PAID,
                        ],
                      },

                      '$totalAmount',

                      0,
                    ],
                  },
                },

                paidOrders: {
                  $sum: {
                    $cond: [
                      {
                        $eq: [
                          '$paymentStatus',
                          PaymentStatus.PAID,
                        ],
                      },

                      1,

                      0,
                    ],
                  },
                },
              },
            },
          ])
        : [];

    const statisticsMap =
      new Map(
        orderStatistics.map(
          (statistics: any) => [
            String(
              statistics._id,
            ),
            statistics,
          ],
        ),
      );

    const customerList =
      customers.map(
        (customer: any) => {
          const statistics =
            statisticsMap.get(
              String(
                customer._id,
              ),
            );

          return {
            ...customer,

            totalOrders:
              statistics
                ?.totalOrders ||
              0,

            paidOrders:
              statistics
                ?.paidOrders ||
              0,

            totalSpent:
              statistics
                ?.totalSpent ||
              0,
          };
        },
      );

    return {
      totalCustomers:
        customerList.length,

      customers:
        customerList,
    };
  }

  async getAdminCustomer(
    customerId: string,
  ) {
    if (
      !Types.ObjectId.isValid(
        customerId,
      )
    ) {
      throw new NotFoundException(
        'Customer not found',
      );
    }

    const customer =
  await this.userModel
    .findOne({
      _id:
        new Types.ObjectId(
          customerId,
        ),

      isAdmin: {
        $ne: true,
      },
    })
        .select(
          'fullName email phone isAdmin createdAt updatedAt',
        )
        .lean();

    if (!customer) {
      throw new NotFoundException(
        'Customer not found',
      );
    }

    const customerObjectId =
      new Types.ObjectId(
        customerId,
      );

    const orders =
      await this.orderModel
        .find({
          user:
            customerObjectId,
        })
        .sort({
          createdAt: -1,
        })
        .lean();

    const totalOrders =
      orders.length;

    const paidOrders =
      orders.filter(
        (order: any) =>
          order.paymentStatus ===
          PaymentStatus.PAID,
      );

    const totalSpent =
      paidOrders.reduce(
        (
          total: number,
          order: any,
        ) =>
          total +
          Number(
            order.totalAmount ||
              0,
          ),
        0,
      );

    const pendingOrders =
      orders.filter(
        (order: any) =>
          order.paymentStatus ===
          PaymentStatus.PENDING,
      ).length;

    return {
      customer,

      statistics: {
        totalOrders,

        paidOrders:
          paidOrders.length,

        pendingOrders,

        totalSpent,
      },

      orders,
    };
  }

  async findById(
    userId: string,
  ) {
    return this.userModel.findById(
      userId,
    );
  }
}