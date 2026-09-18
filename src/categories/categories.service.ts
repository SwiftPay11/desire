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
} from 'mongoose';

import {
  Category,
  CategoryDocument,
} from './schemas/category.schema';

import {
  CreateCategoryDto,
} from './dto/create-category.dto';

import {
  UpdateCategoryDto,
} from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  async create(
    createCategoryDto: CreateCategoryDto,
  ) {
    const normalizedName =
      createCategoryDto.name.trim();

    const slug =
      this.generateSlug(normalizedName);

    const existingCategory =
      await this.categoryModel.findOne({
        $or: [
          {
            name: {
              $regex: `^${this.escapeRegex(normalizedName)}$`,
              $options: 'i',
            },
          },
          {
            slug,
          },
        ],
      });

    if (existingCategory) {
      throw new ConflictException(
        'A category with this name already exists',
      );
    }

    const category =
      await this.categoryModel.create({
        ...createCategoryDto,
        name: normalizedName,
        slug,
      });

    return {
      message: 'Category created successfully',
      category,
    };
  }

  async findAll() {
    return this.categoryModel
      .find()
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  async findActive() {
    return this.categoryModel
      .find({
        isActive: true,
      })
      .sort({
        name: 1,
      })
      .exec();
  }

  async findOne(id: string) {
    const category =
      await this.categoryModel
        .findById(id)
        .exec();

    if (!category) {
      throw new NotFoundException(
        'Category not found',
      );
    }

    return category;
  }

 async update(
  id: string,
  updateCategoryDto: UpdateCategoryDto,
) {
  const existingCategory =
    await this.categoryModel
      .findById(id)
      .exec();

  if (!existingCategory) {
    throw new NotFoundException(
      'Category not found',
    );
  }

  const updateData: Record<
    string,
    unknown
  > = {
    ...updateCategoryDto,
  };

  if (updateCategoryDto.name) {
    const normalizedName =
      updateCategoryDto.name.trim();

    const slug =
      this.generateSlug(
        normalizedName,
      );

    const duplicateCategory =
      await this.categoryModel.findOne({
        _id: {
          $ne: id,
        },
        $or: [
          {
            name: {
              $regex: `^${this.escapeRegex(
                normalizedName,
              )}$`,
              $options: 'i',
            },
          },
          {
            slug,
          },
        ],
      });

    if (duplicateCategory) {
      throw new ConflictException(
        'A category with this name already exists',
      );
    }

    updateData.name =
      normalizedName;

    updateData.slug = slug;
  }

  const updatedCategory =
    await this.categoryModel
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
      .exec();

  if (!updatedCategory) {
    throw new NotFoundException(
      'Category not found',
    );
  }

  return {
    message:
      'Category updated successfully',
    category: updatedCategory,
  };
}
     

  async remove(id: string) {
    const category =
      await this.categoryModel
        .findByIdAndDelete(id)
        .exec();

    if (!category) {
      throw new NotFoundException(
        'Category not found',
      );
    }

    return {
      message: 'Category deleted successfully',
    };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/['"]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private escapeRegex(value: string): string {
    return value.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&',
    );
  }
}