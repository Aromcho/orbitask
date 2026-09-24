import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsIn, IsISO8601, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { EVENT_CATEGORIES, type EventCategory } from '../event.schema.js';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsISO8601()
  start: string;

  @IsISO8601()
  end: string;

  @IsOptional()
  @IsBoolean()
  allDay?: boolean;

  @IsOptional()
  @IsIn(EVENT_CATEGORIES)
  category?: EventCategory;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;
}

export class UpdateEventDto extends PartialType(CreateEventDto) {}

/** GET /events?from=...&to=...  (la semana visible en el calendario) */
export class EventsRangeQueryDto {
  @IsISO8601()
  from: string;

  @IsISO8601()
  to: string;
}
