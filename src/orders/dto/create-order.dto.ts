import {
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateOrderDto {
  @IsMongoId()
  addressId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}