import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
  IsUrl,
} from 'class-validator';

export class AddProductImagesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({
    each: true,
  })
  @IsUrl(
    {
      require_protocol: true,
      require_tld: false,
    },
    {
      each: true,
      message:
        'Every image must be a valid URL',
    },
  )
  images: string[];
}