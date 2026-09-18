import {
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
  Address,
  AddressDocument,
} from './schemas/address.schema';

import {
  CreateAddressDto,
} from './dto/create-address.dto';

import {
  UpdateAddressDto,
} from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(
    @InjectModel(Address.name)
    private readonly addressModel:
      Model<AddressDocument>,
  ) {}

  async create(
    userId: string,
    createAddressDto: CreateAddressDto,
  ) {
    const userObjectId =
      new Types.ObjectId(userId);

    const existingAddressCount =
      await this.addressModel.countDocuments({
        user: userObjectId,
      });

    const shouldBeDefault =
      createAddressDto.isDefault === true ||
      existingAddressCount === 0;

    if (shouldBeDefault) {
      await this.addressModel.updateMany(
        {
          user: userObjectId,
          isDefault: true,
        },
        {
          $set: {
            isDefault: false,
          },
        },
      );
    }

    const address =
      await this.addressModel.create({
        ...createAddressDto,
        user: userObjectId,
        isDefault: shouldBeDefault,
      });

    return {
      message:
        'Address created successfully',
      address,
    };
  }

  async findAllForUser(
    userId: string,
  ) {
    const addresses =
      await this.addressModel
        .find({
          user: new Types.ObjectId(
            userId,
          ),
        })
        .sort({
          isDefault: -1,
          createdAt: -1,
        });

    return {
      addresses,
    };
  }

  async findOneForUser(
    userId: string,
    addressId: string,
  ) {
    const address =
      await this.addressModel.findOne({
        _id: addressId,
        user: new Types.ObjectId(
          userId,
        ),
      });

    if (!address) {
      throw new NotFoundException(
        'Address not found',
      );
    }

    return {
      address,
    };
  }

  async update(
    userId: string,
    addressId: string,
    updateAddressDto: UpdateAddressDto,
  ) {
    const userObjectId =
      new Types.ObjectId(userId);

    const address =
      await this.addressModel.findOne({
        _id: addressId,
        user: userObjectId,
      });

    if (!address) {
      throw new NotFoundException(
        'Address not found',
      );
    }

    if (
      updateAddressDto.isDefault === true
    ) {
      await this.addressModel.updateMany(
        {
          user: userObjectId,
          _id: {
            $ne: address._id,
          },
          isDefault: true,
        },
        {
          $set: {
            isDefault: false,
          },
        },
      );
    }

    Object.assign(
      address,
      updateAddressDto,
    );

    await address.save();

    return {
      message:
        'Address updated successfully',
      address,
    };
  }

  async setDefault(
    userId: string,
    addressId: string,
  ) {
    const userObjectId =
      new Types.ObjectId(userId);

    const address =
      await this.addressModel.findOne({
        _id: addressId,
        user: userObjectId,
      });

    if (!address) {
      throw new NotFoundException(
        'Address not found',
      );
    }

    await this.addressModel.updateMany(
      {
        user: userObjectId,
        isDefault: true,
      },
      {
        $set: {
          isDefault: false,
        },
      },
    );

    address.isDefault = true;

    await address.save();

    return {
      message:
        'Default address updated successfully',
      address,
    };
  }

  async remove(
    userId: string,
    addressId: string,
  ) {
    const userObjectId =
      new Types.ObjectId(userId);

    const address =
      await this.addressModel.findOne({
        _id: addressId,
        user: userObjectId,
      });

    if (!address) {
      throw new NotFoundException(
        'Address not found',
      );
    }

    const wasDefault =
      address.isDefault;

    await address.deleteOne();

    if (wasDefault) {
      const nextAddress =
        await this.addressModel
          .findOne({
            user: userObjectId,
          })
          .sort({
            createdAt: -1,
          });

      if (nextAddress) {
        nextAddress.isDefault = true;

        await nextAddress.save();
      }
    }

    return {
      message:
        'Address deleted successfully',
    };
  }
}