import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { baseSchemaOptions } from '../common/schema-options.js';

export const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6]; // 0 = domingo

@Schema(baseSchemaOptions)
export class Habit {
  /** Dueño: cada usuario ve solo lo suyo. */
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: '✅' })
  emoji: string;

  @Prop({ default: '#fbbf24' })
  color: string;

  /** Días de la semana en los que toca hacerlo. */
  @Prop({ type: [Number], default: ALL_WEEKDAYS })
  days: number[];

  @Prop({ default: false })
  archived: boolean;

  @Prop({ default: 0 })
  currentStreak: number;

  @Prop({ default: 0 })
  bestStreak: number;

  @Prop({ default: 0 })
  position: number;
}

export type HabitDocument = HydratedDocument<Habit>;
export const HabitSchema = SchemaFactory.createForClass(Habit);
