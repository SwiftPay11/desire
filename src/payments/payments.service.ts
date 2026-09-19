import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import {
  ClientSession,
  Model,
  Types,
} from 'mongoose';

import {
  Payment,
  PaymentDocument,
  PaymentPurpose,
  PaymentStatus,
} from './schemas/payment.schema';

import {
  Order,
  OrderDocument,
  PaymentStatus as OrderPaymentStatus,
} from '../orders/schemas/order.schema';

import {
  Product,
  ProductDocument,
} from '../products/schemas/product.schema';

import {
  CreditPurchase,
  CreditPurchaseDocument,
  CreditPurchaseStatus,
} from '../desire-credit/schemas/credit-purchase.schema';

import {
  Installment,
  InstallmentDocument,
  InstallmentStatus,
} from '../desire-credit/schemas/installment.schema';

import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { SubmitPaymentProofDto } from './dto/submit-payment-proof.dto';

import { NotificationsService } from '../notifications/notifications.service';

import {
  NotificationType,
} from '../notifications/schemas/notification.schema';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel:
      Model<PaymentDocument>,

    @InjectModel(Order.name)
    private readonly orderModel:
      Model<OrderDocument>,

    @InjectModel(Product.name)
    private readonly productModel:
      Model<ProductDocument>,

    @InjectModel(CreditPurchase.name)
    private readonly creditPurchaseModel:
      Model<CreditPurchaseDocument>,

    @InjectModel(Installment.name)
    private readonly installmentModel:
      Model<InstallmentDocument>,

    private readonly notificationsService:
      NotificationsService,
  ) {}

  async create(
    userId: string,
    dto: CreatePaymentDto,
  ) {
    const userObjectId =
      new Types.ObjectId(userId);

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

    const purpose =
      dto.purpose ??
      PaymentPurpose.ORDER;

    let amount =
      order.totalAmount;

    let creditPurchase:
      | CreditPurchaseDocument
      | null = null;

    let installment:
      | InstallmentDocument
      | null = null;

    /*
     * ===================================
     * DESIRE CREDIT COMMITMENT PAYMENT
     * ===================================
     */
    if (
      purpose ===
      PaymentPurpose
        .DESIRE_CREDIT_COMMITMENT
    ) {
      if (!dto.creditPurchaseId) {
        throw new BadRequestException(
          'Credit purchase ID is required for a DESIRE CREDIT commitment payment',
        );
      }

      creditPurchase =
        await this.creditPurchaseModel.findOne({
          _id: dto.creditPurchaseId,

          user: userObjectId,

          order: order._id,
        });

      if (!creditPurchase) {
        throw new NotFoundException(
          'DESIRE CREDIT purchase not found',
        );
      }

      if (
        creditPurchase.status !==
        CreditPurchaseStatus
          .PENDING_COMMITMENT_PAYMENT
      ) {
        throw new BadRequestException(
          'This DESIRE CREDIT purchase is not awaiting a commitment payment',
        );
      }

      if (
        creditPurchase
          .commitmentPaymentPaid
      ) {
        throw new BadRequestException(
          'The commitment payment has already been completed',
        );
      }

      amount =
        creditPurchase
          .commitmentPaymentAmount;
    }

    /*
     * ===================================
     * DESIRE CREDIT INSTALLMENT PAYMENT
     * ===================================
     *
     * An installment payment must be tied
     * to a real installment owned by the
     * logged-in customer.
     *
     * The amount comes from the installment's
     * outstandingAmount. The frontend cannot
     * decide the amount.
     */
    if (
      purpose ===
      PaymentPurpose
        .DESIRE_CREDIT_INSTALLMENT
    ) {
      if (!dto.installmentId) {
        throw new BadRequestException(
          'Installment ID is required for a DESIRE CREDIT installment payment',
        );
      }

      installment =
        await this.installmentModel.findOne({
          _id: dto.installmentId,

          user: userObjectId,

          order: order._id,
        });

      if (!installment) {
        throw new NotFoundException(
          'DESIRE CREDIT installment not found',
        );
      }

      /*
       * Paid, waived, or cancelled installments
       * must never receive another payment.
       */
      if (
        installment.status ===
          InstallmentStatus.PAID ||
        installment.status ===
          InstallmentStatus.WAIVED ||
        installment.status ===
          InstallmentStatus.CANCELLED
      ) {
        throw new BadRequestException(
          'This installment cannot receive another payment',
        );
      }

      /*
       * Only an unpaid/partially-paid/overdue
       * installment may create a payment.
       */
      if (
        installment.status !==
          InstallmentStatus.PENDING &&
        installment.status !==
          InstallmentStatus.PARTIALLY_PAID &&
        installment.status !==
          InstallmentStatus.OVERDUE
      ) {
        throw new BadRequestException(
          'This installment is not available for payment',
        );
      }

      if (
        installment.outstandingAmount <= 0
      ) {
        throw new BadRequestException(
          'This installment has no outstanding balance',
        );
      }

      creditPurchase =
        await this.creditPurchaseModel.findOne({
          _id:
            installment.creditPurchase,

          user:
            userObjectId,

          order:
            order._id,
        });

      if (!creditPurchase) {
        throw new NotFoundException(
          'Related DESIRE CREDIT purchase not found',
        );
      }

      /*
       * Installments should only be payable
       * while their credit purchase is active
       * or overdue.
       */
      if (
        creditPurchase.status !==
          CreditPurchaseStatus.ACTIVE &&
        creditPurchase.status !==
          CreditPurchaseStatus.OVERDUE
      ) {
        throw new BadRequestException(
          'This DESIRE CREDIT purchase is not available for installment repayment',
        );
      }

      /*
       * The payment amount is determined
       * entirely by the backend.
       */
      amount =
        installment.outstandingAmount;
    }

    /*
     * Normal order payment protection.
     */
    if (
      purpose ===
        PaymentPurpose.ORDER &&
      order.paymentStatus ===
        OrderPaymentStatus.PAID
    ) {
      throw new BadRequestException(
        'This order has already been paid',
      );
    }

    /*
     * ===================================
     * SUCCESSFUL PAYMENT DUPLICATE CHECK
     * ===================================
     *
     * Normal ORDER and commitment payments
     * are unique per order/purpose.
     *
     * Installment payments are unique per
     * individual installment instead.
     */
    const completedPaymentQuery:
      Record<string, unknown> = {
        order: order._id,

        purpose,

        status:
          PaymentStatus.PAID,
      };

    if (
      purpose ===
        PaymentPurpose
          .DESIRE_CREDIT_INSTALLMENT &&
      installment
    ) {
      completedPaymentQuery[
        'metadata.installmentId'
      ] =
        installment._id.toString();
    }

    const completedPayment =
      await this.paymentModel.findOne(
        completedPaymentQuery,
      );

    if (completedPayment) {
      if (
        purpose ===
        PaymentPurpose
          .DESIRE_CREDIT_COMMITMENT
      ) {
        throw new BadRequestException(
          'A successful commitment payment already exists for this order',
        );
      }

      if (
        purpose ===
        PaymentPurpose
          .DESIRE_CREDIT_INSTALLMENT
      ) {
        throw new BadRequestException(
          'A successful payment already exists for this installment',
        );
      }

      throw new BadRequestException(
        'A successful payment already exists for this order',
      );
    }

    /*
     * ===================================
     * ACTIVE PAYMENT DUPLICATE CHECK
     * ===================================
     *
     * For installment payments we scope the
     * active payment check to the installment,
     * allowing different installments on the
     * same order to have their own payments.
     */
    const activePaymentQuery:
      Record<string, unknown> = {
        order: order._id,

        purpose,

        status: {
          $in: [
            PaymentStatus.PENDING,
            PaymentStatus.SUBMITTED,
            PaymentStatus.PROCESSING,
          ],
        },
      };

    if (
      purpose ===
        PaymentPurpose
          .DESIRE_CREDIT_INSTALLMENT &&
      installment
    ) {
      activePaymentQuery[
        'metadata.installmentId'
      ] =
        installment._id.toString();
    }

    const activePayment =
      await this.paymentModel.findOne(
        activePaymentQuery,
      );

    if (activePayment) {
      return {
        message:
          purpose ===
          PaymentPurpose
            .DESIRE_CREDIT_INSTALLMENT
            ? 'An active payment already exists for this installment'
            : 'An active payment already exists for this order',

        payment:
          activePayment,
      };
    }

    const currency =
      dto.currency
        ?.trim()
        .toUpperCase() ||
      'NGN';

    const reference =
      await this.generateReference();

    /*
     * Store the DESIRE CREDIT relationship
     * directly in metadata.
     *
     * This allows installment repayment
     * verification to confirm that the PAID
     * payment was created specifically for
     * the installment being repaid.
     */
    const metadata:
      Record<string, unknown> = {};

    if (creditPurchase) {
      metadata.creditPurchaseId =
        creditPurchase._id.toString();
    }

    if (installment) {
      metadata.installmentId =
        installment._id.toString();

      metadata.installmentNumber =
        installment.installmentNumber;
    }

    const payment =
      await this.paymentModel.create({
        user: userObjectId,

        order: order._id,

        reference,

        amount,

        currency,

        provider:
          dto.provider,

        purpose,

        status:
          PaymentStatus.PENDING,

        providerReference: '',

        paymentUrl: '',

        failureReason: '',

        metadata,

        paidAt: null,

        verifiedAt: null,
      });

    return {
      message:
        'Payment created successfully',

      payment,
    };
  }

  async findMyPayments(
    userId: string,
  ) {
    const payments =
      await this.paymentModel
        .find({
          user:
            new Types.ObjectId(
              userId,
            ),
        })
        .populate(
          'order',
          'orderNumber totalAmount status paymentStatus',
        )
        .sort({
          createdAt: -1,
        });

    return {
      payments,
    };
  }

  async findOneForUser(
    userId: string,
    paymentId: string,
  ) {
    const payment =
      await this.paymentModel
        .findOne({
          _id: paymentId,

          user:
            new Types.ObjectId(
              userId,
            ),
        })
        .populate(
          'order',
          'orderNumber totalAmount status paymentStatus',
        );

    if (!payment) {
      throw new NotFoundException(
        'Payment not found',
      );
    }

    return {
      payment,
    };
  }

  async findAll(
  purpose?: PaymentPurpose,
  status?: PaymentStatus,
) {
  const filter: {
    purpose?: PaymentPurpose;
    status?: PaymentStatus;
  } = {};

  if (purpose) {
    if (
      !Object.values(
        PaymentPurpose,
      ).includes(purpose)
    ) {
      throw new BadRequestException(
        'Invalid payment purpose.',
      );
    }

    filter.purpose = purpose;
  }

  if (status) {
    if (
      !Object.values(
        PaymentStatus,
      ).includes(status)
    ) {
      throw new BadRequestException(
        'Invalid payment status.',
      );
    }

    filter.status = status;
  }

  const payments =
    await this.paymentModel
      .find(filter)
      .populate(
        'user',
        'firstName lastName email',
      )
      .populate(
        'order',
        'orderNumber totalAmount status paymentStatus',
      )
      .sort({
        createdAt: -1,
      });

  return {
    payments,
  };
}

  async findOneForAdmin(
    paymentId: string,
  ) {
    const payment =
      await this.paymentModel
        .findById(paymentId)
        .populate(
          'user',
          'firstName lastName email',
        )
        .populate(
          'order',
          'orderNumber totalAmount status paymentStatus',
        );

    if (!payment) {
      throw new NotFoundException(
        'Payment not found',
      );
    }

    return {
      payment,
    };
  }

  async verify(
    paymentId: string,
    dto: VerifyPaymentDto,
  ) {
    /*
     * Failed verification does not affect
     * inventory.
     */
    if (dto.failureReason) {
      const payment =
        await this.paymentModel.findById(
          paymentId,
        );

      if (!payment) {
        throw new NotFoundException(
          'Payment not found',
        );
      }

      if (
        payment.status ===
        PaymentStatus.PAID
      ) {
        throw new BadRequestException(
          'A paid payment cannot be failed through verification',
        );
      }

      payment.verifiedAt =
        new Date();

      if (dto.providerReference) {
        payment.providerReference =
          dto.providerReference.trim();
      }

      payment.status =
        PaymentStatus.FAILED;

      payment.failureReason =
        dto.failureReason.trim();

      payment.paidAt = null;

      await payment.save();

      if (
        payment.purpose ===
        PaymentPurpose.ORDER
      ) {
        await this.syncOrderPaymentStatus(
          payment.order,

          payment.status,

          payment.reference,
        );
      }

      return {
        message:
          'Payment verification failed',

        payment,
      };
    }

    /*
     * Successful verification goes through
     * the protected PAID transaction.
     */
    return this.confirmPaymentAsPaid(
      paymentId,
      dto.providerReference,
      'Payment verified successfully',
    );
  }

  async updateStatus(
    paymentId: string,
    dto: UpdatePaymentStatusDto,
  ) {
    /*
     * PAID must always go through the protected
     * payment confirmation + inventory workflow.
     */
    if (
      dto.status ===
      PaymentStatus.PAID
    ) {
      return this.confirmPaymentAsPaid(
        paymentId,
        undefined,
        'Payment status updated successfully',
      );
    }

    const payment =
      await this.paymentModel.findById(
        paymentId,
      );

    if (!payment) {
      throw new NotFoundException(
        'Payment not found',
      );
    }

    /*
     * Once a payment is already PAID,
     * changing it to another status must not
     * accidentally alter inventory.
     *
     * Refund/restock behavior will be handled
     * deliberately rather than automatically.
     */
    if (
      payment.status ===
        PaymentStatus.PAID &&
      dto.status !==
        PaymentStatus.REFUNDED
    ) {
      throw new BadRequestException(
        'A paid payment cannot be changed to this status',
      );
    }

    payment.status =
      dto.status;

    payment.verifiedAt =
      new Date();

    /*
     * We are already inside the non-PAID branch,
     * so there is no need to compare dto.status
     * with PAID again.
     *
     * Do not erase paidAt from an order that
     * was previously successfully paid.
     */
    if (
      payment.status ===
      PaymentStatus.FAILED
    ) {
      payment.paidAt = null;
    }

    if (
      dto.status !==
      PaymentStatus.FAILED
    ) {
      payment.failureReason = '';
    }

    await payment.save();

    if (
      payment.purpose ===
      PaymentPurpose.ORDER
    ) {
      await this.syncOrderPaymentStatus(
        payment.order,
        payment.status,
        payment.reference,
      );
    }

    return {
      message:
        'Payment status updated successfully',

      payment,
    };
  }

  async submitProof(
    userId: string,
    paymentId: string,
    dto: SubmitPaymentProofDto,
  ) {
    const payment =
      await this.paymentModel.findOne({
        _id: paymentId,

        user:
          new Types.ObjectId(
            userId,
          ),
      });

    if (!payment) {
      throw new NotFoundException(
        'Payment not found',
      );
    }

    if (
      payment.status ===
      PaymentStatus.PAID
    ) {
      throw new BadRequestException(
        'This payment has already been approved',
      );
    }

    payment.proofOfPaymentUrl =
      dto.proofOfPaymentUrl.trim();

    payment.senderName =
      dto.senderName.trim();

    payment.transferReference =
      dto.transferReference.trim();

    payment.transferDate =
      new Date(
        dto.transferDate,
      );

    payment.submittedAmount =
      dto.submittedAmount;

    payment.customerNote =
      dto.customerNote?.trim() ||
      '';

    payment.submittedAt =
      new Date();

    payment.status =
      PaymentStatus.SUBMITTED;

    await payment.save();

    const order =
      await this.orderModel.findById(
        payment.order,
      );

    await this.notificationsService.create(
      userId,
      {
        type:
          NotificationType.PAYMENT,

        title:
          'Payment proof received',

        message:
          order?.orderNumber
            ? `Your payment proof for order ${order.orderNumber} has been received and is awaiting verification.`
            : 'Your payment proof has been received and is awaiting verification.',

        link:
          order?._id
            ? `/account/orders/${order._id.toString()}`
            : '/account/orders',

        metadata: {
          paymentId:
            payment._id.toString(),

          orderId:
            payment.order.toString(),

          paymentReference:
            payment.reference,

          purpose:
            payment.purpose,
        },
      },
    );

    return {
      message:
        'Payment proof submitted successfully. Your payment is awaiting verification.',

      payment,
    };
  }

  /*
   * ===================================
   * PAID PAYMENT + INVENTORY TRANSACTION
   * ===================================
   */
  private async confirmPaymentAsPaid(
    paymentId: string,
    providerReference?: string,
    successMessage =
      'Payment confirmed successfully',
  ) {
    const session =
      await this.paymentModel.db.startSession();

    let finalPayment:
      | PaymentDocument
      | null = null;

    try {
      await session.withTransaction(
        async () => {
          const payment =
            await this.paymentModel
              .findById(paymentId)
              .session(session);

          if (!payment) {
            throw new NotFoundException(
              'Payment not found',
            );
          }

          /*
           * Idempotency:
           * If this payment is already PAID,
           * return it without touching stock.
           */
          if (
            payment.status ===
            PaymentStatus.PAID
          ) {
            finalPayment =
              payment;

            return;
          }

          /*
           * A refunded payment must never
           * simply become PAID again.
           */
          if (
            payment.status ===
            PaymentStatus.REFUNDED
          ) {
            throw new BadRequestException(
              'A refunded payment cannot be confirmed as paid again',
            );
          }

          /*
           * A cancelled payment should not
           * be revived through verification.
           */
          if (
            payment.status ===
            PaymentStatus.CANCELLED
          ) {
            throw new BadRequestException(
              'A cancelled payment cannot be confirmed as paid',
            );
          }

          if (providerReference) {
            payment.providerReference =
              providerReference.trim();
          }

          /*
           * Normal order payments deduct
           * inventory exactly once and mark
           * the order as fully paid.
           */
          if (
            payment.purpose ===
            PaymentPurpose.ORDER
          ) {
            await this.deductOrderInventory(
              payment.order,
              payment.reference,
              session,
              true,
            );
          }

          /*
           * DESIRE CREDIT commitment payments
           * also secure inventory exactly once,
           * but they must NOT mark the entire
           * order as fully paid.
           */
          if (
            payment.purpose ===
            PaymentPurpose
              .DESIRE_CREDIT_COMMITMENT
          ) {
            await this.deductOrderInventory(
              payment.order,
              payment.reference,
              session,
              false,
            );
          }

          /*
           * DESIRE CREDIT installment payments
           * do not touch inventory here.
           *
           * Inventory was already secured by
           * the commitment payment.
           *
           * The verified PAID payment will later
           * be applied to its installment by the
           * DESIRE CREDIT repayment service.
           */
          payment.status =
            PaymentStatus.PAID;

          payment.failureReason = '';

          payment.paidAt =
            payment.paidAt ||
            new Date();

          payment.verifiedAt =
            new Date();

          await payment.save({
            session,
          });

          finalPayment =
            payment;
        },
      );
    } finally {
      await session.endSession();
    }

    if (!finalPayment) {
      throw new BadRequestException(
        'Unable to confirm payment',
      );
    }

    return {
      message:
        successMessage,

      payment:
        finalPayment,
    };
  }

  /*
   * Deduct every order item only once.
   *
   * markOrderAsPaid:
   * true  = normal order payment
   * false = DESIRE CREDIT commitment
   *
   * Each stock update uses:
   *
   * stock: { $gte: quantity }
   *
   * so MongoDB will never reduce inventory
   * below zero.
   */
  private async deductOrderInventory(
    orderId: Types.ObjectId,
    paymentReference: string,
    session: ClientSession,
    markOrderAsPaid = true,
  ) {
    const order =
      await this.orderModel
        .findById(orderId)
        .session(session);

    if (!order) {
      throw new NotFoundException(
        'Related order not found',
      );
    }

    /*
     * Already processed.
     * Do not deduct again.
     */
    if (
      order.inventoryDeducted
    ) {
      if (markOrderAsPaid) {
        order.paymentStatus =
          OrderPaymentStatus.PAID;

        order.paymentReference =
          paymentReference;
      }

      await order.save({
        session,
      });

      return;
    }

    /*
     * First validate every item.
     */
    for (
      const item of order.items
    ) {
      const product =
        await this.productModel
          .findById(item.product)
          .session(session);

      if (!product) {
        throw new NotFoundException(
          `${item.name} no longer exists`,
        );
      }

      if (!product.isActive) {
        throw new BadRequestException(
          `${item.name} is no longer available`,
        );
      }

      if (
        product.stock <
        item.quantity
      ) {
        throw new BadRequestException(
          `Not enough stock for ${item.name}. Available: ${product.stock}, required: ${item.quantity}`,
        );
      }
    }

    /*
     * Atomically deduct stock.
     */
    for (
      const item of order.items
    ) {
      const updatedProduct =
        await this.productModel.findOneAndUpdate(
          {
            _id: item.product,

            stock: {
              $gte:
                item.quantity,
            },
          },

          {
            $inc: {
              stock:
                -item.quantity,
            },
          },

          {
            new: true,

            session,
          },
        );

      if (!updatedProduct) {
        throw new BadRequestException(
          `Not enough stock for ${item.name}`,
        );
      }
    }

    /*
     * Only a normal ORDER payment means
     * the complete order has been paid.
     *
     * A DESIRE CREDIT commitment payment
     * secures inventory but leaves the order
     * payment status pending until all credit
     * installments have been repaid.
     */
    if (markOrderAsPaid) {
      order.paymentStatus =
        OrderPaymentStatus.PAID;

      order.paymentReference =
        paymentReference;
    }

    order.inventoryDeducted =
      true;

    order.inventoryDeductedAt =
      new Date();

    order.inventoryPaymentReference =
      paymentReference;

    await order.save({
      session,
    });
  }

  private async syncOrderPaymentStatus(
    orderId: Types.ObjectId,
    paymentStatus: PaymentStatus,
    paymentReference: string,
  ) {
    const order =
      await this.orderModel.findById(
        orderId,
      );

    if (!order) {
      throw new NotFoundException(
        'Related order not found',
      );
    }

    order.paymentStatus =
      this.mapOrderPaymentStatus(
        paymentStatus,
      );

    order.paymentReference =
      paymentReference;

    await order.save();
  }

  private mapOrderPaymentStatus(
    status: PaymentStatus,
  ): OrderPaymentStatus {
    switch (status) {
      case PaymentStatus.PAID:
        return OrderPaymentStatus.PAID;

      case PaymentStatus.FAILED:
      case PaymentStatus.CANCELLED:
        return OrderPaymentStatus.FAILED;

      case PaymentStatus.REFUNDED:
        return OrderPaymentStatus.REFUNDED;

      case PaymentStatus.PENDING:
      case PaymentStatus.SUBMITTED:
      case PaymentStatus.PROCESSING:
      default:
        return OrderPaymentStatus.PENDING;
    }
  }

  private async generateReference() {
    while (true) {
      const reference =
        `PAY-DES-${Date.now()}-${Math.floor(
          100000 +
            Math.random() *
              900000,
        )}`;

      const exists =
        await this.paymentModel.exists({
          reference,
        });

      if (!exists) {
        return reference;
      }
    }
  }
}