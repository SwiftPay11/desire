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
  Order,
  OrderDocument,
  OrderStatus,
  PaymentStatus,
} from './schemas/order.schema';

import {
  Cart,
  CartDocument,
} from '../cart/schemas/cart.schema';

import {
  Product,
  ProductDocument,
} from '../products/schemas/product.schema';

import {
  Address,
  AddressDocument,
} from '../addressess/schemas/address.schema';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';

import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel:
      Model<OrderDocument>,

    @InjectModel(Cart.name)
    private readonly cartModel:
      Model<CartDocument>,

    @InjectModel(Product.name)
    private readonly productModel:
      Model<ProductDocument>,

    @InjectModel(Address.name)
    private readonly addressModel:
      Model<AddressDocument>,

    private readonly mailService: MailService,

    private readonly usersService: UsersService,
  ) {}

  async create(
    userId: string,
    dto: CreateOrderDto,
  ) {
    const userObjectId =
      new Types.ObjectId(userId);

    const cart =
      await this.cartModel
        .findOne({
          user: userObjectId,
        })
        .populate('items.product');

    if (
      !cart ||
      cart.items.length === 0
    ) {
      throw new BadRequestException(
        'Your cart is empty',
      );
    }

    const address =
      await this.addressModel.findOne({
        _id: dto.addressId,
        user: userObjectId,
      });

    if (!address) {
      throw new NotFoundException(
        'Address not found',
      );
    }

    let subtotal = 0;

    const orderItems: Array<{
      product: Types.ObjectId;
      name: string;
      slug: string;
      price: number;
      quantity: number;
      size?: string;
      color?: string;
      image: string;
      subtotal: number;
    }> = [];

    for (
      const item of cart.items as any[]
    ) {
      /*
       * If a product was deleted from the
       * database, populate() returns null.
       */
      if (!item.product) {
        throw new BadRequestException(
          'One or more products in your cart are no longer available. Please remove them from your cart and try again.',
        );
      }

      const productId =
        item.product?._id ||
        item.product;

      if (!productId) {
        throw new BadRequestException(
          'One or more products in your cart are invalid. Please remove them from your cart and try again.',
        );
      }

      const product =
        await this.productModel.findById(
          productId,
        );

      if (!product) {
        throw new NotFoundException(
          'One or more products in your cart are no longer available. Please remove them from your cart and try again.',
        );
      }

      if (!product.isActive) {
        throw new BadRequestException(
          `${product.name} is unavailable`,
        );
      }

      if (
        !item.quantity ||
        item.quantity <= 0
      ) {
        throw new BadRequestException(
          `Invalid quantity for ${product.name}`,
        );
      }

      /*
       * Check stock during order creation,
       * but do not deduct it here.
       *
       * Stock is deducted only when the
       * payment is confirmed as PAID.
       */
      if (
        product.stock <
        item.quantity
      ) {
        throw new BadRequestException(
          `Not enough stock for ${product.name}`,
        );
      }

      const lineSubtotal =
        product.price *
        item.quantity;

      subtotal +=
        lineSubtotal;

      orderItems.push({
        product:
          product._id as Types.ObjectId,

        name:
          product.name,

        slug:
          product.slug,

        price:
          product.price,

        quantity:
          item.quantity,

        size:
          item.size,

        color:
          item.color,

        image:
          product.images[0] || '',

        subtotal:
          lineSubtotal,
      });
    }

    const shippingFee = 0;

    const discount = 0;

    const totalAmount =
      subtotal +
      shippingFee -
      discount;

    const order =
      await this.orderModel.create({
        user:
          userObjectId,

        orderNumber:
          await this.generateOrderNumber(),

        items:
          orderItems,

        shippingAddress: {
          fullName:
            address.fullName,

          phone:
            address.phone,

          addressLine1:
            address.addressLine1,

          addressLine2:
            address.addressLine2,

          city:
            address.city,

          state:
            address.state,

          country:
            address.country,

          postalCode:
            address.postalCode,
        },

        subtotal,

        shippingFee,

        discount,

        totalAmount,

        notes:
          dto.notes || '',

        status:
          OrderStatus.PENDING,

        paymentStatus:
          PaymentStatus.PENDING,

        inventoryDeducted:
          false,

        inventoryDeductedAt:
          null,

        inventoryPaymentReference:
          '',
      });

    /*
     * Clear the cart only after the order
     * has successfully been created.
     */
    cart.items = [];

    await cart.save();

    /*
     * EMAIL NOTIFICATIONS
     *
     * Only send emails after the order
     * has been created successfully.
     *
     * Email failures must not affect
     * the customer's completed order.
     */
    try {
      const user =
        await this.usersService.findById(
          userId,
        );

      if (user) {
        const emailItems =
          orderItems.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          }));

        await Promise.allSettled([
          this.mailService.sendOrderConfirmationEmail({
            email: user.email,
            fullName: user.fullName,
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            items: emailItems,
          }),

          this.mailService.sendNewOrderAdminEmail({
            fullName: user.fullName,
            email: user.email,
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            items: emailItems,
          }),
        ]);
      }
    } catch (error) {
      /*
       * Never report a successfully
       * created order as failed because
       * of an email notification error.
       */
      console.error(
        'Order email notification error:',
        error,
      );
    }

    return {
      message:
        'Order placed successfully',

      order,
    };
  }

  async findMyOrders(
    userId: string,
  ) {
    const orders =
      await this.orderModel
        .find({
          user:
            new Types.ObjectId(
              userId,
            ),
        })
        .sort({
          createdAt: -1,
        });

    return {
      orders,
    };
  }

  async findOne(
    userId: string,
    orderId: string,
  ) {
    if (
      !Types.ObjectId.isValid(
        orderId,
      )
    ) {
      throw new NotFoundException(
        'Order not found',
      );
    }

    const order =
      await this.orderModel.findOne({
        _id: orderId,

        user:
          new Types.ObjectId(
            userId,
          ),
      });

    if (!order) {
      throw new NotFoundException(
        'Order not found',
      );
    }

    return {
      order,
    };
  }

  /*
   * ==========================
   * ADMIN ORDER MANAGEMENT
   * ==========================
   */

  async findAll() {
    const orders =
      await this.orderModel
        .find()
        .populate(
          'user',
          'fullName email phone',
        )
        .sort({
          createdAt: -1,
        });

    return {
      orders,
    };
  }

  async findOneAdmin(
    orderId: string,
  ) {
    if (
      !Types.ObjectId.isValid(
        orderId,
      )
    ) {
      throw new NotFoundException(
        'Order not found',
      );
    }

    const order =
      await this.orderModel
        .findById(orderId)
        .populate(
          'user',
          'fullName email phone createdAt',
        );

    if (!order) {
      throw new NotFoundException(
        'Order not found',
      );
    }

    return {
      order,
    };
  }

  async updateStatus(
    orderId: string,
    dto: UpdateOrderStatusDto,
  ) {
    if (
      !Types.ObjectId.isValid(
        orderId,
      )
    ) {
      throw new NotFoundException(
        'Order not found',
      );
    }

    const order =
      await this.orderModel.findById(
        orderId,
      );

    if (!order) {
      throw new NotFoundException(
        'Order not found',
      );
    }

    order.status =
      dto.status;

    await order.save();

    return {
      message:
        'Order status updated successfully',

      order,
    };
  }

  async updatePaymentStatus(
    orderId: string,
    dto: UpdatePaymentStatusDto,
  ) {
    if (
      !Types.ObjectId.isValid(
        orderId,
      )
    ) {
      throw new NotFoundException(
        'Order not found',
      );
    }

    const order =
      await this.orderModel.findById(
        orderId,
      );

    if (!order) {
      throw new NotFoundException(
        'Order not found',
      );
    }

    /*
     * Directly changing an order to PAID
     * from the Orders endpoint would bypass
     * the real Payment inventory workflow.
     */
    if (
      dto.paymentStatus ===
        PaymentStatus.PAID &&
      !order.inventoryDeducted
    ) {
      throw new BadRequestException(
        'An order can only become PAID through payment verification',
      );
    }

    order.paymentStatus =
      dto.paymentStatus;

    await order.save();

    return {
      message:
        'Payment status updated successfully',

      order,
    };
  }

  private async generateOrderNumber() {
    while (true) {
      const orderNumber =
        `DES-${Date.now()}-${Math.floor(
          1000 +
            Math.random() *
              9000,
        )}`;

      const exists =
        await this.orderModel.exists({
          orderNumber,
        });

      if (!exists) {
        return orderNumber;
      }
    }
  }
}