import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import {
  desireEmailTemplate,
} from './templates/desire-email.template';

@Injectable()
export class MailService {
  private readonly logger =
    new Logger(MailService.name);

  private readonly transporter;

  constructor(
    private readonly configService: ConfigService,
  ) {
    const host =
      this.configService.get<string>(
        'MAIL_HOST',
      );

    const port = Number(
      this.configService.get<string>(
        'MAIL_PORT',
      ) || 465,
    );

    const secure =
      this.configService.get<string>(
        'MAIL_SECURE',
      ) === 'true';

    const user =
      this.configService.get<string>(
        'MAIL_USER',
      );

    const password =
      this.configService.get<string>(
        'MAIL_PASSWORD',
      );

    this.transporter =
      nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass: password,
        },
      });
  }

  async sendMail({
    to,
    subject,
    html,
    text,
  }: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<boolean> {
    try {
      const fromName =
        this.configService.get<string>(
          'MAIL_FROM_NAME',
        ) || 'DESIRE';

      const fromEmail =
        this.configService.get<string>(
          'MAIL_FROM_EMAIL',
        );

      if (!fromEmail) {
        this.logger.error(
          'MAIL_FROM_EMAIL is not configured.',
        );

        return false;
      }

      if (!to) {
        this.logger.error(
          'Email recipient is missing.',
        );

        return false;
      }

      await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        html,
        text,
      });

      this.logger.log(
        `Email sent successfully to ${to}`,
      );

      return true;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown mail error';

      this.logger.error(
        `Unable to send email: ${message}`,
      );

      return false;
    }
  }

  getAdminEmail(): string {
    return (
      this.configService.get<string>(
        'ADMIN_EMAIL',
      ) ||
      this.configService.get<string>(
        'MAIL_FROM_EMAIL',
      ) ||
      ''
    );
  }

  async sendTestEmail(): Promise<boolean> {
  const adminEmail =
    this.getAdminEmail();

  if (!adminEmail) {
    this.logger.error(
      'ADMIN_EMAIL is not configured.',
    );

    return false;
  }

  const html =
    desireEmailTemplate({
      eyebrow: 'EMAIL SYSTEM',
      title: 'DESIRE email integration is live.',
      message:
        'This is a test email from the DESIRE backend. Your email configuration is working correctly.',
      content: `
        <div
          style="
            padding:18px;
            background:#f7f7f5;
            border:1px solid #e7e7e3;
          "
        >
          Transactional emails are now ready
          to be connected to your DESIRE
          account, orders, payments and
          DESIRE CREDIT system.
        </div>
      `,
    });

  return this.sendMail({
    to: adminEmail,
    subject:
      'DESIRE — Email Integration Test',
    html,
    text:
      'DESIRE email integration is live. Your backend email configuration is working correctly.',
  });
}

async sendWelcomeEmail({
  email,
  fullName,
}: {
  email: string;
  fullName: string;
}): Promise<boolean> {
  const html =
    desireEmailTemplate({
      eyebrow: 'WELCOME TO DESIRE',
      title: `Welcome, ${fullName}.`,
      message:
        'Your DESIRE account has been created successfully. You can now manage your orders, save your details and access your DESIRE experience from your account.',
      content: `
        <div
          style="
            padding:20px;
            background:#f7f7f5;
            border:1px solid #e7e7e3;
          "
        >
          <strong
            style="
              display:block;
              margin-bottom:8px;
              color:#111111;
            "
          >
            Your account is ready
          </strong>

          <span style="color:#555555;">
            Sign in anytime using
            ${email}.
          </span>
        </div>
      `,
      footerText:
        'Welcome to DESIRE. Luxury designed with intention.',
    });

  return this.sendMail({
    to: email,
    subject:
      'Welcome to DESIRE',
    html,
    text:
      `Welcome to DESIRE, ${fullName}. Your account has been created successfully.`,
  });
}

