import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { baseSchemaOptions } from '../common/schema-options.js';
import { Habit } from './habit.schema.js';

/** Un documento por cada día que cumpliste un hábito. */
@Schema(baseSchemaOptions)
export class HabitCheckin {
  /** Dueño: cada usuario ve solo lo suyo. */
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: Habit.name, required: true })
  habitId: Types.ObjectId;

  @Prop({ required: true }) // 'YYYY-MM-DD'
  date: string;
}

export type HabitCheckinDocument = HydratedDocument<HabitCheckin>;
export const HabitCheckinSchema = SchemaFactory.createForClass(HabitCheckin);

// Un hábito solo puede marcarse una vez por día.
HabitCheckinSchema.index({ habitId: 1, date: 1 }, { unique: true });
HabitCheckinSchema.index({ date: 1 });
