import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { baseSchemaOptions } from '../common/schema-options.js';

export const WISH_PRIORITIES = ['baja', 'media', 'alta'] as const;
export type WishPriority = (typeof WISH_PRIORITIES)[number];

@Schema(baseSchemaOptions)
export class Wish {
  /** Dueño: cada usuario ve solo lo suyo. */
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ default: '' })
  url: string;

  /** Imagen sacada del link (og:image) o cargada a mano. */
  @Prop({ default: '' })
  image: string;

  @Prop({ default: '' })
  siteName: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ type: Number, default: null })
  price: number | null;

  @Prop({ default: 'ARS' })
  currency: string;

  @Prop({ type: String, enum: WISH_PRIORITIES, default: 'media' })
  priority: WishPriority;

  @Prop({ default: '' })
  notes: string;

  @Prop({ default: false })
  purchased: boolean;

  @Prop({ type: Date, default: null })
  purchasedAt: Date | null;
}

export type WishDocument = HydratedDocument<Wish>;
export const WishSchema = SchemaFactory.createForClass(Wish);