async sendNewCustomerAdminEmail({
  fullName,
  email,
  phone,
}: {
  fullName: string;
  email: string;
  phone?: string;
}): Promise<boolean> {
  const adminEmail =
    this.getAdminEmail();

  if (!adminEmail) {
    this.logger.error(
      'ADMIN_EMAIL is not configured.',
    );

    return false;
  }

  const html =
    desireEmailTemplate({
      eyebrow: 'NEW CUSTOMER',
      title: 'A new customer joined DESIRE.',
      message:
        'A new customer account has been created on the DESIRE store.',
      content: `
        <div
          style="
            padding:20px;
            background:#f7f7f5;
            border:1px solid #e7e7e3;
          "
        >
          <div style="margin-bottom:12px;">
            <strong>Name:</strong>
            ${fullName}
          </div>

          <div style="margin-bottom:12px;">
            <strong>Email:</strong>
            ${email}
          </div>

          <div>
            <strong>Phone:</strong>
            ${phone || 'Not provided'}
          </div>
        </div>
      `,
    });

  return this.sendMail({
    to: adminEmail,
    subject:
      `DESIRE — New Customer: ${fullName}`,
    html,
    text:
      `New DESIRE customer: ${fullName} (${email}).`,
  });
}

async sendPasswordChangedEmail({
  email,
  fullName,
}: {
  email: string;
  fullName: string;
}): Promise<boolean> {
  const html =
    desireEmailTemplate({
      eyebrow: 'ACCOUNT SECURITY',
      title: 'Your password was changed.',
      message:
        `Hello ${fullName}, the password for your DESIRE account was changed successfully.`,
      content: `
        <div
          style="
            padding:20px;
            background:#f7f7f5;
            border:1px solid #e7e7e3;
          "
        >
          <strong
            style="
              display:block;
              margin-bottom:8px;
              color:#111111;
            "
          >
            Security notice
          </strong>

          <span style="color:#555555;">
            If you made this change,
            no further action is required.
            If you did not change your
            password, please contact DESIRE
            immediately.
          </span>
        </div>
      `,
      footerText:
        'DESIRE account security.',
    });

  return this.sendMail({
    to: email,
    subject:
      'DESIRE — Your Password Was Changed',
    html,
    text:
      `Hello ${fullName}, your DESIRE account password was changed successfully. If you did not make this change, please contact DESIRE immediately.`,
  });
}

async sendOrderConfirmationEmail({
  email,
  fullName,
  orderNumber,
  totalAmount,
  items,
}: {
  email: string;
  fullName: string;
  orderNumber: string;
  totalAmount: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}): Promise<boolean> {
  const formatMoney = (amount: number) =>
    `₦${amount.toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const escapeHtml = (value: string) =>
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const itemsHtml = items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #eee;">
            ${escapeHtml(item.name)}
            <br />
            <span style="color:#777;font-size:12px;">
              Quantity: ${item.quantity}
            </span>
          </td>
          <td
            align="right"
            style="padding:12px 0;border-bottom:1px solid #eee;"
          >
            ${formatMoney(item.price * item.quantity)}
          </td>
        </tr>
      `,
    )
    .join('');

  const html = desireEmailTemplate({
    eyebrow: 'ORDER CONFIRMATION',
    title: 'Your order has been received.',
    message:
      `Hello ${fullName}, thank you for shopping with DESIRE. ` +
      'Your order has been placed successfully and is awaiting payment confirmation.',
    content: `
      <div style="padding:20px;background:#f7f7f5;border:1px solid #e7e7e3;">
        <p style="margin:0 0 16px;">
          <strong>Order Number:</strong>
          ${escapeHtml(orderNumber)}
        </p>

        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          style="font-family:Arial,sans-serif;font-size:14px;"
        >
          ${itemsHtml}
        </table>

        <p style="margin:20px 0 0;font-size:17px;">
          <strong>Total: ${formatMoney(totalAmount)}</strong>
        </p>

        <p style="margin:14px 0 0;color:#666;font-size:12px;">
          Payment status: Pending
        </p>
      </div>
    `,
  });

  return this.sendMail({
    to: email,
    subject: `DESIRE — Order Confirmation ${orderNumber}`,
    html,
    text:
      `Hello ${fullName}, your DESIRE order ${orderNumber} ` +
      `has been received. Total: ${formatMoney(totalAmount)}. ` +
      'Payment is pending.',
  });
}

