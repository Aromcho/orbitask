import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../common/schema-options.js';

export const EVENT_CATEGORIES = ['personal', 'trabajo', 'salud', 'social', 'estudio', 'otro'] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

@Schema(baseSchemaOptions)
export class CalendarEvent {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, index: true })
  start: Date;

  @Prop({ required: true })
  end: Date;

  @Prop({ default: false })
  allDay: boolean;

  @Prop({ type: String, enum: EVENT_CATEGORIES, default: 'personal' })
  category: EventCategory;

  @Prop({ default: '' })
  location: string;

  @Prop({ default: '' })
  notes: string;

  /** Cuándo se envió el recordatorio (null = todavía no). */
  @Prop({ type: Date, default: null })
  reminderSentAt: Date | null;
}

export type CalendarEventDocument = HydratedDocument<CalendarEvent>;
export const CalendarEventSchema = SchemaFactory.createForClass(CalendarEvent);
