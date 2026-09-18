import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ProductsService } from './products.service';

import { CreateProductDto } from './dto/create-product.dto';

import { UpdateProductDto } from './dto/update-product.dto';

import { ProductQueryDto } from './dto/product-query.dto';

import {
  AdjustInventoryDto,
} from './dto/adjust-inventory.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { Roles } from '../auth/decorators/roles.decorator';

import { Role } from '../common/enums/role.enum';

import { AddProductImagesDto } from './dto/add-product-images.dto';

import { RemoveProductImageDto } from './dto/remove-product-image.dto';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
  ) {}

  @Get()
  findAll(
    @Query() queryDto: ProductQueryDto,
  ) {
    return this.productsService.findAll(
      queryDto,
    );
  }

  @Get('featured')
  findFeatured(
    @Query(
      'limit',
      new ParseIntPipe({
        optional: true,
      }),
    )
    limit?: number,
  ) {
    return this.productsService.findFeatured(
      limit ?? 8,
    );
  }

  @Get('admin/all')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(Role.ADMIN)
  findAllAdmin(
    @Query() queryDto: ProductQueryDto,
  ) {
    return this.productsService.findAll(
      queryDto,
      true,
    );
  }

  @Get('admin/inventory')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(Role.ADMIN)
  getInventory() {
    return this.productsService.getInventory();
  }

  @Patch(
    'admin/:id/inventory',
  )
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(Role.ADMIN)
  adjustInventory(
    @Param('id')
    id: string,

    @Body()
    dto: AdjustInventoryDto,
  ) {
    return this.productsService.adjustInventory(
      id,
      dto,
    );
  }

  @Get('admin/:identifier')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(Role.ADMIN)
  findOneAdmin(
    @Param('identifier')
    identifier: string,
  ) {
    return this.productsService.findOne(
      identifier,
      true,
    );
  }

  @Get(':identifier')
  findOne(
    @Param('identifier')
    identifier: string,
  ) {
    return this.productsService.findOne(
      identifier,
    );
  }

  @Post()
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(Role.ADMIN)
  create(
    @Body()
    createProductDto: CreateProductDto,
  ) {
    return this.productsService.create(
      createProductDto,
    );
  }

  @Patch(':id')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(Role.ADMIN)
  update(
    @Param('id')
    id: string,

    @Body()
    updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(
      id,
      updateProductDto,
    );
  }

  @Delete(':id')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(Role.ADMIN)
  remove(
    @Param('id')
    id: string,
  ) {
    return this.productsService.remove(
      id,
    );
  }

  @Patch(':id/images')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(Role.ADMIN)
  addImages(
    @Param('id')
    id: string,

    @Body()
    addProductImagesDto: AddProductImagesDto,
  ) {
    return this.productsService.addImages(
      id,
      addProductImagesDto,
    );
  }

  @Delete(':id/images')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(Role.ADMIN)
  removeImage(
    @Param('id')
    id: string,

    @Body()
    removeProductImageDto: RemoveProductImageDto,
  ) {
    return this.productsService.removeImage(
      id,
      removeProductImageDto,
    );
  }
}