import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Request } from 'express';

import {
  DesireCreditService,
} from './desire-credit.service';

import {
  ApplyCreditDto,
} from './dto/apply-credit.dto';

import {
  ReviewCreditApplicationDto,
} from './dto/review-credit-application.dto';

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
  CreditApplicationStatus,
} from './schemas/credit-application.schema';

import {
  CreditAccountStatus,
} from './schemas/credit-account.schema';

import {
  JwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';

import {
  RolesGuard,
} from '../auth/guards/roles.guard';

import {
  Roles,
} from '../auth/decorators/roles.decorator';

import { Role } from '../common/enums/role.enum';

interface AuthenticatedRequest extends Request {
  user: {
    userId?: string;
    id?: string;
    sub?: string;
    email?: string;
    role?: Role;
  };
}

@Controller('desire-credit')
export class DesireCreditController {
  constructor(
    private readonly desireCreditService:
      DesireCreditService,
  ) {}

  /*
  |--------------------------------------------------------------------------
  | CUSTOMER APPLICATION ROUTES
  |--------------------------------------------------------------------------
  */

  @Post('applications')
  @UseGuards(JwtAuthGuard)
  apply(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ApplyCreditDto,
  ) {
    return this.desireCreditService.apply(
      this.getUserId(req),
      dto,
    );
  }

  @Get('applications/my')
  @UseGuards(JwtAuthGuard)
  getMyApplications(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.desireCreditService
      .getMyApplications(
        this.getUserId(req),
      );
  }

  @Get('applications/my/:applicationId')
  @UseGuards(JwtAuthGuard)
  getMyApplication(
    @Req() req: AuthenticatedRequest,
    @Param('applicationId')
    applicationId: string,
  ) {
    return this.desireCreditService
      .getMyApplication(
        this.getUserId(req),
        applicationId,
      );
  }

  @Patch(
    'applications/my/:applicationId/cancel',
  )
  @UseGuards(JwtAuthGuard)
  cancelMyApplication(
    @Req() req: AuthenticatedRequest,
    @Param('applicationId')
    applicationId: string,
  ) {
    return this.desireCreditService
      .cancelMyApplication(
        this.getUserId(req),
        applicationId,
      );
  }

  /*
  |--------------------------------------------------------------------------
  | CUSTOMER CREDIT ACCOUNT ROUTES
  |--------------------------------------------------------------------------
  */

  @Get('account/my')
  @UseGuards(JwtAuthGuard)
  getMyCreditAccount(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.desireCreditService
      .getMyCreditAccount(
        this.getUserId(req),
      );
  }

  /*
  |--------------------------------------------------------------------------
  | CUSTOMER CREDIT PURCHASE ROUTES
  |--------------------------------------------------------------------------
  */

  @Get('purchases/my')
  @UseGuards(JwtAuthGuard)
  getMyCreditPurchases(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.desireCreditService
      .getMyCreditPurchases(
        this.getUserId(req),
      );
  }

  @Get('purchases/my/:purchaseId')
  @UseGuards(JwtAuthGuard)
  getMyCreditPurchase(
    @Req() req: AuthenticatedRequest,
    @Param('purchaseId')
    purchaseId: string,
  ) {
    return this.desireCreditService
      .getMyCreditPurchase(
        this.getUserId(req),
        purchaseId,
      );
  }

  @Post('purchases')
  @UseGuards(JwtAuthGuard)
  createCreditPurchase(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateCreditPurchaseDto,
  ) {
    return this.desireCreditService
      .createCreditPurchase(
        this.getUserId(req),
        dto,
      );
  }

  @Post(
    'purchases/verify-commitment-payment',
  )
  @UseGuards(JwtAuthGuard)
  verifyCommitmentPayment(
    @Req() req: AuthenticatedRequest,
    @Body() dto: VerifyCommitmentPaymentDto,
  ) {
    return this.desireCreditService
      .verifyCommitmentPayment(
        this.getUserId(req),
        dto,
      );
  }

  /*
  |--------------------------------------------------------------------------
  | CUSTOMER INSTALLMENT ROUTES
  |--------------------------------------------------------------------------
  */

  @Get('installments/my')
  @UseGuards(JwtAuthGuard)
  getMyInstallments(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.desireCreditService
      .getMyInstallments(
        this.getUserId(req),
      );
  }

  @Get('installments/my/:installmentId')
  @UseGuards(JwtAuthGuard)
  getMyInstallment(
    @Req() req: AuthenticatedRequest,
    @Param('installmentId')
    installmentId: string,
  ) {
    return this.desireCreditService
      .getMyInstallment(
        this.getUserId(req),
        installmentId,
      );
  }

  @Post('installments/pay')
  @UseGuards(JwtAuthGuard)
  recordInstallmentPayment(
    @Req() req: AuthenticatedRequest,
    @Body() dto: RecordInstallmentPaymentDto,
  ) {
    return this.desireCreditService
      .recordInstallmentPayment(
        this.getUserId(req),
        dto,
      );
  }

  /*
  |--------------------------------------------------------------------------
  | ADMIN APPLICATION ROUTES
  |--------------------------------------------------------------------------
  */

  @Get('admin/applications')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(Role.ADMIN)
  getAllApplications(
    @Query('status')
    status?: CreditApplicationStatus,
  ) {
    return this.desireCreditService
      .getAllApplications(status);
  }

  @Get(
    'admin/applications/:applicationId',
  )
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(Role.ADMIN)
  getApplicationForAdmin(
    @Param('applicationId')
    applicationId: string,
  ) {
    return this.desireCreditService
      .getApplicationForAdmin(
        applicationId,
      );
  }

  @Patch(
    'admin/applications/:applicationId/review',
  )
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(Role.ADMIN)
  reviewApplication(
    @Req() req: AuthenticatedRequest,
    @Param('applicationId')
    applicationId: string,
    @Body()
    dto: ReviewCreditApplicationDto,
  ) {
    return this.desireCreditService
      .reviewApplication(
        this.getUserId(req),
        applicationId,
        dto,
      );
  }

  /*
  |--------------------------------------------------------------------------
  | ADMIN CREDIT ACCOUNT ROUTES
  |--------------------------------------------------------------------------
  */

  @Get('admin/accounts')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(Role.ADMIN)
  getAllCreditAccounts(
    @Query('status')
    status?: CreditAccountStatus,
  ) {
    return this.desireCreditService
      .getAllCreditAccounts(status);
  }

  @Get('admin/accounts/:accountId')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(Role.ADMIN)
  getCreditAccountForAdmin(
    @Param('accountId')
    accountId: string,
  ) {
    return this.desireCreditService
      .getCreditAccountForAdmin(
        accountId,
      );
  }

  @Patch('admin/accounts/:accountId')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(Role.ADMIN)
  updateCreditAccount(
    @Param('accountId')
    accountId: string,
    @Body()
    dto: UpdateCreditAccountDto,
  ) {
    return this.desireCreditService
      .updateCreditAccount(
        accountId,
        dto,
      );
  }

  /*
  |--------------------------------------------------------------------------
  | ADMIN DASHBOARD ROUTES
  |--------------------------------------------------------------------------
  */

  @Get('admin/dashboard')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(Role.ADMIN)
  getDashboardStatistics() {
    return this.desireCreditService
      .getDashboardStatistics();
  }

  /*
  |--------------------------------------------------------------------------
  | REQUEST HELPERS
  |--------------------------------------------------------------------------
  */

  private getUserId(
    req: AuthenticatedRequest,
  ): string {
    const userId =
      req.user?.userId ??
      req.user?.id ??
      req.user?.sub;

    if (!userId) {
      throw new Error(
        'Authenticated user ID is missing from the request.',
      );
    }

    return userId;
  }
}