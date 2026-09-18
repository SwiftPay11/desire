import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  InjectModel,
} from '@nestjs/mongoose';

import {
  Model,
  Types,
} from 'mongoose';

import {
  Collection,
  CollectionDocument,
} from './schemas/collection.schema';

import {
  CreateCollectionDto,
} from './dto/create-collection.dto';

import {
  UpdateCollectionDto,
} from './dto/update-collection.dto';

import {
  Product,
  ProductDocument,
} from '../products/schemas/product.schema';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectModel(Collection.name)
    private readonly collectionModel:
      Model<CollectionDocument>,

    @InjectModel(Product.name)
    private readonly productModel:
      Model<ProductDocument>,
  ) {}

  async create(
    createCollectionDto:
      CreateCollectionDto,
  ) {
    const normalizedName =
      createCollectionDto.name.trim();

    const slug =
      this.generateSlug(
        normalizedName,
      );

    await this.ensureUniqueCollection(
      normalizedName,
      slug,
    );

    const productIds =
      this.normalizeProductIds(
        createCollectionDto.products,
      );

    await this.ensureProductsExist(
      productIds,
    );

    const collection =
      await this.collectionModel.create({
        ...createCollectionDto,
        name: normalizedName,
        slug,
        products: productIds,
      });

    const populatedCollection =
      await this.collectionModel
        .findById(collection._id)
        .populate({
          path: 'products',
          select:
            'name slug price compareAtPrice images stock featured isActive category',
        })
        .exec();

    return {
      message:
        'Collection created successfully',
      collection:
        populatedCollection,
    };
  }

  async findAll() {
    return this.collectionModel
      .find()
      .populate({
        path: 'products',
        select:
          'name slug price compareAtPrice images stock featured isActive category',
      })
      .sort({
        sortOrder: 1,
        createdAt: -1,
      })
      .exec();
  }

  async findActive() {
    return this.collectionModel
      .find({
        isActive: true,
      })
      .populate({
        path: 'products',
        match: {
          isActive: true,
        },
        select:
          'name slug price compareAtPrice images stock featured isActive category',
      })
      .sort({
        sortOrder: 1,
        createdAt: -1,
      })
      .exec();
  }

  async findFeatured(
    limit = 6,
  ) {
    const safeLimit =
      Math.min(
        Math.max(
          Number(limit) || 6,
          1,
        ),
        20,
      );

    return this.collectionModel
      .find({
        isActive: true,
        featured: true,
      })
      .populate({
        path: 'products',
        match: {
          isActive: true,
        },
        select:
          'name slug price compareAtPrice images stock featured isActive category',
      })
      .sort({
        sortOrder: 1,
        createdAt: -1,
      })
      .limit(safeLimit)
      .exec();
  }

  async findOne(
    identifier: string,
    includeInactive = false,
  ) {
    const filter:
      Record<string, unknown> =
        Types.ObjectId.isValid(
          identifier,
        )
          ? {
              _id: identifier,
            }
          : {
              slug: identifier
                .trim()
                .toLowerCase(),
            };

    if (!includeInactive) {
      filter.isActive = true;
    }

    const collection =
      await this.collectionModel
        .findOne(filter)
        .populate({
          path: 'products',
          match:
            includeInactive
              ? {}
              : {
                  isActive: true,
                },
          select:
            'name slug description sku price compareAtPrice category images sizes colors stock featured isActive',
        })
        .exec();

    if (!collection) {
      throw new NotFoundException(
        'Collection not found',
      );
    }

    return collection;
  }

  async update(
    id: string,
    updateCollectionDto:
      UpdateCollectionDto,
  ) {
    const existingCollection =
      await this.collectionModel
        .findById(id)
        .exec();

    if (!existingCollection) {
      throw new NotFoundException(
        'Collection not found',
      );
    }

    const updateData:
      Record<string, unknown> = {
        ...updateCollectionDto,
      };

    if (updateCollectionDto.name) {
      const normalizedName =
        updateCollectionDto.name.trim();

      const slug =
        this.generateSlug(
          normalizedName,
        );

      await this.ensureUniqueCollection(
        normalizedName,
        slug,
        id,
      );

      updateData.name =
        normalizedName;

      updateData.slug = slug;
    }

    if (
      updateCollectionDto.products !==
      undefined
    ) {
      const productIds =
        this.normalizeProductIds(
          updateCollectionDto.products,
        );

      await this.ensureProductsExist(
        productIds,
      );

      updateData.products =
        productIds;
    }

    const updatedCollection =
      await this.collectionModel
        .findByIdAndUpdate(
          id,
          {
            $set: updateData,
          },
          {
            new: true,
            runValidators: true,
          },
        )
        .populate({
          path: 'products',
          select:
            'name slug price compareAtPrice images stock featured isActive category',
        })
        .exec();

    if (!updatedCollection) {
      throw new NotFoundException(
        'Collection not found',
      );
    }

    return {
      message:
        'Collection updated successfully',
      collection:
        updatedCollection,
    };
  }

  async remove(id: string) {
    const collection =
      await this.collectionModel
        .findByIdAndDelete(id)
        .exec();

    if (!collection) {
      throw new NotFoundException(
        'Collection not found',
      );
    }

    return {
      message:
        'Collection deleted successfully',
    };
  }

  private async ensureUniqueCollection(
    name: string,
    slug: string,
    excludeId?: string,
  ) {
    const query:
      Record<string, unknown> = {
        $or: [
          {
            name: {
              $regex:
                `^${this.escapeRegex(
                  name,
                )}$`,
              $options: 'i',
            },
          },
          {
            slug,
          },
        ],
      };

    if (excludeId) {
      query._id = {
        $ne: excludeId,
      };
    }

    const existingCollection =
      await this.collectionModel
        .findOne(query)
        .exec();

    if (existingCollection) {
      throw new ConflictException(
        'A collection with this name already exists',
      );
    }
  }

  private normalizeProductIds(
    productIds?: string[],
  ): Types.ObjectId[] {
    if (!Array.isArray(productIds)) {
      return [];
    }

    const uniqueIds = [
      ...new Set(
        productIds.filter(Boolean),
      ),
    ];

    return uniqueIds.map(
      (id) =>
        new Types.ObjectId(id),
    );
  }

  private async ensureProductsExist(
    productIds: Types.ObjectId[],
  ) {
    if (productIds.length === 0) {
      return;
    }

    const existingProducts =
      await this.productModel
        .find({
          _id: {
            $in: productIds,
          },
        })
        .select('_id')
        .lean()
        .exec();

    if (
      existingProducts.length !==
      productIds.length
    ) {
      throw new NotFoundException(
        'One or more selected products were not found',
      );
    }
  }

  private generateSlug(
    name: string,
  ): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/['"]/g, '')
      .replace(
        /[^a-z0-9]+/g,
        '-',
      )
      .replace(
        /^-+|-+$/g,
        '',
      );
  }

  private escapeRegex(
    value: string,
  ): string {
    return value.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&',
    );
  }
}