async sendNewOrderAdminEmail({
  fullName,
  email,
  orderNumber,
  totalAmount,
  items,
}: {
  fullName: string;
  email: string;
  orderNumber: string;
  totalAmount: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}): Promise<boolean> {
  const adminEmail = this.getAdminEmail();

  if (!adminEmail) {
    this.logger.error('ADMIN_EMAIL is not configured.');
    return false;
  }

  const formatMoney = (amount: number) =>
    `₦${amount.toLocaleString('en-NG')}`;

  const escapeHtml = (value: string) =>
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const itemsHtml = items
    .map(
      (item) => `
        <li style="margin-bottom:8px;">
          ${escapeHtml(item.name)}
          × ${item.quantity}
          — ${formatMoney(item.price * item.quantity)}
        </li>
      `,
    )
    .join('');

  const html = desireEmailTemplate({
    eyebrow: 'NEW ORDER',
    title: 'A new order has been placed.',
    message:
      'A customer has successfully placed an order on DESIRE.',
    content: `
      <div style="padding:20px;background:#f7f7f5;border:1px solid #e7e7e3;">
        <p><strong>Order:</strong> ${escapeHtml(orderNumber)}</p>
        <p><strong>Customer:</strong> ${escapeHtml(fullName)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>

        <hr style="border:0;border-top:1px solid #ddd;margin:18px 0;" />

        <strong>Items Ordered</strong>
        <ul style="padding-left:20px;">
          ${itemsHtml}
        </ul>

        <p style="font-size:17px;">
          <strong>Total: ${formatMoney(totalAmount)}</strong>
        </p>

        <p style="color:#666;font-size:12px;">
          Payment status: Pending
        </p>
      </div>
    `,
  });

  return this.sendMail({
    to: adminEmail,
    subject: `DESIRE — New Order ${orderNumber}`,
    html,
    text:
      `New DESIRE order ${orderNumber} from ${fullName} (${email}). ` +
      `Total: ${formatMoney(totalAmount)}. Payment pending.`,
  });
}

async sendPaymentInstructionsEmail({
  email,
  fullName,
  orderNumber,
  paymentReference,
  amount,
  currency,
}: {
  email: string;
  fullName: string;
  orderNumber: string;
  paymentReference: string;
  amount: number;
  currency: string;
}): Promise<boolean> {
  const bankName =
    this.configService.get<string>(
      'BANK_NAME',
    );

  const accountName =
    this.configService.get<string>(
      'BANK_ACCOUNT_NAME',
    );

  const accountNumber =
    this.configService.get<string>(
      'BANK_ACCOUNT_NUMBER',
    );

  if (
    !bankName ||
    !accountName ||
    !accountNumber
  ) {
    this.logger.error(
      'Bank transfer email configuration is incomplete.',
    );

    return false;
  }

  const escapeHtml = (value: string) =>
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const formattedAmount =
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
    }).format(amount);

  const html =
    desireEmailTemplate({
      eyebrow: 'PAYMENT INSTRUCTIONS',

      title: 'Complete your payment.',

      message:
        `Hello ${fullName}, your DESIRE payment is ready. ` +
        'Please use the bank details below to complete your transfer.',

      content: `
        <div
          style="
            padding:24px;
            background:#f7f7f5;
            border:1px solid #e7e7e3;
          "
        >
          <p>
            <strong>Order Number:</strong><br />
            ${escapeHtml(orderNumber)}
          </p>

          <p>
            <strong>Payment Reference:</strong><br />
            ${escapeHtml(paymentReference)}
          </p>

          <p>
            <strong>Amount:</strong><br />
            ${escapeHtml(formattedAmount)}
          </p>

          <hr
            style="
              border:0;
              border-top:1px solid #ddd;
              margin:24px 0;
            "
          />

          <p>
            <strong>Bank Name:</strong><br />
            ${escapeHtml(bankName)}
          </p>

          <p>
            <strong>Account Name:</strong><br />
            ${escapeHtml(accountName)}
          </p>

          <p>
            <strong>Account Number:</strong><br />
            ${escapeHtml(accountNumber)}
          </p>
        </div>

        <div style="margin-top:24px;">
          <strong>What happens next?</strong>

          <ol
            style="
              padding-left:20px;
              line-height:2;
            "
          >
            <li>
              Transfer the exact payment amount.
            </li>

            <li>
              Return to DESIRE and submit
              your transfer details and proof.
            </li>

            <li>
              Wait for payment verification.
            </li>
          </ol>

          <p style="color:#777;font-size:12px;">
            Your payment remains pending
            until it has been verified.
          </p>
        </div>
      `,

      footerText:
        'DESIRE — Secure payment instructions.',
    });

  return this.sendMail({
    to: email,

    subject:
      `DESIRE — Payment Instructions ${orderNumber}`,

    html,

    text:
      `Hello ${fullName}, complete your DESIRE payment.\n\n` +
      `Order: ${orderNumber}\n` +
      `Payment Reference: ${paymentReference}\n` +
      `Amount: ${formattedAmount}\n\n` +
      `Bank: ${bankName}\n` +
      `Account Name: ${accountName}\n` +
      `Account Number: ${accountNumber}\n\n` +
      'After transferring, return to DESIRE and submit your payment proof.',
  });
}

