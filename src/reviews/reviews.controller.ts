import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ReviewsService } from './reviews.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

import { Role } from '../common/enums/role.enum';

import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { UpdateReviewStatusDto } from './dto/update-review-status.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
  ) {}

  // ==========================
  // PUBLIC ROUTES
  // ==========================

  @Get('product/:productId')
  findProductReviews(
    @Param('productId') productId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reviewsService.findProductReviews(
      productId,
      page,
      limit,
    );
  }

  // ==========================
  // USER ROUTES
  // ==========================

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: any,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewsService.create(
      user.id,
      createReviewDto,
    );
  }

  @Get('my-reviews')
  @UseGuards(JwtAuthGuard)
  findMyReviews(
    @CurrentUser() user: any,
  ) {
    return this.reviewsService.findMyReviews(
      user.id,
    );
  }

  @Get('my-reviews/:id')
  @UseGuards(JwtAuthGuard)
  findOneForUser(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.reviewsService.findOneForUser(
      user.id,
      id,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(
      user.id,
      id,
      updateReviewDto,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.reviewsService.remove(
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
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('isActive') isActive?: string,
  ) {
    return this.reviewsService.findAll(
      page,
      limit,
      isActive === undefined
        ? undefined
        : isActive === 'true',
    );
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body()
    updateReviewStatusDto: UpdateReviewStatusDto,
  ) {
    return this.reviewsService.updateStatus(
      id,
      updateReviewStatusDto,
    );
  }

  @Delete(':id/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  removeByAdmin(
    @Param('id') id: string,
  ) {
    return this.reviewsService.removeByAdmin(
      id,
    );
  }
}