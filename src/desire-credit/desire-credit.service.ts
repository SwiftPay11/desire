import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import {
  Model,
  Types,
} from 'mongoose';

import {
  ApplyCreditDto,
} from './dto/apply-credit.dto';

import {
  CreditApplication,
  CreditApplicationDocument,
  CreditApplicationStatus,
} from './schemas/credit-application.schema';

import {
  CreditAccount,
  CreditAccountDocument,
  CreditAccountStatus,
} from './schemas/credit-account.schema';

import {
  CreditPurchase,
  CreditPurchaseDocument,
  CreditPurchaseStatus,
} from './schemas/credit-purchase.schema';

import {
  Installment,
  InstallmentDocument,
  InstallmentStatus,
} from './schemas/installment.schema';

import {
  Payment,
  PaymentDocument,
  PaymentStatus,
  PaymentPurpose,
} from '../payments/schemas/payment.schema';

import {
  Order,
  OrderDocument,
  OrderStatus,
  PaymentStatus as OrderPaymentStatus,
} from '../orders/schemas/order.schema';

import {
  ReviewCreditApplicationDto,
} from './dto/review-credit-application.dto';

import {
  CREDIT_INSTALLMENT_PLAN_DAYS,
  CreditInstallmentPlan,
} from './enums/credit-installment-plan.enum';

import {
  UpdateCreditAccountDto,
} from './dto/update-credit-account.dto';

import {
  CreateCreditPurchaseDto,
} from './dto/create-credit-purchase.dto';

import {
  VerifyCommitmentPaymentDto,
} from './dto/verify-commitment-payment.dto';

import {
  RecordInstallmentPaymentDto,
} from './dto/record-installment-payment.dto';

import {
  Cron,
  CronExpression,
} from '@nestjs/schedule';

@Injectable()
export class DesireCreditService {
  constructor(
    @InjectModel(CreditApplication.name)
    private readonly creditApplicationModel:
      Model<CreditApplicationDocument>,

    @InjectModel(CreditAccount.name)
    private readonly creditAccountModel:
      Model<CreditAccountDocument>,

    @InjectModel(CreditPurchase.name)
    private readonly creditPurchaseModel:
      Model<CreditPurchaseDocument>,

    @InjectModel(Installment.name)
    private readonly installmentModel:
      Model<InstallmentDocument>,

    @InjectModel(Payment.name)
    private readonly paymentModel:
      Model<PaymentDocument>,

    @InjectModel(Order.name)
    private readonly orderModel:
      Model<OrderDocument>,
  ) {}

  /*
  |--------------------------------------------------------------------------
  | CREDIT APPLICATIONS
  |--------------------------------------------------------------------------
  */

  async apply(
    userId: string,
    dto: ApplyCreditDto,
  ): Promise<CreditApplicationDocument> {
    this.validateObjectId(
      userId,
      'Invalid user ID.',
    );

    const existingCreditAccount =
      await this.creditAccountModel.findOne({
        user: new Types.ObjectId(userId),
      });

    if (existingCreditAccount) {
      throw new BadRequestException(
        'You already have a DESIRE CREDIT account.',
      );
    }

    const activeApplication =
      await this.creditApplicationModel.findOne({
        user: new Types.ObjectId(userId),
        status: {
          $in: [
            CreditApplicationStatus.PENDING,
            CreditApplicationStatus.UNDER_REVIEW,
            CreditApplicationStatus
              .MORE_INFORMATION_REQUIRED,
            CreditApplicationStatus.APPROVED,
          ],
        },
      });

    if (activeApplication) {
      throw new BadRequestException(
        'You already have an active DESIRE CREDIT application.',
      );
    }

    const application =
      new this.creditApplicationModel({
        user: new Types.ObjectId(userId),

        requestedAmount:
          dto.requestedAmount,

        employmentStatus:
          dto.employmentStatus,

        employerName:
          dto.employerName?.trim() ?? '',

        occupation:
          dto.occupation?.trim() ?? '',

        monthlyIncome:
          dto.monthlyIncome,

        phone:
          dto.phone.trim(),

        email:
          dto.email.trim().toLowerCase(),

        residentialAddress:
          dto.residentialAddress.trim(),

        city:
          dto.city.trim(),

        state:
          dto.state.trim(),

        country:
          dto.country?.trim() || 'Nigeria',

        nextOfKinName:
          dto.nextOfKinName.trim(),

        nextOfKinPhone:
          dto.nextOfKinPhone.trim(),

        nextOfKinRelationship:
          dto.nextOfKinRelationship.trim(),

        preferredInstallmentPlan:
          dto.preferredInstallmentPlan,

        reason:
          dto.reason?.trim() ?? '',

        status:
          CreditApplicationStatus.PENDING,

        approvedAmount: 0,

        approvedInstallmentPlan: null,

        reviewedBy: null,

        adminNote: '',

        rejectionReason: '',

        informationRequest: '',

        reviewedAt: null,

        approvedAt: null,

        rejectedAt: null,
      });

    return application.save();
  }