/*
 * ==========================================
 * STAGE 5.4A
 * CUSTOMER PAYMENT SUBMISSION EMAIL
 * ==========================================
 */

async sendPaymentSubmittedEmail({
  email,
  fullName,
  orderNumber,
  paymentReference,
  amount,
  currency,
}: {
  email: string;
  fullName: string;
  orderNumber: string;
  paymentReference: string;
  amount: number;
  currency: string;
}): Promise<boolean> {
  const escapeHtml = (value: string) =>
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const formattedAmount =
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
    }).format(amount);

  const html = desireEmailTemplate({
    eyebrow: 'PAYMENT SUBMITTED',

    title: 'Your payment is under review.',

    message:
      `Hello ${fullName}, we have received your payment submission ` +
      `for order ${orderNumber}.`,

    content: `
      <div style="
        background:#f8f8f8;
        padding:24px;
        border:1px solid #e5e5e5;
      ">
        <p>
          <strong>Order Number</strong><br />
          ${escapeHtml(orderNumber)}
        </p>

        <p>
          <strong>Payment Reference</strong><br />
          ${escapeHtml(paymentReference)}
        </p>

        <p>
          <strong>Amount Submitted</strong><br />
          ${escapeHtml(formattedAmount)}
        </p>

        <p>
          <strong>Payment Status</strong><br />
          <span style="color:#b7791f;">
            Awaiting Verification
          </span>
        </p>
      </div>

      <p style="
        margin-top:24px;
        color:#555;
        line-height:1.8;
      ">
        Our team will review your payment details.
        You will receive another notification
        once your payment has been verified.
      </p>
    `,

    footerText:
      'DESIRE — Luxury designed with intention.',
  });

  return this.sendMail({
    to: email,

    subject:
      `DESIRE — Payment Submitted ${orderNumber}`,

    html,

    text:
      `Hello ${fullName},\n\n` +
      `We have received your payment submission.\n\n` +
      `Order: ${orderNumber}\n` +
      `Payment Reference: ${paymentReference}\n` +
      `Amount Submitted: ${formattedAmount}\n` +
      `Status: Awaiting Verification\n\n` +
      `We will notify you after your payment has been reviewed.\n\n` +
      `DESIRE`,
  });
}


/*
 * ==========================================
 * STAGE 5.4B
 * ADMIN PAYMENT SUBMISSION NOTIFICATION
 * ==========================================
 */

