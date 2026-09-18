import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { PaymentsService } from './payments.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

import { Role } from '../common/enums/role.enum';

import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { SubmitPaymentProofDto } from './dto/submit-payment-proof.dto';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
  ) {}

  // ==========================
  // USER ROUTES
  // ==========================

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: any,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    return this.paymentsService.create(
      user.id,
      createPaymentDto,
    );
  }

  @Get('my-payments')
  @UseGuards(JwtAuthGuard)
  findMyPayments(
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.findMyPayments(
      user.id,
    );
  }

  @Get('my-payments/:id')
  @UseGuards(JwtAuthGuard)
  findOneForUser(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.paymentsService.findOneForUser(
      user.id,
      id,
    );
  }

  // ==========================
  // ADMIN ROUTES
  // ==========================

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findAll() {
    return this.paymentsService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findOneForAdmin(
    @Param('id') id: string,
  ) {
    return this.paymentsService.findOneForAdmin(
      id,
    );
  }

  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  verify(
    @Param('id') id: string,
    @Body() verifyPaymentDto: VerifyPaymentDto,
  ) {
    return this.paymentsService.verify(
      id,
      verifyPaymentDto,
    );
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body()
    updatePaymentStatusDto: UpdatePaymentStatusDto,
  ) {
    return this.paymentsService.updateStatus(
      id,
      updatePaymentStatusDto,
    );
  }

    @Patch(':id/submit-proof')
  @UseGuards(JwtAuthGuard)
  submitProof(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body()
    submitPaymentProofDto: SubmitPaymentProofDto,
  ) {
    return this.paymentsService.submitProof(
      user.id,
      id,
      submitPaymentProofDto,
    );
  }
}