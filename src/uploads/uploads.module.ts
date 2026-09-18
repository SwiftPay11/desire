import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';

import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { multerConfig } from './multer.config';
import {
  PaymentProofUploadsController,
} from './payment-proof-uploads.controller';

@Module({
  imports: [
    MulterModule.register(
      multerConfig,
    ),
  ],
  controllers: [
    UploadsController,
    PaymentProofUploadsController,
  ],
  providers: [
    UploadsService,
  ],
  exports: [
    UploadsService,
  ],
})
export class UploadsModule {}