async sendPaymentSubmittedAdminEmail({
  fullName,
  email,
  orderNumber,
  paymentReference,
  amount,
  currency,
}: {
  fullName: string;
  email: string;
  orderNumber: string;
  paymentReference: string;
  amount: number;
  currency: string;
}): Promise<boolean> {
  const adminEmail = this.getAdminEmail();

  if (!adminEmail) {
    this.logger.error(
      'Admin email is not configured.',
    );

    return false;
  }

  const escapeHtml = (value: string) =>
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const formattedAmount =
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
    }).format(amount);

  const html = desireEmailTemplate({
    eyebrow: 'ADMIN PAYMENT ALERT',

    title: 'New payment awaiting verification.',

    message:
      'A DESIRE customer has submitted payment details. ' +
      'Please review the payment in your admin dashboard.',

    content: `
      <div style="
        background:#f8f8f8;
        padding:24px;
        border:1px solid #e5e5e5;
      ">
        <p>
          <strong>Customer Name</strong><br />
          ${escapeHtml(fullName)}
        </p>

        <p>
          <strong>Customer Email</strong><br />
          ${escapeHtml(email)}
        </p>

        <p>
          <strong>Order Number</strong><br />
          ${escapeHtml(orderNumber)}
        </p>

        <p>
          <strong>Payment Reference</strong><br />
          ${escapeHtml(paymentReference)}
        </p>

        <p>
          <strong>Amount Submitted</strong><br />
          ${escapeHtml(formattedAmount)}
        </p>

        <p>
          <strong>Status</strong><br />
          <span style="color:#b7791f;">
            Awaiting Admin Verification
          </span>
        </p>
      </div>

      <p style="
        margin-top:24px;
        color:#555;
        line-height:1.8;
      ">
        Log in to your DESIRE admin dashboard
        to review the submitted payment details
        and verify the transaction.
      </p>
    `,

    footerText:
      'DESIRE — Administrative Notification.',
  });

  return this.sendMail({
    to: adminEmail,

    subject:
      `DESIRE — Payment Awaiting Verification ${orderNumber}`,

    html,

    text:
      `DESIRE PAYMENT SUBMISSION\n\n` +
      `Customer: ${fullName}\n` +
      `Email: ${email}\n` +
      `Order: ${orderNumber}\n` +
      `Payment Reference: ${paymentReference}\n` +
      `Amount Submitted: ${formattedAmount}\n` +
      `Status: Awaiting Verification\n\n` +
      `Please review this payment in your admin dashboard.`,
  });
}

/*
 * ==========================================
 * STAGE 5.5
 * CUSTOMER PAYMENT APPROVAL EMAIL
 * ==========================================
 */

async sendPaymentApprovedEmail({
  email,
  fullName,
  orderNumber,
  paymentReference,
  amount,
  currency,
}: {
  email: string;
  fullName: string;
  orderNumber: string;
  paymentReference: string;
  amount: number;
  currency: string;
}): Promise<boolean> {
  const escapeHtml = (value: string) =>
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const formattedAmount = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
  }).format(amount);

  const html = desireEmailTemplate({
    eyebrow: 'PAYMENT APPROVED',

    title: 'Your payment has been confirmed.',

    message:
      `Hello ${fullName}, your payment for order ${orderNumber} ` +
      'has been successfully verified and approved.',

    content: `
      <div style="
        background:#f8f8f8;
        padding:24px;
        border:1px solid #e5e5e5;
      ">
        <p>
          <strong>Order Number</strong><br />
          ${escapeHtml(orderNumber)}
        </p>

        <p>
          <strong>Payment Reference</strong><br />
          ${escapeHtml(paymentReference)}
        </p>

        <p>
          <strong>Amount Verified</strong><br />
          ${escapeHtml(formattedAmount)}
        </p>

        <p>
          <strong>Payment Status</strong><br />
          <span style="
            color:#15803d;
            font-weight:600;
          ">
            Payment Approved
          </span>
        </p>
      </div>

      <p style="
        margin-top:24px;
        color:#555;
        line-height:1.8;
      ">
        Thank you for shopping with DESIRE.
        Your payment has been confirmed.

        You will receive further updates
        as your order progresses.
      </p>
    `,

    footerText:
      'DESIRE — Luxury designed with intention.',
  });

  return this.sendMail({
    to: email,

    subject:
      `DESIRE — Payment Approved ${orderNumber}`,

    html,

    text:
      `Hello ${fullName},\n\n` +
      `Your payment has been approved.\n\n` +
      `Order Number: ${orderNumber}\n` +
      `Payment Reference: ${paymentReference}\n` +
      `Amount Verified: ${formattedAmount}\n` +
      `Status: Payment Approved\n\n` +
      `Thank you for shopping with DESIRE.\n\n` +
      `DESIRE`,
  });
}


/*
 * ==========================================
 * STAGE 5.6
 * CUSTOMER PAYMENT REJECTION EMAIL
 * ==========================================
 */

