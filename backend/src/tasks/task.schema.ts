import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { baseSchemaOptions } from '../common/schema-options.js';
import { TaskList } from './task-list.schema.js';

export const PRIORITIES = ['baja', 'media', 'alta'] as const;
export type Priority = (typeof PRIORITIES)[number];

@Schema(baseSchemaOptions)
export class Task {
  @Prop({ type: SchemaTypes.ObjectId, ref: TaskList.name, required: true, index: true })
  listId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ type: String, enum: PRIORITIES, default: 'media' })
  priority: Priority;

  @Prop({ type: String, default: null }) // 'YYYY-MM-DD'
  due: string | null;

  @Prop({ default: false })
  done: boolean;

  @Prop({ default: 0 })
  position: number;
}

export type TaskDocument = HydratedDocument<Task>;
export const TaskSchema = SchemaFactory.createForClass(Task);
