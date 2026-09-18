import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  InjectModel,
} from '@nestjs/mongoose';

import {
  isValidObjectId,
  Model,
} from 'mongoose';

import {
  Product,
  ProductDocument,
} from './schemas/product.schema';

import {
  CreateProductDto,
} from './dto/create-product.dto';

import {
  UpdateProductDto,
} from './dto/update-product.dto';

import {
  ProductQueryDto,
} from './dto/product-query.dto';

import {
  AdjustInventoryDto,
} from './dto/adjust-inventory.dto';

import {
  CategoriesService,
} from '../categories/categories.service';

import { AddProductImagesDto } from './dto/add-product-images.dto';
import { RemoveProductImageDto } from './dto/remove-product-image.dto';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,

    private readonly categoriesService: CategoriesService,

    private readonly uploadsService: UploadsService,
  ) {}

  async create(
    createProductDto: CreateProductDto,
  ) {
    const normalizedName =
      createProductDto.name.trim();

    const normalizedSku =
      createProductDto.sku.trim().toUpperCase();

    const slug =
      this.generateSlug(normalizedName);

    await this.categoriesService.findOne(
      createProductDto.category,
    );

    this.validatePrices(
      createProductDto.price,
      createProductDto.compareAtPrice,
    );

    const existingProduct =
      await this.productModel.findOne({
        $or: [
          {
            slug,
          },
          {
            sku: {
              $regex: `^${this.escapeRegex(normalizedSku)}$`,
              $options: 'i',
            },
          },
        ],
      });

    if (existingProduct) {
      if (
        existingProduct.sku.toUpperCase() ===
        normalizedSku
      ) {
        throw new ConflictException(
          'A product with this SKU already exists',
        );
      }

      throw new ConflictException(
        'A product with this name already exists',
      );
    }

    const product =
      await this.productModel.create({
        ...createProductDto,
        name: normalizedName,
        sku: normalizedSku,
        slug,
        description:
          createProductDto.description?.trim() ?? '',
        images: this.normalizeArray(
          createProductDto.images ?? [],
        ),
        sizes: this.normalizeArray(
          createProductDto.sizes,
        ),
        colors: this.normalizeArray(
          createProductDto.colors,
        ),
      });

    const populatedProduct =
      await product.populate(
        'category',
        'name slug description isActive',
      );

    return {
      message: 'Product created successfully',
      product: populatedProduct,
    };
  }

  async findAll(
    queryDto: ProductQueryDto,
    includeInactive = false,
  ) {
    const page = Math.max(
      Number(queryDto.page) || 1,
      1,
    );

    const requestedLimit =
      Number(queryDto.limit) || 12;

    const limit = Math.min(
      Math.max(requestedLimit, 1),
      100,
    );

    const skip =
      (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (!includeInactive) {
      filter.isActive = true;
    } else if (
      queryDto.isActive !== undefined
    ) {
      filter.isActive =
        queryDto.isActive === 'true';
    }

    if (queryDto.search?.trim()) {
      const search =
        this.escapeRegex(
          queryDto.search.trim(),
        );

      filter.$or = [
        {
          name: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          description: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          sku: {
            $regex: search,
            $options: 'i',
          },
        },
      ];
    }

    if (queryDto.category) {
      filter.category =
        queryDto.category;
    }

    if (queryDto.featured !== undefined) {
      filter.featured =
        queryDto.featured === 'true';
    }

    if (
      queryDto.minPrice !== undefined ||
      queryDto.maxPrice !== undefined
    ) {
      filter.price = {};

      if (queryDto.minPrice !== undefined) {
        filter.price.$gte =
          Number(queryDto.minPrice);
      }

      if (queryDto.maxPrice !== undefined) {
        filter.price.$lte =
          Number(queryDto.maxPrice);
      }
    }

    const sort =
      this.getSortOption(queryDto.sort);

    const [
      products,
      totalProducts,
    ] = await Promise.all([
      this.productModel
        .find(filter)
        .populate(
          'category',
          'name slug description isActive',
        )
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),

      this.productModel
        .countDocuments(filter)
        .exec(),
    ]);

    const totalPages =
      Math.ceil(totalProducts / limit);

    return {
      products,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        limit,
        hasNextPage:
          page < totalPages,
        hasPreviousPage:
          page > 1,
      },
    };
  }

  async findFeatured(
    limit = 8,
  ) {
    const safeLimit =
      Math.min(
        Math.max(limit, 1),
        50,
      );

    return this.productModel
      .find({
        featured: true,
        isActive: true,
      })
      .populate(
        'category',
        'name slug',
      )
      .sort({
        createdAt: -1,
      })
      .limit(safeLimit)
      .exec();
  }

  async findOne(
    identifier: string,
    includeInactive = false,
  ) {
    const filter: Record<string, any> =
      isValidObjectId(identifier)
        ? {
            _id: identifier,
          }
        : {
            slug: identifier.toLowerCase(),
          };

    if (!includeInactive) {
      filter.isActive = true;
    }

    const product =
      await this.productModel
        .findOne(filter)
        .populate(
          'category',
          'name slug description isActive',
        )
        .exec();

    if (!product) {
      throw new NotFoundException(
        'Product not found',
      );
    }

    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ) {
    const product =
      await this.findOne(id, true);

    const updateData: Record<string, unknown> = {
      ...updateProductDto,
    };

    if (updateProductDto.category) {
      await this.categoriesService.findOne(
        updateProductDto.category,
      );
    }

    const finalPrice =
      updateProductDto.price ??
      product.price;

    const finalCompareAtPrice =
      updateProductDto.compareAtPrice ??
      product.compareAtPrice;

    this.validatePrices(
      finalPrice,
      finalCompareAtPrice,
    );

    if (updateProductDto.name) {
      const normalizedName =
        updateProductDto.name.trim();

      const slug =
        this.generateSlug(normalizedName);

      const duplicateSlug =
        await this.productModel.findOne({
          _id: {
            $ne: id,
          },
          slug,
        });

      if (duplicateSlug) {
        throw new ConflictException(
          'A product with this name already exists',
        );
      }

      updateData.name =
        normalizedName;

      updateData.slug =
        slug;
    }

    if (updateProductDto.sku) {
      const normalizedSku =
        updateProductDto.sku
          .trim()
          .toUpperCase();

      const duplicateSku =
        await this.productModel.findOne({
          _id: {
            $ne: id,
          },
          sku: {
            $regex: `^${this.escapeRegex(normalizedSku)}$`,
            $options: 'i',
          },
        });

      if (duplicateSku) {
        throw new ConflictException(
          'A product with this SKU already exists',
        );
      }

      updateData.sku =
        normalizedSku;
    }

    if (
      updateProductDto.description !==
      undefined
    ) {
      updateData.description =
        updateProductDto.description.trim();
    }

    if (updateProductDto.sizes) {
      updateData.sizes =
        this.normalizeArray(
          updateProductDto.sizes,
        );
    }

    if (updateProductDto.colors) {
      updateData.colors =
        this.normalizeArray(
          updateProductDto.colors,
        );
    }

    Object.assign(
      product,
      updateData,
    );

    const updatedProduct =
      await product.save();

    const populatedProduct =
      await updatedProduct.populate(
        'category',
        'name slug description isActive',
      );

    return {
      message: 'Product updated successfully',
      product: populatedProduct,
    };
  }

  /*
   * ADMIN INVENTORY
   *
   * This does not change stock.
   * It only returns the inventory
   * overview for the admin page.
   */
  async getInventory() {
    const products =
      await this.productModel
        .find()
        .populate(
          'category',
          'name slug description isActive',
        )
        .sort({
          name: 1,
        })
        .lean()
        .exec();

    let totalStockUnits = 0;
    let inStockProducts = 0;
    let lowStockProducts = 0;
    let outOfStockProducts = 0;

    const inventory =
      products.map(
        (product: any) => {
          const stock =
            Number(
              product.stock ||
              0,
            );

          totalStockUnits += stock;

          let stockStatus:
            | 'IN_STOCK'
            | 'LOW_STOCK'
            | 'OUT_OF_STOCK';

          if (stock === 0) {
            stockStatus =
              'OUT_OF_STOCK';

            outOfStockProducts += 1;
          } else if (
            stock <= 5
          ) {
            stockStatus =
              'LOW_STOCK';

            lowStockProducts += 1;
          } else {
            stockStatus =
              'IN_STOCK';

            inStockProducts += 1;
          }

          return {
            ...product,
            stockStatus,
          };
        },
      );

    return {
      inventory,

      summary: {
        totalProducts:
          products.length,

        totalStockUnits,

        inStockProducts,

        lowStockProducts,

        outOfStockProducts,
      },
    };
  }

  /*
   * ADMIN MANUAL INVENTORY ADJUSTMENT
   *
   * ADD:
   * Adds new stock.
   *
   * SUBTRACT:
   * Manually removes stock.
   *
   * SET:
   * Sets the exact stock quantity.
   *
   * This is separate from the automatic
   * stock deduction that happens when
   * an order payment becomes PAID.
   */
  async adjustInventory(
    productId: string,
    dto: AdjustInventoryDto,
  ) {
    if (
      !isValidObjectId(
        productId,
      )
    ) {
      throw new NotFoundException(
        'Product not found',
      );
    }

    const product =
      await this.productModel.findById(
        productId,
      );

    if (!product) {
      throw new NotFoundException(
        'Product not found',
      );
    }

    const currentStock =
      Number(
        product.stock ||
        0,
      );

    let nextStock =
      currentStock;

    switch (dto.action) {
      case 'ADD':
        nextStock =
          currentStock +
          dto.quantity;
        break;

      case 'SUBTRACT':
        if (
          dto.quantity >
          currentStock
        ) {
          throw new BadRequestException(
            `Cannot subtract ${dto.quantity} item(s). Only ${currentStock} item(s) are currently available.`,
          );
        }

        nextStock =
          currentStock -
          dto.quantity;
        break;

      case 'SET':
        nextStock =
          dto.quantity;
        break;

      default:
        throw new BadRequestException(
          'Invalid inventory action',
        );
    }

    product.stock =
      nextStock;

    await product.save();

    const populatedProduct =
      await product.populate(
        'category',
        'name slug description isActive',
      );

    let stockStatus:
      | 'IN_STOCK'
      | 'LOW_STOCK'
      | 'OUT_OF_STOCK';

    if (
      nextStock === 0
    ) {
      stockStatus =
        'OUT_OF_STOCK';
    } else if (
      nextStock <= 5
    ) {
      stockStatus =
        'LOW_STOCK';
    } else {
      stockStatus =
        'IN_STOCK';
    }

    return {
      message:
        'Inventory updated successfully',

      product:
        populatedProduct,

      inventory: {
        previousStock:
          currentStock,

        currentStock:
          nextStock,

        action:
          dto.action,

        quantity:
          dto.quantity,

        stockStatus,
      },
    };
  }

  async remove(id: string) {
    const product =
      await this.productModel
        .findByIdAndDelete(id)
        .exec();

    if (!product) {
      throw new NotFoundException(
        'Product not found',
      );
    }

    return {
      message: 'Product deleted successfully',
    };
  }

  private validatePrices(
    price: number,
    compareAtPrice?: number,
  ): void {
    if (
      compareAtPrice !== undefined &&
      compareAtPrice > 0 &&
      compareAtPrice < price
    ) {
      throw new BadRequestException(
        'Compare-at price cannot be lower than the selling price',
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
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private normalizeArray(
    values: string[],
  ): string[] {
    return [
      ...new Set(
        values
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    ];
  }

  private escapeRegex(
    value: string,
  ): string {
    return value.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&',
    );
  }

  private getSortOption(
    sort?: string,
  ): Record<string, 1 | -1> {
    switch (sort) {
      case 'oldest':
        return {
          createdAt: 1,
        };

      case 'price-asc':
        return {
          price: 1,
        };

      case 'price-desc':
        return {
          price: -1,
        };

      case 'name-asc':
        return {
          name: 1,
        };

      case 'name-desc':
        return {
          name: -1,
        };

      case 'newest':
      default:
        return {
          createdAt: -1,
        };
    }
  }

  async addImages(
    productId: string,
    addProductImagesDto: AddProductImagesDto,
  ) {
    const product =
      await this.productModel.findById(productId);

    if (!product) {
      throw new NotFoundException(
        'Product not found',
      );
    }

    const currentImages =
      product.images || [];

    const newImages =
      addProductImagesDto.images.filter(
        (image) =>
          !currentImages.includes(image),
      );

    if (newImages.length === 0) {
      throw new BadRequestException(
        'All selected images already exist on this product',
      );
    }

    const totalImages =
      currentImages.length +
      newImages.length;

    if (totalImages > 10) {
      throw new BadRequestException(
        'A product cannot have more than 10 images',
      );
    }

    product.images = [
      ...currentImages,
      ...newImages,
    ];

    await product.save();

    return {
      message:
        'Product images added successfully',
      product,
    };
  }

  async removeImage(
    productId: string,
    removeProductImageDto: RemoveProductImageDto,
  ) {
    const product =
      await this.productModel.findById(productId);

    if (!product) {
      throw new NotFoundException(
        'Product not found',
      );
    }

    const imageUrl =
      removeProductImageDto.image;

    const imageExists =
      product.images?.includes(imageUrl);

    if (!imageExists) {
      throw new NotFoundException(
        'Image was not found on this product',
      );
    }

    product.images =
      product.images.filter(
        (image) => image !== imageUrl,
      );

    await product.save();

    const filename =
      this.extractUploadedFilename(imageUrl);

    if (filename) {
      try {
        this.uploadsService.deleteFile(
          filename,
        );
      } catch {
        // The database update remains successful
        // even if the physical file no longer exists.
      }
    }

    return {
      message:
        'Product image removed successfully',
      product,
    };
  }

  private extractUploadedFilename(
    imageUrl: string,
  ): string | null {
    try {
      const parsedUrl =
        new URL(imageUrl);

      const uploadMarker =
        '/uploads/';

      const markerIndex =
        parsedUrl.pathname.lastIndexOf(
          uploadMarker,
        );

      if (markerIndex === -1) {
        return null;
      }

      const filename =
        parsedUrl.pathname.slice(
          markerIndex +
            uploadMarker.length,
        );

      if (
        !filename ||
        filename.includes('/')
      ) {
        return null;
      }

      return decodeURIComponent(
        filename,
      );
    } catch {
      return null;
    }
  }
}