async sendPaymentRejectedEmail({
  email,
  fullName,
  orderNumber,
  paymentReference,
  amount,
  currency,
  reason,
}: {
  email: string;
  fullName: string;
  orderNumber: string;
  paymentReference: string;
  amount: number;
  currency: string;
  reason?: string;
}): Promise<boolean> {
  const escapeHtml = (value: string) =>
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const formattedAmount = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
  }).format(amount);

  const rejectionReason =
    reason?.trim() ||
    'We could not verify the submitted payment details.';

  const html = desireEmailTemplate({
    eyebrow: 'PAYMENT UPDATE',

    title: 'Your payment could not be verified.',

    message:
      `Hello ${fullName}, we have reviewed the payment ` +
      `submitted for order ${orderNumber}. ` +
      'Unfortunately, we could not approve it.',

    content: `
      <div style="
        background:#f8f8f8;
        padding:24px;
        border:1px solid #e5e5e5;
      ">
        <p>
          <strong>Order Number</strong><br />
          ${escapeHtml(orderNumber)}
        </p>

        <p>
          <strong>Payment Reference</strong><br />
          ${escapeHtml(paymentReference)}
        </p>

        <p>
          <strong>Payment Amount</strong><br />
          ${escapeHtml(formattedAmount)}
        </p>

        <p>
          <strong>Payment Status</strong><br />
          <span style="
            color:#b91c1c;
            font-weight:600;
          ">
            Payment Not Approved
          </span>
        </p>

        <p>
          <strong>Reason</strong><br />
          ${escapeHtml(rejectionReason)}
        </p>
      </div>

      <p style="
        margin-top:24px;
        color:#555;
        line-height:1.8;
      ">
        If you believe this decision was made
        in error, please contact DESIRE support
        with your order number and payment reference.

        Do not make another transfer until
        you have confirmed the next steps
        with our team.
      </p>
    `,

    footerText:
      'DESIRE — Luxury designed with intention.',
  });

  return this.sendMail({
    to: email,

    subject:
      `DESIRE — Payment Not Approved ${orderNumber}`,

    html,

    text:
      `Hello ${fullName},\n\n` +
      `We could not verify your submitted payment.\n\n` +
      `Order Number: ${orderNumber}\n` +
      `Payment Reference: ${paymentReference}\n` +
      `Payment Amount: ${formattedAmount}\n` +
      `Status: Payment Not Approved\n` +
      `Reason: ${rejectionReason}\n\n` +
      `Please contact DESIRE support before making another transfer.\n\n` +
      `DESIRE`,
  });
}

/*
 * ==========================================
 * STAGE 6.1A
 * CUSTOMER CREDIT APPLICATION EMAIL
 * ==========================================
 */

async sendCreditApplicationSubmittedEmail({
  email,
  fullName,
  applicationReference,
}: {
  email: string;
  fullName: string;
  applicationReference: string;
}): Promise<boolean> {
  const escapeHtml = (value: string) =>
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const html = desireEmailTemplate({
    eyebrow: 'DESIRE CREDIT',

    title: 'Your application has been received.',

    message:
      `Hello ${fullName}, thank you for applying for DESIRE CREDIT. ` +
      'Your application has been submitted successfully.',

    content: `
      <div style="
        background:#f8f8f8;
        padding:24px;
        border:1px solid #e5e5e5;
      ">
        <p>
          <strong>Application Reference</strong><br />
          ${escapeHtml(applicationReference)}
        </p>

        <p>
          <strong>Application Status</strong><br />
          <span style="color:#b7791f;font-weight:600;">
            Pending Review
          </span>
        </p>
      </div>

      <p style="
        margin-top:24px;
        color:#555;
        line-height:1.8;
      ">
        Our team will review your application.
        You will receive another notification
        when a decision has been made.

        No further action is required at this time
        unless our team contacts you.
      </p>
    `,

    footerText:
      'DESIRE — Luxury designed with intention.',
  });

  return this.sendMail({
    to: email,

    subject: 'DESIRE CREDIT — Application Received',

    html,

    text:
      `Hello ${fullName},\n\n` +
      `Your DESIRE CREDIT application has been received.\n\n` +
      `Application Reference: ${applicationReference}\n` +
      `Status: Pending Review\n\n` +
      `We will notify you when your application has been reviewed.\n\n` +
      `DESIRE`,
  });
}


/*
 * ==========================================
 * STAGE 6.1B
 * ADMIN NEW CREDIT APPLICATION EMAIL
 * ==========================================
 */

