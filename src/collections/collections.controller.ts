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

import {
  CollectionsService,
} from './collections.service';

import {
  CreateCollectionDto,
} from './dto/create-collection.dto';

import {
  UpdateCollectionDto,
} from './dto/update-collection.dto';

import {
  JwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';

import {
  RolesGuard,
} from '../auth/guards/roles.guard';

import {
  Roles,
} from '../auth/decorators/roles.decorator';

import {
  Role,
} from '../common/enums/role.enum';

@Controller('collections')
export class CollectionsController {
  constructor(
    private readonly collectionsService:
      CollectionsService,
  ) {}

  @Get()
  findActive() {
    return this.collectionsService
      .findActive();
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
    return this.collectionsService
      .findFeatured(limit);
  }

  @Get('admin/all')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(Role.ADMIN)
  findAll() {
    return this.collectionsService
      .findAll();
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
    return this.collectionsService
      .findOne(
        identifier,
        true,
      );
  }

  @Get(':identifier')
  findOne(
    @Param('identifier')
    identifier: string,
  ) {
    return this.collectionsService
      .findOne(identifier);
  }

  @Post()
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(Role.ADMIN)
  create(
    @Body()
    createCollectionDto:
      CreateCollectionDto,
  ) {
    return this.collectionsService
      .create(
        createCollectionDto,
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
    updateCollectionDto:
      UpdateCollectionDto,
  ) {
    return this.collectionsService
      .update(
        id,
        updateCollectionDto,
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
    return this.collectionsService
      .remove(id);
  }
}