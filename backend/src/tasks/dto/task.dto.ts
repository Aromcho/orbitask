import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { IsDay } from '../../common/validators.js';
import { PRIORITIES, type Priority } from '../task.schema.js';

export class CreateTaskDto {
  @IsMongoId()
  listId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsIn(PRIORITIES)
  priority?: Priority;

  @IsOptional() // también acepta null para "sin fecha"
  @IsDay()
  due?: string | null;
}

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @IsOptional()
  @IsBoolean()
  done?: boolean;
}

class ReorderItemDto {
  @IsMongoId()
  id: string;

  @IsMongoId()
  listId: string;

  @IsInt()
  @Min(0)
  position: number;
}

/** Lo manda el tablero después de arrastrar una tarjeta. */
export class ReorderTasksDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items: ReorderItemDto[];
}
