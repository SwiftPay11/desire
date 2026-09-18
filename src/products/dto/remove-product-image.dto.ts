import {
  IsString,
  IsUrl,
} from 'class-validator';

export class RemoveProductImageDto {
  @IsString()
  @IsUrl(
    {
      require_protocol: true,
      require_tld: false,
    },
    {
      message:
        'Image must be a valid URL',
    },
  )
  image: string;
}