import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
  Min,
} from 'class-validator';
import { WISH_PRIORITIES, type WishPriority } from '../wish.schema.js';

const URL_OPTIONS = { require_protocol: true, protocols: ['http', 'https'] };

export class PreviewLinkDto {
  @IsUrl(URL_OPTIONS)
  url: string;
}

/** Hace falta `url` o `title` (se valida en el service). */
export class CreateWishDto {
  @IsOptional()
  @IsUrl(URL_OPTIONS)
  url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsUrl(URL_OPTIONS)
  image?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number | null;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsOptional()
  @IsIn(WISH_PRIORITIES)
  priority?: WishPriority;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateWishDto extends PartialType(CreateWishDto) {
  @IsOptional()
  @IsBoolean()
  purchased?: boolean;
}
