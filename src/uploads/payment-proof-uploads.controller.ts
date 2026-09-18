import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import {
  FileInterceptor,
} from '@nestjs/platform-express';

import type {
  Request,
} from 'express';

import {
  JwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';

import {
  UploadsService,
} from './uploads.service';

@Controller('uploads')
export class PaymentProofUploadsController {
  constructor(
    private readonly uploadsService:
      UploadsService,
  ) {}

  @Post('payment-proof')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('image'),
  )
  uploadPaymentProof(
    @UploadedFile()
    file: Express.Multer.File,

    @Req()
    request: Request,
  ) {
    if (!file) {
      throw new BadRequestException(
        'Please select a payment proof image',
      );
    }

    return this.uploadsService
      .buildSingleUploadResponse(
        request,
        file,
      );
  }
}