async sendNewCreditApplicationAdminEmail({
  fullName,
  email,
  applicationReference,
}: {
  fullName: string;
  email: string;
  applicationReference: string;
}): Promise<boolean> {
  const adminEmail = this.getAdminEmail();

  if (!adminEmail) {
    return false;
  }

  const escapeHtml = (value: string) =>
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const html = desireEmailTemplate({
    eyebrow: 'DESIRE CREDIT ADMIN',

    title: 'New credit application received.',

    message:
      'A customer has submitted a new DESIRE CREDIT application. ' +
      'The application is awaiting administrative review.',

    content: `
      <div style="
        background:#f8f8f8;
        padding:24px;
        border:1px solid #e5e5e5;
      ">
        <p>
          <strong>Customer Name</strong><br />
          ${escapeHtml(fullName)}
        </p>

        <p>
          <strong>Customer Email</strong><br />
          ${escapeHtml(email)}
        </p>

        <p>
          <strong>Application Reference</strong><br />
          ${escapeHtml(applicationReference)}
        </p>

        <p>
          <strong>Status</strong><br />
          <span style="color:#b7791f;font-weight:600;">
            Awaiting Review
          </span>
        </p>
      </div>

      <p style="
        margin-top:24px;
        color:#555;
        line-height:1.8;
      ">
        Log in to the DESIRE admin dashboard
        to review this application.
      </p>
    `,

    footerText:
      'DESIRE — Administrative Notification.',
  });

  return this.sendMail({
    to: adminEmail,

    subject:
      'DESIRE CREDIT — New Application Awaiting Review',

    html,

    text:
      `NEW DESIRE CREDIT APPLICATION\n\n` +
      `Customer: ${fullName}\n` +
      `Email: ${email}\n` +
      `Application Reference: ${applicationReference}\n` +
      `Status: Awaiting Review\n\n` +
      `Please review the application in your admin dashboard.`,
  });
}

async sendCreditApplicationApprovedEmail({
  email,
  fullName,
  applicationReference,
  approvedAmount,
  installmentPlan,
}: {
  email: string;
  fullName: string;
  applicationReference: string;
  approvedAmount: number;
  installmentPlan: string;
}): Promise<boolean> {
  const escapeHtml = (value: string): string =>
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const formattedAmount = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(approvedAmount);

  const html = desireEmailTemplate({
    eyebrow: 'DESIRE CREDIT APPROVED',

    title: 'Your DESIRE CREDIT application has been approved.',

    message: `Hello ${escapeHtml(fullName)}, we are pleased to inform you that your DESIRE CREDIT application has been approved.`,

    content: `
      <div style="background:#f8f8f8;padding:24px;border:1px solid #e5e5e5;">

        <p>
          <strong>Application Reference</strong><br />
          ${escapeHtml(applicationReference)}
        </p>

        <p>
          <strong>Approved Credit Limit</strong><br />
          <span style="font-size:22px;font-weight:700;color:#111;">
            ${escapeHtml(formattedAmount)}
          </span>
        </p>

        <p>
          <strong>Approved Installment Plan</strong><br />
          ${escapeHtml(installmentPlan)}
        </p>

        <p>
          <strong>Application Status</strong><br />
          <span style="color:#15803d;font-weight:600;">
            Approved
          </span>
        </p>

      </div>

      <p style="margin-top:24px;color:#555;line-height:1.8;">
        Your DESIRE CREDIT application has been approved.
        You can sign in to your DESIRE account to review
        your credit details and available purchasing options.
        All purchases remain subject to your available credit
        and applicable payment terms.
      </p>
    `,

    footerText: 'DESIRE — Luxury designed with intention.',
  });

  return this.sendMail({
    to: email,

    subject: 'DESIRE CREDIT — Your Application Has Been Approved',

    html,

    text: `
Hello ${fullName},

Your DESIRE CREDIT application has been approved.

Application Reference: ${applicationReference}

Approved Credit Limit: ${formattedAmount}

Approved Installment Plan: ${installmentPlan}

Application Status: Approved

Sign in to your DESIRE account to review your credit details.

DESIRE
    `.trim(),
  });
}

/*
 * ==========================================
 * STAGE 6.2B
 * DESIRE CREDIT APPLICATION REJECTED EMAIL
 * ==========================================
 */

