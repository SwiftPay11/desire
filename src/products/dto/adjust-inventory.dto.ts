// src/products/dto/adjust-inventory.dto.ts

import {
  IsIn,
  IsInt,
  Min,
} from 'class-validator';

export class AdjustInventoryDto {
  @IsIn([
    'ADD',
    'SUBTRACT',
    'SET',
  ])
  action:
    | 'ADD'
    | 'SUBTRACT'
    | 'SET';

  @IsInt()
  @Min(0)
  quantity: number;
}