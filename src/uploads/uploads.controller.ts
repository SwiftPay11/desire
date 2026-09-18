import {
  BadRequestException,
  Controller,
  Delete,
  Param,
  Post,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import {
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';

import type {
  Request,
} from 'express';

import { UploadsService } from './uploads.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class UploadsController {
  constructor(
    private readonly uploadsService: UploadsService,
  ) {}

  @Post('single')
  @UseInterceptors(
    FileInterceptor('image'),
  )
  uploadSingle(
    @UploadedFile()
    file: Express.Multer.File,

    @Req()
    request: Request,
  ) {
    if (!file) {
      throw new BadRequestException(
        'Please select an image to upload',
      );
    }

    return this.uploadsService
      .buildSingleUploadResponse(
        request,
        file,
      );
  }

  @Post('multiple')
  @UseInterceptors(
    FilesInterceptor(
      'images',
      10,
    ),
  )
  uploadMultiple(
    @UploadedFiles()
    files: Express.Multer.File[],

    @Req()
    request: Request,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException(
        'Please select at least one image to upload',
      );
    }

    return this.uploadsService
      .buildMultipleUploadResponse(
        request,
        files,
      );
  }

  @Delete(':filename')
  deleteFile(
    @Param('filename')
    filename: string,
  ) {
    return this.uploadsService
      .deleteFile(filename);
  }
}