async sendCreditApplicationRejectedEmail({
  email,
  fullName,
  applicationReference,
  rejectionReason,
}: {
  email: string;
  fullName: string;
  applicationReference: string;
  rejectionReason: string;
}): Promise<boolean> {
  const escapeHtml = (value: string) =>
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/'/g, '&#039;');

  const reason =
    rejectionReason?.trim() ||
    'Your application did not meet our current approval requirements.';

  const html = desireEmailTemplate({
    eyebrow: 'DESIRE CREDIT UPDATE',

    title: 'Update on your DESIRE CREDIT application.',

    message:
      `Hello ${escapeHtml(fullName)}, ` +
      'thank you for your interest in DESIRE CREDIT. ' +
      'After reviewing your application, we are unable to approve your request at this time.',

    content: `
      <div style="
        background:#f8f8f8;
        padding:24px;
        border:1px solid #e5e5e5;
      ">
        <p>
          <strong>Application Reference</strong><br />
          ${escapeHtml(applicationReference)}
        </p>

        <p>
          <strong>Application Status</strong><br />
          <span style="
            color:#b91c1c;
            font-weight:600;
          ">
            Not Approved
          </span>
        </p>

        <p>
          <strong>Reason</strong><br />
          ${escapeHtml(reason)}
        </p>
      </div>

      <p style="
        margin-top:24px;
        color:#555;
        line-height:1.8;
      ">
        We appreciate your interest in DESIRE CREDIT.

        If you have questions about this decision,
        please contact DESIRE support and provide
        your application reference.

        You may continue shopping with DESIRE
        using our other available payment methods.
      </p>
    `,

    footerText:
      'DESIRE — Luxury designed with intention.',
  });

  return this.sendMail({
    to: email,

    subject:
      'DESIRE CREDIT — Application Decision',

    html,

    text:
      `Hello ${fullName},\n\n` +
      `We have reviewed your DESIRE CREDIT application.\n\n` +
      `Unfortunately, your application was not approved.\n\n` +
      `Application Reference: ${applicationReference}\n` +
      `Status: Not Approved\n` +
      `Reason: ${reason}\n\n` +
      `If you have questions, please contact DESIRE support.\n\n` +
      `DESIRE`,
  });
}

async sendCreditAccountActivatedEmail({
  email,
  fullName,
  creditLimit,
  availableCredit,
  installmentPlan,
}: {
  email: string;
  fullName: string;
  creditLimit: number;
  availableCredit: number;
  installmentPlan: string;
}): Promise<boolean> {
  const escapeHtml = (value: string): string =>
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);

  const html = desireEmailTemplate({
    eyebrow: 'DESIRE CREDIT ACTIVATED',

    title: 'Your DESIRE CREDIT account is now active.',

    message: `Hello ${escapeHtml(fullName)}, your DESIRE CREDIT account has been successfully activated.`,

    content: `
      <div style="background:#f8f8f8;padding:24px;border:1px solid #e5e5e5;">

        <p>
          <strong>Credit Limit</strong><br />
          ${escapeHtml(formatCurrency(creditLimit))}
        </p>

        <p>
          <strong>Available Credit</strong><br />
          ${escapeHtml(formatCurrency(availableCredit))}
        </p>

        <p>
          <strong>Installment Plan</strong><br />
          ${escapeHtml(installmentPlan)}
        </p>

        <p>
          <strong>Account Status</strong><br />
          <span style="color:#15803d;font-weight:600;">
            Active
          </span>
        </p>

      </div>

      <p style="margin-top:24px;color:#555;line-height:1.8;">
        You can now sign in to your DESIRE account to
        review your available credit and eligible
        purchasing options.

        Purchases remain subject to your available credit
        and applicable payment terms.
      </p>
    `,

    footerText: 'DESIRE — Luxury designed with intention.',
  });

  return this.sendMail({
    to: email,

    subject: 'DESIRE CREDIT — Your Account Is Now Active',

    html,

    text: `
Hello ${fullName},

Your DESIRE CREDIT account is now active.

Credit Limit: ${formatCurrency(creditLimit)}

Available Credit: ${formatCurrency(availableCredit)}

Installment Plan: ${installmentPlan}

Account Status: Active

Sign in to your DESIRE account to review your credit details.

DESIRE
    `.trim(),
  });
}
}