  async getMyApplications(
    userId: string,
  ): Promise<CreditApplicationDocument[]> {
    this.validateObjectId(
      userId,
      'Invalid user ID.',
    );

    return this.creditApplicationModel
      .find({
        user: new Types.ObjectId(userId),
      })
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  async getMyApplication(
    userId: string,
    applicationId: string,
  ): Promise<CreditApplicationDocument> {
    this.validateObjectId(
      userId,
      'Invalid user ID.',
    );

    this.validateObjectId(
      applicationId,
      'Invalid credit application ID.',
    );

    const application =
      await this.creditApplicationModel
        .findOne({
          _id: new Types.ObjectId(
            applicationId,
          ),

          user: new Types.ObjectId(userId),
        })
        .exec();

    if (!application) {
      throw new NotFoundException(
        'DESIRE CREDIT application not found.',
      );
    }

    return application;
  }

  async cancelMyApplication(
    userId: string,
    applicationId: string,
  ): Promise<CreditApplicationDocument> {
    const application =
      await this.getMyApplication(
        userId,
        applicationId,
      );

    const cancellableStatuses = [
      CreditApplicationStatus.PENDING,
      CreditApplicationStatus
        .MORE_INFORMATION_REQUIRED,
    ];

    if (
      !cancellableStatuses.includes(
        application.status,
      )
    ) {
      throw new BadRequestException(
        'This DESIRE CREDIT application can no longer be cancelled.',
      );
    }

    application.status =
      CreditApplicationStatus.CANCELLED;

    return application.save();
  }

  /*
  |--------------------------------------------------------------------------
  | ADMIN APPLICATIONS
  |--------------------------------------------------------------------------
  */

  async getAllApplications(
    status?: CreditApplicationStatus,
  ): Promise<CreditApplicationDocument[]> {
    const filter: {
      status?: CreditApplicationStatus;
    } = {};

    if (status) {
      filter.status = status;
    }

    return this.creditApplicationModel
      .find(filter)
      .populate(
        'user',
        'firstName lastName email phone',
      )
      .populate(
        'reviewedBy',
        'firstName lastName email',
      )
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  async getApplicationForAdmin(
    applicationId: string,
  ): Promise<CreditApplicationDocument> {
    this.validateObjectId(
      applicationId,
      'Invalid credit application ID.',
    );

    const application =
      await this.creditApplicationModel
        .findById(applicationId)
        .populate(
          'user',
          'firstName lastName email phone',
        )
        .populate(
          'reviewedBy',
          'firstName lastName email',
        )
        .exec();

    if (!application) {
      throw new NotFoundException(
        'DESIRE CREDIT application not found.',
      );
    }

    return application;
  }

async reviewApplication(
  adminId: string,
  applicationId: string,
  dto: ReviewCreditApplicationDto,
): Promise<CreditApplicationDocument> {
  this.validateObjectId(
    adminId,
    'Invalid administrator ID.',
  );

  this.validateObjectId(
    applicationId,
    'Invalid credit application ID.',
  );

  const application =
    await this.creditApplicationModel
      .findById(applicationId)
      .exec();

  if (!application) {
    throw new NotFoundException(
      'DESIRE CREDIT application not found.',
    );
  }

  if (
    application.status ===
      CreditApplicationStatus.APPROVED ||
    application.status ===
      CreditApplicationStatus.REJECTED ||
    application.status ===
      CreditApplicationStatus.CANCELLED
  ) {
    throw new BadRequestException(
      'This DESIRE CREDIT application has already been finalized.',
    );
  }

  const allowedReviewStatuses = [
    CreditApplicationStatus.UNDER_REVIEW,
    CreditApplicationStatus.APPROVED,
    CreditApplicationStatus.REJECTED,
    CreditApplicationStatus
      .MORE_INFORMATION_REQUIRED,
  ];

  if (
    !allowedReviewStatuses.includes(dto.status)
  ) {
    throw new BadRequestException(
      'Invalid credit application review status.',
    );
  }

  if (
    dto.status ===
    CreditApplicationStatus.APPROVED
  ) {
    return this.approveApplication(
      adminId,
      application,
      dto,
    );
  }

  if (
    dto.status ===
    CreditApplicationStatus.REJECTED
  ) {
    if (!dto.rejectionReason?.trim()) {
      throw new BadRequestException(
        'A rejection reason is required.',
      );
    }

    application.status =
      CreditApplicationStatus.REJECTED;

    application.rejectionReason =
      dto.rejectionReason.trim();

    application.adminNote =
      dto.adminNote?.trim() ?? '';

    application.informationRequest = '';

    application.reviewedBy =
      new Types.ObjectId(adminId);

    application.reviewedAt = new Date();

    application.rejectedAt = new Date();

    application.approvedAt = null;

    application.approvedAmount = 0;

    application.approvedInstallmentPlan = null;

    return application.save();
  }

  if (
    dto.status ===
    CreditApplicationStatus
      .MORE_INFORMATION_REQUIRED
  ) {
    if (!dto.informationRequest?.trim()) {
      throw new BadRequestException(
        'Please specify the additional information required.',
      );
    }

    application.status =
      CreditApplicationStatus
        .MORE_INFORMATION_REQUIRED;

    application.informationRequest =
      dto.informationRequest.trim();

    application.adminNote =
      dto.adminNote?.trim() ?? '';

    application.rejectionReason = '';

    application.reviewedBy =
      new Types.ObjectId(adminId);

    application.reviewedAt = new Date();

    return application.save();
  }

  application.status =
    CreditApplicationStatus.UNDER_REVIEW;

  application.adminNote =
    dto.adminNote?.trim() ?? '';

  application.informationRequest = '';

  application.rejectionReason = '';

  application.reviewedBy =
    new Types.ObjectId(adminId);

  application.reviewedAt = new Date();

  return application.save();
}

/*
|--------------------------------------------------------------------------
| CREDIT ACCOUNTS
|--------------------------------------------------------------------------
*/

async getMyCreditAccount(
  userId: string,
): Promise<CreditAccountDocument> {
  this.validateObjectId(
    userId,
    'Invalid user ID.',
  );

  const creditAccount =
    await this.creditAccountModel
      .findOne({
        user: new Types.ObjectId(userId),
      })
      .populate(
        'application',
        'requestedAmount approvedAmount preferredInstallmentPlan approvedInstallmentPlan status approvedAt',
      )
      .exec();

  if (!creditAccount) {
    throw new NotFoundException(
      'You do not have a DESIRE CREDIT account.',
    );
  }

  return creditAccount;
}

async getAllCreditAccounts(
  status?: CreditAccountStatus,
): Promise<CreditAccountDocument[]> {
  const filter: {
    status?: CreditAccountStatus;
  } = {};

  if (status) {
    filter.status = status;
  }

  return this.creditAccountModel
    .find(filter)
    .populate(
      'user',
      'firstName lastName email phone',
    )
    .populate(
      'application',
      'requestedAmount approvedAmount status approvedAt',
    )
    .sort({
      createdAt: -1,
    })
    .exec();
}

 async getCreditAccountForAdmin(
  accountId: string,
): Promise<CreditAccountDocument> {
  this.validateObjectId(
    accountId,
    'Invalid DESIRE CREDIT account ID.',
  );

  const creditAccount =
    await this.creditAccountModel
      .findById(accountId)
      .populate(
        'user',
        'firstName lastName email phone',
      )
      .populate('application')
      .exec();

  if (!creditAccount) {
    throw new NotFoundException(
      'DESIRE CREDIT account not found.',
    );
  }

  return creditAccount;
}

async updateCreditAccount(
  accountId: string,
  dto: UpdateCreditAccountDto,
): Promise<CreditAccountDocument> {
  this.validateObjectId(
    accountId,
    'Invalid DESIRE CREDIT account ID.',
  );

  const creditAccount =
    await this.creditAccountModel
      .findById(accountId)
      .exec();

  if (!creditAccount) {
    throw new NotFoundException(
      'DESIRE CREDIT account not found.',
    );
  }

  if (
    dto.creditLimit !== undefined &&
    dto.creditLimit < creditAccount.usedCredit
  ) {
    throw new BadRequestException(
      'The credit limit cannot be lower than the customer’s currently used credit.',
    );
  }

  if (
    dto.commitmentPayment !== undefined &&
    dto.creditLimit !== undefined &&
    dto.commitmentPayment >= dto.creditLimit
  ) {
    throw new BadRequestException(
      'The commitment payment must be lower than the credit limit.',
    );
  }

  if (
    dto.commitmentPayment !== undefined &&
    dto.creditLimit === undefined &&
    dto.commitmentPayment >=
      creditAccount.creditLimit
  ) {
    throw new BadRequestException(
      'The commitment payment must be lower than the credit limit.',
    );
  }

  if (dto.creditLimit !== undefined) {
    creditAccount.creditLimit =
      dto.creditLimit;

    creditAccount.availableCredit =
      dto.creditLimit -
      creditAccount.usedCredit;
  }

  if (
    dto.commitmentPayment !== undefined
  ) {
    creditAccount.commitmentPayment =
      dto.commitmentPayment;
  }

  if (dto.installmentPlan !== undefined) {
    creditAccount.installmentPlan =
      dto.installmentPlan;
  }

  if (dto.status !== undefined) {
    this.updateCreditAccountStatus(
      creditAccount,
      dto.status,
      dto.statusReason,
    );
  } else if (
    dto.statusReason !== undefined
  ) {
    creditAccount.statusReason =
      dto.statusReason.trim();
  }

  return creditAccount.save();
}


/*
|--------------------------------------------------------------------------
| CREDIT PURCHASES
|--------------------------------------------------------------------------
*/

async createCreditPurchase(
  userId: string,
  dto: CreateCreditPurchaseDto,
): Promise<CreditPurchaseDocument> {
  this.validateObjectId(
    userId,
    'Invalid user ID.',
  );

  this.validateObjectId(
    dto.orderId,
    'Invalid order ID.',
  );

  const userObjectId =
    new Types.ObjectId(userId);

  const orderObjectId =
    new Types.ObjectId(dto.orderId);

  const creditAccount =
    await this.creditAccountModel
      .findOne({
        user: userObjectId,
      })
      .exec();

  if (!creditAccount) {
    throw new NotFoundException(
      'You do not have an approved DESIRE CREDIT account.',
    );
  }

  if (
    creditAccount.status !==
    CreditAccountStatus.ACTIVE
  ) {
    throw new BadRequestException(
      'Your DESIRE CREDIT account is not currently active.',
    );
  }

  const order =
    await this.orderModel
      .findOne({
        _id: orderObjectId,
        user: userObjectId,
      })
      .exec();

  if (!order) {
    throw new NotFoundException(
      'Order not found.',
    );
  }

  if (
    order.paymentStatus ===
    OrderPaymentStatus.PAID
  ) {
    throw new BadRequestException(
      'This order has already been fully paid.',
    );
  }

  if (
    order.status !== OrderStatus.PENDING
  ) {
    throw new BadRequestException(
      'Only pending orders can be converted to a DESIRE CREDIT purchase.',
    );
  }

  const existingPurchase =
    await this.creditPurchaseModel
      .findOne({
        order: orderObjectId,
      })
      .exec();

  if (existingPurchase) {
    throw new BadRequestException(
      'This order already has a DESIRE CREDIT purchase.',
    );
  }

  this.validateRequestedInstallmentPlan(
    creditAccount.installmentPlan,
    dto.installmentPlan,
  );

  const commitmentPaymentAmount =
    creditAccount.commitmentPayment;

  if (
    order.totalAmount <=
    commitmentPaymentAmount
  ) {
    throw new BadRequestException(
      'The order total must be greater than the required commitment payment.',
    );
  }

  const financedAmount =
    this.roundMoney(
      order.totalAmount -
        commitmentPaymentAmount,
    );

  if (
    financedAmount >
    creditAccount.availableCredit
  ) {
    throw new BadRequestException(
      'Your available DESIRE CREDIT is not enough to finance this purchase.',
    );
  }

  const totalInstallments =
    this.getInstallmentCount(
      dto.installmentPlan,
    );

  const installmentAmount =
    this.roundMoney(
      financedAmount /
        totalInstallments,
    );

  const creditPurchase =
    new this.creditPurchaseModel({
      user: userObjectId,

      creditAccount:
        creditAccount._id,

      order: orderObjectId,

      orderAmount:
        order.totalAmount,

      commitmentPaymentAmount,

      financedAmount,

      amountRepaid: 0,

      outstandingBalance:
        financedAmount,

      installmentPlan:
        dto.installmentPlan,

      installmentAmount,

      status:
        CreditPurchaseStatus
          .PENDING_COMMITMENT_PAYMENT,

      commitmentPaymentPaid: false,

      commitmentPayment: null,

      commitmentPaymentReference: '',

      commitmentPaymentPaidAt: null,

      activatedAt: null,

      firstPaymentDueDate: null,

      finalPaymentDueDate: null,

      fullyPaidAt: null,

      overdueAt: null,

      defaultedAt: null,

      cancelledAt: null,

      statusReason: '',

      notes:
        dto.notes?.trim() ?? '',
    });

  const savedPurchase =
    await creditPurchase.save();

  order.status =
    OrderStatus
      .AWAITING_COMMITMENT_PAYMENT;

  await order.save();

  return savedPurchase;
}

async verifyCommitmentPayment(
  userId: string,
  dto: VerifyCommitmentPaymentDto,
): Promise<CreditPurchaseDocument> {
  this.validateObjectId(
    userId,
    'Invalid user ID.',
  );

  this.validateObjectId(
    dto.creditPurchaseId,
    'Invalid DESIRE CREDIT purchase ID.',
  );

  this.validateObjectId(
    dto.paymentId,
    'Invalid payment ID.',
  );

  const userObjectId =
    new Types.ObjectId(userId);

  const purchaseObjectId =
    new Types.ObjectId(
      dto.creditPurchaseId,
    );

  const paymentObjectId =
    new Types.ObjectId(dto.paymentId);

  const creditPurchase =
    await this.creditPurchaseModel
      .findOne({
        _id: purchaseObjectId,
        user: userObjectId,
      })
      .exec();

  if (!creditPurchase) {
    throw new NotFoundException(
      'DESIRE CREDIT purchase not found.',
    );
  }

  if (
    creditPurchase.status !==
    CreditPurchaseStatus
      .PENDING_COMMITMENT_PAYMENT
  ) {
    throw new BadRequestException(
      'This commitment payment can no longer be verified.',
    );
  }

  if (
    creditPurchase.commitmentPaymentPaid
  ) {
    throw new BadRequestException(
      'The commitment payment has already been verified.',
    );
  }

  const payment =
    await this.paymentModel
      .findOne({
        _id: paymentObjectId,
        user: userObjectId,
        order: creditPurchase.order,
      })
      .exec();

  if (!payment) {
    throw new NotFoundException(
      'A matching payment record was not found.',
    );
  }

  if (
    payment.status !== PaymentStatus.PAID
  ) {
    throw new BadRequestException(
      'The commitment payment has not been successfully verified.',
    );
  }

  if (
    this.roundMoney(payment.amount) !==
    this.roundMoney(
      creditPurchase
        .commitmentPaymentAmount,
    )
  ) {
    throw new BadRequestException(
      `The verified payment must equal the required commitment payment of ₦${creditPurchase.commitmentPaymentAmount.toLocaleString('en-US')}.`,
    );
  }

  const paymentAlreadyUsed =
    await this.creditPurchaseModel
      .findOne({
        commitmentPayment:
          paymentObjectId,

        _id: {
          $ne: purchaseObjectId,
        },
      })
      .exec();

  if (paymentAlreadyUsed) {
    throw new BadRequestException(
      'This payment has already been used for another DESIRE CREDIT purchase.',
    );
  }

  const creditAccount =
    await this.creditAccountModel
      .findById(
        creditPurchase.creditAccount,
      )
      .exec();

  if (!creditAccount) {
    throw new NotFoundException(
      'DESIRE CREDIT account not found.',
    );
  }

  if (
    creditAccount.status !==
    CreditAccountStatus.ACTIVE
  ) {
    throw new BadRequestException(
      'The DESIRE CREDIT account is no longer active.',
    );
  }

  if (
    creditPurchase.financedAmount >
    creditAccount.availableCredit
  ) {
    throw new BadRequestException(
      'The customer no longer has enough available DESIRE CREDIT for this purchase.',
    );
  }

 const order =
    await this.orderModel
      .findOne({
        _id: creditPurchase.order,
        user: userObjectId,
      })
      .exec();

  if (!order) {
    throw new NotFoundException(
      'The related order was not found.',
    );
  }

  if (
    order.status !==
    OrderStatus
      .AWAITING_COMMITMENT_PAYMENT
  ) {
    throw new BadRequestException(
      'The related order is not awaiting a commitment payment.',
    );
  }

  /*
   * The verified DESIRE CREDIT commitment
   * payment must already have secured the
   * order inventory through PaymentsService
   * before the credit purchase is activated.
   */
  if (!order.inventoryDeducted) {
    throw new BadRequestException(
      'The order inventory has not yet been secured for this DESIRE CREDIT purchase.',
    );
  }

  /*
   * A commitment payment is only the upfront
   * portion of the purchase. The complete order
   * must remain unpaid until all DESIRE CREDIT
   * installments have been repaid.
   */
  if (
    order.paymentStatus ===
    OrderPaymentStatus.PAID
  ) {
    throw new BadRequestException(
      'This order has already been marked as fully paid.',
    );
  }

  const existingInstallments =
    await this.installmentModel.countDocuments({
      creditPurchase:
        creditPurchase._id,
    });

  if (existingInstallments > 0) {
    throw new BadRequestException(
      'Installments have already been generated for this purchase.',
    );
  }

  const now = new Date();

  const installmentSchedule =
    this.buildInstallmentSchedule(
      creditPurchase.financedAmount,
      creditPurchase.installmentPlan,
      now,
    );

  await this.installmentModel.insertMany(
    installmentSchedule.map(
      (installment) => ({
        user: userObjectId,

        creditAccount:
          creditAccount._id,

        creditPurchase:
          creditPurchase._id,

        order:
          creditPurchase.order,

        installmentNumber:
          installment.installmentNumber,

        totalInstallments:
          installmentSchedule.length,

        amount:
          installment.amount,

        amountPaid: 0,

        outstandingAmount:
          installment.amount,

        dueDate:
          installment.dueDate,

        status:
          InstallmentStatus.PENDING,

        payments: [],

        firstPaymentAt: null,

        paidAt: null,

        overdueAt: null,

        waivedAt: null,

        cancelledAt: null,

        lastPaymentReference: '',

        adminNote: '',

        lateFee: 0,

        reminderSent: false,

        reminderSentAt: null,
      }),
    ),
  );

  const firstInstallment =
    installmentSchedule[0];

  const finalInstallment =
    installmentSchedule[
      installmentSchedule.length - 1
    ];

  creditAccount.usedCredit =
    this.roundMoney(
      creditAccount.usedCredit +
        creditPurchase.financedAmount,
    );

  creditAccount.availableCredit =
    this.roundMoney(
      creditAccount.creditLimit -
        creditAccount.usedCredit,
    );

  creditAccount.totalBorrowed =
    this.roundMoney(
      creditAccount.totalBorrowed +
        creditPurchase.financedAmount,
    );

  creditAccount.outstandingBalance =
    this.roundMoney(
      creditAccount.outstandingBalance +
        creditPurchase.financedAmount,
    );

  creditAccount.nextPaymentDueDate =
    firstInstallment.dueDate;

  creditAccount.nextPaymentAmount =
    firstInstallment.amount;

  await creditAccount.save();

  creditPurchase.status =
    CreditPurchaseStatus.ACTIVE;

  creditPurchase.commitmentPaymentPaid =
    true;

  creditPurchase.commitmentPayment =
    paymentObjectId;

  creditPurchase
    .commitmentPaymentReference =
    dto.paymentReference?.trim() ||
    payment.providerReference ||
    payment.reference;

  creditPurchase
    .commitmentPaymentPaidAt = now;

  creditPurchase.activatedAt = now;

  creditPurchase.firstPaymentDueDate =
    firstInstallment.dueDate;

  creditPurchase.finalPaymentDueDate =
    finalInstallment.dueDate;

  creditPurchase.statusReason =
    dto.adminNote?.trim() ?? '';

  order.status =
    OrderStatus.PROCESSING;

  await order.save();

  return creditPurchase.save();
}

async recordInstallmentPayment(
  userId: string,
  dto: RecordInstallmentPaymentDto,
): Promise<{
  message: string;
  amountReceived: number;
  amountApplied: number;
  excessAmount: number;
  purchaseCompleted: boolean;
}> {
  this.validateObjectId(
    userId,
    'Invalid user ID.',
  );

  this.validateObjectId(
    dto.installmentId,
    'Invalid installment ID.',
  );

 this.validateObjectId(
  dto.paymentId,
  'Invalid payment ID.',
);

  if (dto.amount <= 0) {
    throw new BadRequestException(
      'The repayment amount must be greater than zero.',
    );
  }

  const userObjectId =
    new Types.ObjectId(userId);

  const installmentObjectId =
    new Types.ObjectId(
      dto.installmentId,
    );

  const initialInstallment =
    await this.installmentModel
      .findOne({
        _id: installmentObjectId,
        user: userObjectId,
      })
      .exec();

  if (!initialInstallment) {
    throw new NotFoundException(
      'DESIRE CREDIT installment not found.',
    );
  }

  if (
    initialInstallment.status ===
      InstallmentStatus.WAIVED ||
    initialInstallment.status ===
      InstallmentStatus.CANCELLED
  ) {
    throw new BadRequestException(
      'Payments cannot be recorded against this installment.',
    );
  }

  const creditPurchase =
    await this.creditPurchaseModel
      .findOne({
        _id: initialInstallment
          .creditPurchase,

        user: userObjectId,
      })
      .exec();

  if (!creditPurchase) {
    throw new NotFoundException(
      'The related DESIRE CREDIT purchase was not found.',
    );
  }

  if (
    creditPurchase.status !==
      CreditPurchaseStatus.ACTIVE &&
    creditPurchase.status !==
      CreditPurchaseStatus.OVERDUE
  ) {
    throw new BadRequestException(
      'This DESIRE CREDIT purchase is not accepting repayments.',
    );
  }

  const creditAccount =
    await this.creditAccountModel
      .findOne({
        _id: initialInstallment
          .creditAccount,

        user: userObjectId,
      })
      .exec();

  if (!creditAccount) {
    throw new NotFoundException(
      'The related DESIRE CREDIT account was not found.',
    );
  }

 
   const paymentObjectId =
  new Types.ObjectId(dto.paymentId);

const payment =
  await this.paymentModel
    .findOne({
      _id: paymentObjectId,

      user: userObjectId,

      order:
        initialInstallment.order,
    })
    .exec();

if (!payment) {
  throw new NotFoundException(
    'A matching payment record was not found.',
  );
}

/*
 * The payment must have been created
 * specifically as a DESIRE CREDIT
 * installment repayment.
 *
 * This prevents normal order payments
 * and commitment payments from being
 * reused as installment repayments.
 */
if (
  payment.purpose !==
  PaymentPurpose
    .DESIRE_CREDIT_INSTALLMENT
) {
  throw new BadRequestException(
    'This payment is not a DESIRE CREDIT installment repayment.',
  );
}

/*
 * The payment must belong specifically
 * to the selected installment.
 */
const paymentInstallmentId =
  typeof payment.metadata
    ?.installmentId === 'string'
    ? payment.metadata.installmentId
    : '';

if (
  paymentInstallmentId !==
  initialInstallment._id.toString()
) {
  throw new BadRequestException(
    'This payment was not created for the selected installment.',
  );
}

/*
 * The payment must also belong to the
 * same DESIRE CREDIT purchase.
 */
const paymentCreditPurchaseId =
  typeof payment.metadata
    ?.creditPurchaseId === 'string'
    ? payment.metadata.creditPurchaseId
    : '';

if (
  paymentCreditPurchaseId !==
  creditPurchase._id.toString()
) {
  throw new BadRequestException(
    'This payment does not belong to the selected DESIRE CREDIT purchase.',
  );
}

/*
 * Only an administrator-verified PAID
 * payment can be applied to installments.
 */
if (
  payment.status !==
  PaymentStatus.PAID
) {
  throw new BadRequestException(
    'The repayment has not been successfully verified.',
  );
}

/*
 * The amount being recorded must exactly
 * match the verified payment.
 */
if (
  this.roundMoney(payment.amount) !==
  this.roundMoney(dto.amount)
) {
  throw new BadRequestException(
    'The repayment amount does not match the verified payment amount.',
  );
}

/*
 * Prevent the same verified payment from
 * being applied more than once.
 */
const paymentAlreadyUsed =
  await this.installmentModel
    .findOne({
      payments:
        paymentObjectId,
    })
    .exec();

if (paymentAlreadyUsed) {
  throw new BadRequestException(
    'This payment has already been used for a DESIRE CREDIT repayment.',
  );
}

  const unpaidInstallments =
    await this.installmentModel
      .find({
        creditPurchase:
          creditPurchase._id,

        status: {
          $in: [
            InstallmentStatus.PENDING,
            InstallmentStatus
              .PARTIALLY_PAID,
            InstallmentStatus.OVERDUE,
          ],
        },
      })
      .sort({
        installmentNumber: 1,
      })
      .exec();

  if (unpaidInstallments.length === 0) {
    throw new BadRequestException(
      'There are no outstanding installments for this purchase.',
    );
  }

  const selectedInstallmentIndex =
    unpaidInstallments.findIndex(
      (installment) =>
        installment._id.toString() ===
        initialInstallment._id.toString(),
    );

  if (selectedInstallmentIndex === -1) {
    throw new BadRequestException(
      'The selected installment has already been completed.',
    );
  }

  const installmentsToPay =
    unpaidInstallments.slice(
      selectedInstallmentIndex,
    );

  const now = new Date();

  const amountReceived =
    this.roundMoney(dto.amount);

  let remainingAmount =
    amountReceived;

  let amountApplied = 0;

  for (
    const installment of
      installmentsToPay
  ) {
    if (remainingAmount <= 0) {
      break;
    }

    const outstandingAmount =
      this.roundMoney(
        installment.outstandingAmount,
      );

    if (outstandingAmount <= 0) {
      continue;
    }

    const amountForInstallment =
      this.roundMoney(
        Math.min(
          remainingAmount,
          outstandingAmount,
        ),
      );

    installment.amountPaid =
      this.roundMoney(
        installment.amountPaid +
          amountForInstallment,
      );

    installment.outstandingAmount =
      this.roundMoney(
        installment.amount -
          installment.amountPaid,
      );

    if (!installment.firstPaymentAt) {
      installment.firstPaymentAt = now;
    }

     installment.lastPaymentReference =
      dto.paymentReference?.trim() ||
      payment.providerReference ||
      payment.reference ||
     '';

   if (
  !installment.payments.some(
    (existingPaymentId) =>
      existingPaymentId.toString() ===
      payment._id.toString(),
  )
) {
  installment.payments.push(
    payment._id,
  );
}

    if (
      installment.outstandingAmount <=
      0
    ) {
      installment.outstandingAmount = 0;

      installment.status =
        InstallmentStatus.PAID;

      installment.paidAt = now;

      installment.overdueAt = null;
    } else {
      installment.status =
        InstallmentStatus
          .PARTIALLY_PAID;
    }

    amountApplied =
      this.roundMoney(
        amountApplied +
          amountForInstallment,
      );

    remainingAmount =
      this.roundMoney(
        remainingAmount -
          amountForInstallment,
      );

    await installment.save();
  }

  creditPurchase.amountRepaid =
    this.roundMoney(
      creditPurchase.amountRepaid +
        amountApplied,
    );

  creditPurchase.outstandingBalance =
    this.roundMoney(
      Math.max(
        0,
        creditPurchase.financedAmount -
          creditPurchase.amountRepaid,
      ),
    );

  creditAccount.totalRepaid =
    this.roundMoney(
      creditAccount.totalRepaid +
        amountApplied,
    );

  creditAccount.outstandingBalance =
    this.roundMoney(
      Math.max(
        0,
        creditAccount
          .outstandingBalance -
          amountApplied,
      ),
    );

  creditAccount.lastPaymentAt = now;

  const purchaseCompleted =
    creditPurchase
      .outstandingBalance === 0;

  if (purchaseCompleted) {
    await this.completeCreditPurchase(
      creditPurchase,
      creditAccount,
      now,
    );
  } else {
    await this.updateNextCreditPayment(
      creditAccount,
    );

    if (
      creditPurchase.status ===
      CreditPurchaseStatus.OVERDUE
    ) {
      const remainingOverdue =
        await this.installmentModel
          .countDocuments({
            creditPurchase:
              creditPurchase._id,

            status:
              InstallmentStatus.OVERDUE,
          });

      if (remainingOverdue === 0) {
        creditPurchase.status =
          CreditPurchaseStatus.ACTIVE;

        creditPurchase.overdueAt =
          null;
      }
    }

    await creditAccount.save();
    await creditPurchase.save();
  }

  return {
    message: purchaseCompleted
      ? 'DESIRE CREDIT purchase has been fully repaid.'
      : 'DESIRE CREDIT repayment recorded successfully.',

    amountReceived,

    amountApplied,

    excessAmount: remainingAmount,

    purchaseCompleted,
  };
}

 async recordInstallmentPaymentForAdmin(
  dto: RecordInstallmentPaymentDto,
): Promise<{
  message: string;
  amountReceived: number;
  amountApplied: number;
  excessAmount: number;
  purchaseCompleted: boolean;
}> {
  this.validateObjectId(
    dto.installmentId,
    'Invalid installment ID.',
  );

  const installment =
    await this.installmentModel
      .findById(
        dto.installmentId,
      )
      .select('user')
      .exec();

  if (!installment) {
    throw new NotFoundException(
      'DESIRE CREDIT installment not found.',
    );
  }

  return this.recordInstallmentPayment(
    installment.user.toString(),
    dto,
  );
}

@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
async monitorCreditAccounts(): Promise<void> {
  await this.markOverdueInstallments();
  await this.updateAccountBalances();
  await this.detectDefaults();
}

async getDashboardStatistics() {
  const [
    applications,
    activeAccounts,
    activePurchases,
    overduePurchases,
    defaultedPurchases,
    outstanding,
  ] = await Promise.all([
    this.creditApplicationModel.countDocuments(),

    this.creditAccountModel.countDocuments({
      status:
        CreditAccountStatus.ACTIVE,
    }),

    this.creditPurchaseModel.countDocuments({
      status:
        CreditPurchaseStatus.ACTIVE,
    }),

    this.creditPurchaseModel.countDocuments({
      status:
        CreditPurchaseStatus.OVERDUE,
    }),

    this.creditPurchaseModel.countDocuments({
      status:
        CreditPurchaseStatus.DEFAULTED,
    }),

    this.creditPurchaseModel.aggregate([
      {
        $group: {
          _id: null,

          total: {
            $sum:
              '$outstandingBalance',
          },
        },
      },
    ]),
  ]);

  return {
    totalApplications:
      applications,

    activeAccounts,

    activePurchases,

    overduePurchases,

    defaultedPurchases,

    outstandingBalance:
      outstanding[0]?.total ?? 0,
  };
}
  /*
  |--------------------------------------------------------------------------
  | HELPERS
  |--------------------------------------------------------------------------
  */

  private async approveApplication(
  adminId: string,
  application: CreditApplicationDocument,
  dto: ReviewCreditApplicationDto,
): Promise<CreditApplicationDocument> {
  if (
    dto.approvedAmount === undefined ||
    dto.approvedAmount === null
  ) {
    throw new BadRequestException(
      'An approved credit amount is required.',
    );
  }

  if (!dto.approvedInstallmentPlan) {
    throw new BadRequestException(
      'An approved installment plan is required.',
    );
  }

  if (
    dto.approvedAmount >
    application.requestedAmount
  ) {
    throw new BadRequestException(
      'The approved amount cannot exceed the amount requested by the customer.',
    );
  }

  const requestedPlanDays =
    CREDIT_INSTALLMENT_PLAN_DAYS[
      application.preferredInstallmentPlan
    ];

  const approvedPlanDays =
    CREDIT_INSTALLMENT_PLAN_DAYS[
      dto.approvedInstallmentPlan
    ];

  if (approvedPlanDays > requestedPlanDays) {
    throw new BadRequestException(
      'The approved installment plan cannot exceed the period requested by the customer.',
    );
  }

  const commitmentPayment =
    dto.commitmentPayment ?? 5000;

  if (commitmentPayment < 0) {
    throw new BadRequestException(
      'The commitment payment cannot be negative.',
    );
  }

  if (
    commitmentPayment >= dto.approvedAmount
  ) {
    throw new BadRequestException(
      'The commitment payment must be lower than the approved credit amount.',
    );
  }

  const existingAccount =
    await this.creditAccountModel
      .findOne({
        user: application.user,
      })
      .exec();

  if (existingAccount) {
    throw new BadRequestException(
      'This customer already has a DESIRE CREDIT account.',
    );
  }

  const now = new Date();

  const creditAccount =
    new this.creditAccountModel({
      user: application.user,

      application: application._id,

      creditLimit: dto.approvedAmount,

      usedCredit: 0,

      availableCredit: dto.approvedAmount,

      commitmentPayment,

      installmentPlan:
        dto.approvedInstallmentPlan,

      status: CreditAccountStatus.ACTIVE,

      totalBorrowed: 0,

      totalRepaid: 0,

      outstandingBalance: 0,

      overdueBalance: 0,

      missedPayments: 0,

      nextPaymentDueDate: null,

      nextPaymentAmount: 0,

      lastPaymentAt: null,

      activatedAt: now,

      suspendedAt: null,

      frozenAt: null,

      closedAt: null,

      statusReason: '',
    });

  await creditAccount.save();

  application.status =
    CreditApplicationStatus.APPROVED;

  application.approvedAmount =
    dto.approvedAmount;

  application.approvedInstallmentPlan =
    dto.approvedInstallmentPlan;

  application.adminNote =
    dto.adminNote?.trim() ?? '';

  application.rejectionReason = '';

  application.informationRequest = '';

  application.reviewedBy =
    new Types.ObjectId(adminId);

  application.reviewedAt = now;

  application.approvedAt = now;

  application.rejectedAt = null;

  return application.save();
}

 private updateCreditAccountStatus(
  creditAccount: CreditAccountDocument,
  status: CreditAccountStatus,
  statusReason?: string,
): void {
  const now = new Date();

  if (
    status !== CreditAccountStatus.ACTIVE &&
    !statusReason?.trim()
  ) {
    throw new BadRequestException(
      'A reason is required when restricting or closing a DESIRE CREDIT account.',
    );
  }

  creditAccount.status = status;

  creditAccount.statusReason =
    statusReason?.trim() ?? '';

  if (status === CreditAccountStatus.ACTIVE) {
    creditAccount.activatedAt = now;
    creditAccount.suspendedAt = null;
    creditAccount.frozenAt = null;
    creditAccount.closedAt = null;
    return;
  }

  if (
    status === CreditAccountStatus.SUSPENDED
  ) {
    creditAccount.suspendedAt = now;
    creditAccount.frozenAt = null;
    creditAccount.closedAt = null;
    return;
  }

  if (
    status === CreditAccountStatus.FROZEN
  ) {
    creditAccount.frozenAt = now;
    creditAccount.suspendedAt = null;
    creditAccount.closedAt = null;
    return;
  }

  if (
    status === CreditAccountStatus.CLOSED
  ) {
    if (
      creditAccount.outstandingBalance > 0
    ) {
      throw new BadRequestException(
        'A DESIRE CREDIT account with an outstanding balance cannot be closed.',
      );
    }

    creditAccount.closedAt = now;
    creditAccount.suspendedAt = null;
    creditAccount.frozenAt = null;
  }
}

private validateRequestedInstallmentPlan(
  approvedPlan: CreditInstallmentPlan,
  requestedPlan: CreditInstallmentPlan,
): void {
  const approvedDays =
    CREDIT_INSTALLMENT_PLAN_DAYS[
      approvedPlan
    ];

  const requestedDays =
    CREDIT_INSTALLMENT_PLAN_DAYS[
      requestedPlan
    ];

  if (!approvedDays || !requestedDays) {
    throw new BadRequestException(
      'Invalid DESIRE CREDIT installment plan.',
    );
  }

  if (requestedDays > approvedDays) {
    throw new BadRequestException(
      'The selected installment plan exceeds your approved repayment period.',
    );
  }
}

private getInstallmentCount(
  plan: CreditInstallmentPlan,
): number {
  const installmentCounts: Record<
    CreditInstallmentPlan,
    number
  > = {
    [CreditInstallmentPlan.TWO_WEEKS]:
      1,

    [CreditInstallmentPlan.FIFTEEN_DAYS]:
      1,

    [CreditInstallmentPlan.FOUR_WEEKS]:
      2,

    [CreditInstallmentPlan.ONE_MONTH]:
      2,

    [CreditInstallmentPlan.SIX_WEEKS]:
      3,

    [CreditInstallmentPlan
      .ONE_AND_HALF_MONTHS]:
      3,

    [CreditInstallmentPlan.EIGHT_WEEKS]:
      4,

    [CreditInstallmentPlan.TWO_MONTHS]:
      4,
  };

  return installmentCounts[plan];
}

private roundMoney(
  amount: number,
): number {
  return Math.round(
    (amount + Number.EPSILON) * 100,
  ) / 100;
}

private buildInstallmentSchedule(
  financedAmount: number,
  plan: CreditInstallmentPlan,
  activationDate: Date,
): Array<{
  installmentNumber: number;
  amount: number;
  dueDate: Date;
}> {
  const totalDays =
    CREDIT_INSTALLMENT_PLAN_DAYS[plan];

  const totalInstallments =
    this.getInstallmentCount(plan);

  if (
    !totalDays ||
    !totalInstallments
  ) {
    throw new BadRequestException(
      'Invalid DESIRE CREDIT installment plan.',
    );
  }

  const regularAmount =
    this.roundMoney(
      financedAmount /
        totalInstallments,
    );

  const schedule: Array<{
    installmentNumber: number;
    amount: number;
    dueDate: Date;
  }> = [];

  let allocatedAmount = 0;

  for (
    let index = 1;
    index <= totalInstallments;
    index += 1
  ) {
    const isFinalInstallment =
      index === totalInstallments;

    const amount =
      isFinalInstallment
        ? this.roundMoney(
            financedAmount -
              allocatedAmount,
          )
        : regularAmount;

    allocatedAmount =
      this.roundMoney(
        allocatedAmount + amount,
      );

    const dueDate =
      this.calculateInstallmentDueDate(
        activationDate,
        totalDays,
        totalInstallments,
        index,
      );

    schedule.push({
      installmentNumber: index,
      amount,
      dueDate,
    });
  }

  return schedule;
}

private calculateInstallmentDueDate(
  activationDate: Date,
  totalPlanDays: number,
  totalInstallments: number,
  installmentNumber: number,
): Date {
  const intervalDays =
    totalPlanDays /
    totalInstallments;

  const daysFromActivation =
    Math.round(
      intervalDays *
        installmentNumber,
    );

  const dueDate =
    new Date(activationDate);

  dueDate.setUTCDate(
    dueDate.getUTCDate() +
      daysFromActivation,
  );

  return dueDate;
}

private async completeCreditPurchase(
  creditPurchase:
    CreditPurchaseDocument,

  creditAccount:
    CreditAccountDocument,

  completedAt: Date,
): Promise<void> {
  const financedAmount =
    this.roundMoney(
      creditPurchase.financedAmount,
    );

  creditPurchase.status =
    CreditPurchaseStatus.COMPLETED;

  creditPurchase.amountRepaid =
    financedAmount;

  creditPurchase.outstandingBalance =
    0;

  creditPurchase.fullyPaidAt =
    completedAt;

  creditPurchase.overdueAt = null;

  creditPurchase.defaultedAt = null;

  creditAccount.usedCredit =
    this.roundMoney(
      Math.max(
        0,
        creditAccount.usedCredit -
          financedAmount,
      ),
    );

  creditAccount.availableCredit =
    this.roundMoney(
      creditAccount.creditLimit -
        creditAccount.usedCredit,
    );

  creditAccount.outstandingBalance =
    this.roundMoney(
      Math.max(
        0,
        creditAccount
          .outstandingBalance,
      ),
    );

  creditAccount.nextPaymentDueDate =
    null;

  creditAccount.nextPaymentAmount = 0;

  const order =
    await this.orderModel
      .findById(
        creditPurchase.order,
      )
      .exec();

  if (order) {
    order.paymentStatus =
      OrderPaymentStatus.PAID;

    await order.save();
  }

  await creditAccount.save();
  await creditPurchase.save();
}

private async updateNextCreditPayment(
  creditAccount:
    CreditAccountDocument,
): Promise<void> {
  const nextInstallment =
    await this.installmentModel
      .findOne({
        creditAccount:
          creditAccount._id,

        status: {
          $in: [
            InstallmentStatus.PENDING,
            InstallmentStatus
              .PARTIALLY_PAID,
            InstallmentStatus.OVERDUE,
          ],
        },
      })
      .sort({
        dueDate: 1,
        installmentNumber: 1,
      })
      .exec();

  if (!nextInstallment) {
    creditAccount.nextPaymentDueDate =
      null;

    creditAccount.nextPaymentAmount =
      0;

    return;
  }

  creditAccount.nextPaymentDueDate =
    nextInstallment.dueDate;

  creditAccount.nextPaymentAmount =
    this.roundMoney(
      nextInstallment
        .outstandingAmount,
    );
}

private async markOverdueInstallments(): Promise<void> {
  const today = new Date();

  const overdueInstallments =
    await this.installmentModel.find({
      dueDate: {
        $lt: today,
      },
      status: {
        $in: [
          InstallmentStatus.PENDING,
          InstallmentStatus.PARTIALLY_PAID,
        ],
      },
    });

  for (const installment of overdueInstallments) {
    installment.status =
      InstallmentStatus.OVERDUE;

    installment.overdueAt =
      installment.overdueAt ??
      today;

    await installment.save();
  }
}

private async updateAccountBalances(): Promise<void> {
  const purchases =
    await this.creditPurchaseModel.find({
      status: CreditPurchaseStatus.ACTIVE,
    });

  for (const purchase of purchases) {
    const overdue =
      await this.installmentModel.countDocuments({
        creditPurchase: purchase._id,
        status: InstallmentStatus.OVERDUE,
      });

    if (overdue > 0) {
      purchase.status =
        CreditPurchaseStatus.OVERDUE;

      purchase.overdueAt =
        purchase.overdueAt ??
        new Date();

      await purchase.save();
    }
  }
}

private async detectDefaults(): Promise<void> {
  const today = new Date();

  const purchases =
    await this.creditPurchaseModel.find({
      status:
        CreditPurchaseStatus.OVERDUE,
    });

  for (const purchase of purchases) {
    if (!purchase.overdueAt) {
      continue;
    }

    const days =
      Math.floor(
        (today.getTime() -
          purchase.overdueAt.getTime()) /
          86400000,
      );

    if (days < 30) {
      continue;
    }

    purchase.status =
      CreditPurchaseStatus.DEFAULTED;

    purchase.defaultedAt =
      today;

    await purchase.save();

    const account =
      await this.creditAccountModel.findById(
        purchase.creditAccount,
      );

    if (!account) {
      continue;
    }

    account.status =
      CreditAccountStatus.SUSPENDED;

    account.statusReason =
      'Automatically suspended due to loan default.';

    account.suspendedAt =
      today;

    account.missedPayments += 1;

    await account.save();
  }
}
  private validateObjectId(
    value: string,
    message: string,
  ): void {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(message);
    }
  }

  async getMyCreditPurchases(
  userId: string,
): Promise<CreditPurchaseDocument[]> {
  this.validateObjectId(
    userId,
    'Invalid user ID.',
  );

  return this.creditPurchaseModel
    .find({
      user: new Types.ObjectId(userId),
    })
    .populate(
      'order',
      'orderNumber totalAmount status paymentStatus createdAt',
    )
    .sort({
      createdAt: -1,
    })
    .exec();
}

async getMyCreditPurchase(
  userId: string,
  purchaseId: string,
): Promise<CreditPurchaseDocument> {
  this.validateObjectId(
    userId,
    'Invalid user ID.',
  );

  this.validateObjectId(
    purchaseId,
    'Invalid DESIRE CREDIT purchase ID.',
  );

  const purchase =
    await this.creditPurchaseModel
      .findOne({
        _id: new Types.ObjectId(
          purchaseId,
        ),
        user: new Types.ObjectId(
          userId,
        ),
      })
      .populate('order')
      .populate(
        'commitmentPayment',
        'reference providerReference amount status paidAt verifiedAt',
      )
      .exec();

  if (!purchase) {
    throw new NotFoundException(
      'DESIRE CREDIT purchase not found.',
    );
  }

  return purchase;
}

async getAllCreditPurchases(
  status?: CreditPurchaseStatus,
): Promise<CreditPurchaseDocument[]> {
  const filter: {
    status?: CreditPurchaseStatus;
  } = {};

  if (status) {
    filter.status = status;
  }

  return this.creditPurchaseModel
    .find(filter)
    .populate(
      'user',
      'firstName lastName email phone',
    )
    .populate(
      'creditAccount',
      'creditLimit usedCredit availableCredit commitmentPayment installmentPlan status outstandingBalance',
    )
    .populate(
      'order',
      'orderNumber totalAmount status paymentStatus createdAt',
    )
    .populate(
      'commitmentPayment',
      'reference providerReference amount status purpose paidAt verifiedAt',
    )
    .sort({
      createdAt: -1,
    })
    .exec();
}

async getCreditPurchaseForAdmin(
  purchaseId: string,
): Promise<CreditPurchaseDocument> {
  this.validateObjectId(
    purchaseId,
    'Invalid DESIRE CREDIT purchase ID.',
  );

  const purchase =
    await this.creditPurchaseModel
      .findById(purchaseId)
      .populate(
        'user',
        'firstName lastName email phone',
      )
      .populate(
        'creditAccount',
        'creditLimit usedCredit availableCredit commitmentPayment installmentPlan status totalBorrowed totalRepaid outstandingBalance overdueBalance nextPaymentDueDate nextPaymentAmount',
      )
      .populate('order')
      .populate(
        'commitmentPayment',
        'reference providerReference amount currency provider purpose status proofOfPaymentUrl senderName transferReference transferDate submittedAmount paidAt verifiedAt createdAt',
      )
      .exec();

  if (!purchase) {
    throw new NotFoundException(
      'DESIRE CREDIT purchase not found.',
    );
  }

  return purchase;
}

 async getAllInstallmentsForAdmin(
  status?: InstallmentStatus,
): Promise<InstallmentDocument[]> {
  const filter: {
    status?: InstallmentStatus;
  } = {};

  if (status) {
    filter.status = status;
  }

  return this.installmentModel
    .find(filter)
    .populate(
      'user',
      'firstName lastName email phone',
    )
    .populate(
      'creditAccount',
      'creditLimit usedCredit availableCredit status outstandingBalance overdueBalance nextPaymentDueDate nextPaymentAmount',
    )
    .populate(
      'creditPurchase',
      'orderAmount financedAmount amountRepaid outstandingBalance installmentPlan installmentAmount status commitmentPaymentPaid activatedAt firstPaymentDueDate finalPaymentDueDate',
    )
    .populate(
      'order',
      'orderNumber totalAmount status paymentStatus createdAt',
    )
    .populate(
      'payments',
      'reference providerReference amount status purpose paidAt verifiedAt createdAt',
    )
    .sort({
      dueDate: 1,
      installmentNumber: 1,
    })
    .exec();
}

async getInstallmentForAdmin(
  installmentId: string,
): Promise<InstallmentDocument> {
  this.validateObjectId(
    installmentId,
    'Invalid DESIRE CREDIT installment ID.',
  );

  const installment =
    await this.installmentModel
      .findById(installmentId)
      .populate(
        'user',
        'firstName lastName email phone',
      )
      .populate(
        'creditAccount',
        'creditLimit usedCredit availableCredit commitmentPayment installmentPlan status totalBorrowed totalRepaid outstandingBalance overdueBalance nextPaymentDueDate nextPaymentAmount',
      )
      .populate(
        'creditPurchase',
        'orderAmount commitmentPaymentAmount financedAmount amountRepaid outstandingBalance installmentPlan installmentAmount status commitmentPaymentPaid commitmentPaymentReference commitmentPaymentPaidAt activatedAt firstPaymentDueDate finalPaymentDueDate fullyPaidAt overdueAt defaultedAt cancelledAt statusReason notes',
      )
      .populate('order')
      .populate(
        'payments',
        'reference providerReference amount currency provider purpose status proofOfPaymentUrl senderName transferReference transferDate submittedAmount paidAt verifiedAt createdAt',
      )
      .exec();

  if (!installment) {
    throw new NotFoundException(
      'DESIRE CREDIT installment not found.',
    );
  }

  return installment;
}

async getMyInstallments(
  userId: string,
): Promise<InstallmentDocument[]> {
  this.validateObjectId(
    userId,
    'Invalid user ID.',
  );

  return this.installmentModel
    .find({
      user: new Types.ObjectId(userId),
    })
    .populate(
      'order',
      'orderNumber totalAmount status paymentStatus createdAt',
    )
    .populate(
      'creditPurchase',
      'orderAmount financedAmount amountRepaid outstandingBalance installmentPlan installmentAmount status firstPaymentDueDate finalPaymentDueDate',
    )
    .sort({
      dueDate: 1,
      installmentNumber: 1,
    })
    .exec();
}

async getMyInstallment(
  userId: string,
  installmentId: string,
): Promise<InstallmentDocument> {
  this.validateObjectId(
    userId,
    'Invalid user ID.',
  );

  this.validateObjectId(
    installmentId,
    'Invalid installment ID.',
  );

  const installment =
    await this.installmentModel
      .findOne({
        _id: new Types.ObjectId(
          installmentId,
        ),
        user: new Types.ObjectId(
          userId,
        ),
      })
      .populate('order')
      .populate('creditPurchase')
      .exec();

  if (!installment) {
    throw new NotFoundException(
      'DESIRE CREDIT installment not found.',
    );
  }

  return installment;
}

}