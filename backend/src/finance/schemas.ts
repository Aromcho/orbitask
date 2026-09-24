import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { baseSchemaOptions } from '../common/schema-options.js';

export const MOVEMENT_TYPES = ['income', 'expense'] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

// ---------- Categoría ----------

@Schema(baseSchemaOptions)
export class Category {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: String, enum: MOVEMENT_TYPES, required: true })
  type: MovementType;

  @Prop({ default: '#8b7cf6' })
  color: string;

  @Prop({ default: '💸' })
  emoji: string;
}

export type CategoryDocument = HydratedDocument<Category>;
export const CategorySchema = SchemaFactory.createForClass(Category);

// ---------- Movimiento (ingreso o gasto) ----------

@Schema(baseSchemaOptions)
export class Transaction {
  @Prop({ type: String, enum: MOVEMENT_TYPES, required: true })
  type: MovementType;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ type: SchemaTypes.ObjectId, ref: Category.name, required: true })
  categoryId: Types.ObjectId;

  @Prop({ required: true, index: true }) // 'YYYY-MM-DD'
  date: string;

  @Prop({ default: '' })
  note: string;

  /** Si lo generó un movimiento recurrente, cuál. */
  @Prop({ type: SchemaTypes.ObjectId, default: null })
  recurringId: Types.ObjectId | null;
}

export type TransactionDocument = HydratedDocument<Transaction>;
export const TransactionSchema = SchemaFactory.createForClass(Transaction);

// ---------- Recurrente (alquiler, sueldo, suscripciones…) ----------

@Schema(baseSchemaOptions)
export class Recurring {
  @Prop({ type: String, enum: MOVEMENT_TYPES, required: true })
  type: MovementType;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ type: SchemaTypes.ObjectId, ref: Category.name, required: true })
  categoryId: Types.ObjectId;

  /** Día del mes en que se genera (1-28, así existe en todos los meses). */
  @Prop({ required: true, min: 1, max: 28 })
  dayOfMonth: number;

  @Prop({ default: '' })
  note: string;

  @Prop({ default: true })
  active: boolean;

  /** Último mes generado ('YYYY-MM'), para no duplicarlo. */
  @Prop({ type: String, default: null })
  lastRunMonth: string | null;
}

export type RecurringDocument = HydratedDocument<Recurring>;
export const RecurringSchema = SchemaFactory.createForClass(Recurring);
