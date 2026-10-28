import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { baseSchemaOptions } from '../common/schema-options.js';

@Schema(baseSchemaOptions)
export class TaskList {
  /** Dueño: cada usuario ve solo lo suyo. */
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ default: '#8b7cf6' })
  color: string;

  @Prop({ default: 0 })
  position: number;
}

export type TaskListDocument = HydratedDocument<TaskList>;
export const TaskListSchema = SchemaFactory.createForClass(TaskList);
