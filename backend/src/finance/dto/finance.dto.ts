import { OmitType, PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsHexColor,
  IsIn,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { IsDay, IsMonth } from '../../common/validators.js';
import { MOVEMENT_TYPES, type MovementType } from '../schemas.js';

// ---------- Categorías ----------

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  name: string;

  @IsIn(MOVEMENT_TYPES)
  type: MovementType;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  emoji?: string;
}

// El tipo no se cambia: rompería los movimientos que ya la usan.
export class UpdateCategoryDto extends PartialType(OmitType(CreateCategoryDto, ['type'] as const)) {}

// ---------- Movimientos ----------

export class CreateTransactionDto {
  @IsIn(MOVEMENT_TYPES)
  type: MovementType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @IsMongoId()
  categoryId: string;

  @IsDay()
  date: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}

export class UpdateTransactionDto extends PartialType(CreateTransactionDto) {}

export class MonthQueryDto {
  @IsMonth()
  month: string;
}

// ---------- Recurrentes ----------

export class CreateRecurringDto {
  @IsIn(MOVEMENT_TYPES)
  type: MovementType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @IsMongoId()
  categoryId: string;

  @IsInt()
  @Min(1)
  @Max(28)
  dayOfMonth: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateRecurringDto extends PartialType(CreateRecurringDto) {}
