import {
  IsInt,
  IsMongoId,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class AddCartItemDto {
  @IsMongoId()
  productId: string;

  @IsInt()
  @Min(1)
  @Max(20)
  quantity: number;

  @IsString()
  size: string;

  @IsString()
  color: string;
}