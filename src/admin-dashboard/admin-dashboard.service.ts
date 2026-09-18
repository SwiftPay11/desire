import {
  Injectable,
} from '@nestjs/common';

import {
  InjectModel,
} from '@nestjs/mongoose';

import {
  Model,
} from 'mongoose';

import {
  Order,
  OrderDocument,
  OrderStatus,
} from '../orders/schemas/order.schema';

import {
  Payment,
  PaymentDocument,
  PaymentStatus,
} from '../payments/schemas/payment.schema';

import {
  Product,
  ProductDocument,
} from '../products/schemas/product.schema';

import {
  User,
  UserDocument,
} from '../users/schemas/user.schema';

import {
  CreditApplication,
  CreditApplicationDocument,
  CreditApplicationStatus,
} from '../desire-credit/schemas/credit-application.schema';

import {
  CreditAccount,
  CreditAccountDocument,
  CreditAccountStatus,
} from '../desire-credit/schemas/credit-account.schema';

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel:
      Model<OrderDocument>,

    @InjectModel(Payment.name)
    private readonly paymentModel:
      Model<PaymentDocument>,

    @InjectModel(Product.name)
    private readonly productModel:
      Model<ProductDocument>,

    @InjectModel(User.name)
    private readonly userModel:
      Model<UserDocument>,

    @InjectModel(CreditApplication.name)
    private readonly creditApplicationModel:
      Model<CreditApplicationDocument>,

    @InjectModel(CreditAccount.name)
    private readonly creditAccountModel:
      Model<CreditAccountDocument>,
  ) {}

  async getDashboard() {
    const [
      totalOrders,
      pendingOrders,
      awaitingCommitmentOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,

      totalCustomers,
      totalAdmins,

      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,

      paymentsAwaitingReview,
      pendingPayments,
      paidPayments,
      failedPayments,

      pendingCreditApplications,
      underReviewCreditApplications,
      approvedCreditApplications,
      rejectedCreditApplications,
      informationRequiredApplications,

      activeCreditAccounts,
      suspendedCreditAccounts,
      frozenCreditAccounts,
      closedCreditAccounts,
      overdueCreditAccounts,

      revenueResult,
      creditTotalsResult,

      recentOrders,
    ] = await Promise.all([
      /*
       * ORDERS
       */
      this.orderModel.countDocuments(),

      this.orderModel.countDocuments({
        status: OrderStatus.PENDING,
      }),

      this.orderModel.countDocuments({
        status:
          OrderStatus
            .AWAITING_COMMITMENT_PAYMENT,
      }),

      this.orderModel.countDocuments({
        status:
          OrderStatus.PROCESSING,
      }),

      this.orderModel.countDocuments({
        status:
          OrderStatus.SHIPPED,
      }),

      this.orderModel.countDocuments({
        status:
          OrderStatus.DELIVERED,
      }),

      /*
       * CUSTOMERS
       */
      this.userModel.countDocuments({
        isAdmin: false,
      }),

      this.userModel.countDocuments({
        isAdmin: true,
      }),

      /*
       * PRODUCTS
       */
      this.productModel.countDocuments(),

      this.productModel.countDocuments({
        isActive: true,
      }),

      /*
       * Low stock:
       * More than zero,
       * but five or fewer remaining.
       */
      this.productModel.countDocuments({
        stock: {
          $gt: 0,
          $lte: 5,
        },
        isActive: true,
      }),

      this.productModel.countDocuments({
        stock: 0,
        isActive: true,
      }),

      /*
       * PAYMENTS
       */
      this.paymentModel.countDocuments({
        status:
          PaymentStatus.SUBMITTED,
      }),

      this.paymentModel.countDocuments({
        status:
          PaymentStatus.PENDING,
      }),

      this.paymentModel.countDocuments({
        status:
          PaymentStatus.PAID,
      }),

      this.paymentModel.countDocuments({
        status:
          PaymentStatus.FAILED,
      }),

      /*
       * DESIRE CREDIT APPLICATIONS
       */
      this.creditApplicationModel
        .countDocuments({
          status:
            CreditApplicationStatus
              .PENDING,
        }),

      this.creditApplicationModel
        .countDocuments({
          status:
            CreditApplicationStatus
              .UNDER_REVIEW,
        }),

      this.creditApplicationModel
        .countDocuments({
          status:
            CreditApplicationStatus
              .APPROVED,
        }),

      this.creditApplicationModel
        .countDocuments({
          status:
            CreditApplicationStatus
              .REJECTED,
        }),

      this.creditApplicationModel
        .countDocuments({
          status:
            CreditApplicationStatus
              .MORE_INFORMATION_REQUIRED,
        }),

      /*
       * DESIRE CREDIT ACCOUNTS
       */
      this.creditAccountModel
        .countDocuments({
          status:
            CreditAccountStatus.ACTIVE,
        }),

      this.creditAccountModel
        .countDocuments({
          status:
            CreditAccountStatus
              .SUSPENDED,
        }),

      this.creditAccountModel
        .countDocuments({
          status:
            CreditAccountStatus.FROZEN,
        }),

      this.creditAccountModel
        .countDocuments({
          status:
            CreditAccountStatus.CLOSED,
        }),

      this.creditAccountModel
        .countDocuments({
          overdueBalance: {
            $gt: 0,
          },
        }),

      /*
       * CONFIRMED CASH RECEIVED
       *
       * This uses successful Payment
       * records rather than order totals.
       */
      this.paymentModel.aggregate([
        {
          $match: {
            status:
              PaymentStatus.PAID,
          },
        },
        {
          $group: {
            _id: null,

            total: {
              $sum: '$amount',
            },
          },
        },
      ]),

      /*
       * DESIRE CREDIT FINANCIAL TOTALS
       */
      this.creditAccountModel.aggregate([
        {
          $group: {
            _id: null,

            totalCreditLimit: {
              $sum: '$creditLimit',
            },

            totalUsedCredit: {
              $sum: '$usedCredit',
            },

            totalAvailableCredit: {
              $sum: '$availableCredit',
            },

            totalBorrowed: {
              $sum: '$totalBorrowed',
            },

            totalRepaid: {
              $sum: '$totalRepaid',
            },

            outstandingBalance: {
              $sum: '$outstandingBalance',
            },

            overdueBalance: {
              $sum: '$overdueBalance',
            },
          },
        },
      ]),

      /*
       * RECENT ORDERS
       */
      this.orderModel
        .find()
        .populate(
          'user',
          'fullName email',
        )
        .sort({
          createdAt: -1,
        })
        .limit(8)
        .select(
          'orderNumber user totalAmount status paymentStatus createdAt',
        ),
    ]);

    const confirmedRevenue =
      revenueResult?.[0]?.total ||
      0;

    const creditTotals =
      creditTotalsResult?.[0] || {
        totalCreditLimit: 0,
        totalUsedCredit: 0,
        totalAvailableCredit: 0,
        totalBorrowed: 0,
        totalRepaid: 0,
        outstandingBalance: 0,
        overdueBalance: 0,
      };

    return {
      overview: {
        totalOrders,

        confirmedRevenue,

        totalCustomers,

        totalProducts,
      },

      orders: {
        total:
          totalOrders,

        pending:
          pendingOrders,

        awaitingCommitmentPayment:
          awaitingCommitmentOrders,

        processing:
          processingOrders,

        shipped:
          shippedOrders,

        delivered:
          deliveredOrders,
      },

      payments: {
        awaitingReview:
          paymentsAwaitingReview,

        pending:
          pendingPayments,

        paid:
          paidPayments,

        failed:
          failedPayments,
      },

      inventory: {
        totalProducts,

        activeProducts,

        lowStockProducts,

        outOfStockProducts,
      },

      customers: {
        totalCustomers,

        totalAdmins,
      },

      desireCredit: {
        applications: {
          pending:
            pendingCreditApplications,

          underReview:
            underReviewCreditApplications,

          approved:
            approvedCreditApplications,

          rejected:
            rejectedCreditApplications,

          moreInformationRequired:
            informationRequiredApplications,
        },

        accounts: {
          active:
            activeCreditAccounts,

          suspended:
            suspendedCreditAccounts,

          frozen:
            frozenCreditAccounts,

          closed:
            closedCreditAccounts,

          overdue:
            overdueCreditAccounts,
        },

        financials: {
          totalCreditLimit:
            creditTotals.totalCreditLimit ||
            0,

          totalUsedCredit:
            creditTotals.totalUsedCredit ||
            0,

          totalAvailableCredit:
            creditTotals
              .totalAvailableCredit ||
            0,

          totalBorrowed:
            creditTotals.totalBorrowed ||
            0,

          totalRepaid:
            creditTotals.totalRepaid ||
            0,

          outstandingBalance:
            creditTotals
              .outstandingBalance ||
            0,

          overdueBalance:
            creditTotals.overdueBalance ||
            0,
        },
      },

      attention: {
        paymentsAwaitingReview,

        pendingOrders,

        awaitingCommitmentOrders,

        lowStockProducts,

        outOfStockProducts,

        pendingCreditApplications,

        underReviewCreditApplications,

        overdueCreditAccounts,
      },

      recentOrders,
    };
  }
}