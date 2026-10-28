import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type Model, Types } from 'mongoose';
import type { CreateTaskListDto, UpdateTaskListDto } from './dto/task-list.dto.js';
import type { CreateTaskDto, ReorderTasksDto, UpdateTaskDto } from './dto/task.dto.js';
import { TaskList } from './task-list.schema.js';
import { Task } from './task.schema.js';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(TaskList.name) private readonly lists: Model<TaskList>,
    @InjectModel(Task.name) private readonly tasks: Model<Task>,
  ) {}

  // ---------- Listas (columnas del tablero) ----------

  findLists(userId: string) {
    return this.lists.find({ userId }).sort({ position: 1, createdAt: 1 });
  }

  async createList(userId: string, dto: CreateTaskListDto) {
    const position = await this.lists.countDocuments({ userId });
    return this.lists.create({ ...dto, userId, position });
  }

  async updateList(userId: string, id: string, dto: UpdateTaskListDto) {
    const list = await this.lists.findOneAndUpdate({ _id: id, userId }, dto, { returnDocument: 'after' });
    if (!list) throw new NotFoundException('Lista no encontrada');
    return list;
  }

  async removeList(userId: string, id: string) {
    const list = await this.lists.findOneAndDelete({ _id: id, userId });
    if (!list) throw new NotFoundException('Lista no encontrada');
    await this.tasks.deleteMany({ listId: list._id });
  }

  // ---------- Tareas ----------

  findTasks(userId: string) {
    return this.tasks.find({ userId }).sort({ position: 1, createdAt: 1 });
  }

  async createTask(userId: string, dto: CreateTaskDto) {
    if (!(await this.lists.exists({ _id: dto.listId, userId }))) {
      throw new NotFoundException('Lista no encontrada');
    }
    const position = await this.tasks.countDocuments({ listId: dto.listId });
    return this.tasks.create({ ...dto, userId, position });
  }

  async updateTask(userId: string, id: string, dto: UpdateTaskDto) {
    if (dto.listId && !(await this.lists.exists({ _id: dto.listId, userId }))) {
      throw new NotFoundException('Lista no encontrada');
    }
    const task = await this.tasks.findOneAndUpdate({ _id: id, userId }, dto, { returnDocument: 'after' });
    if (!task) throw new NotFoundException('Tarea no encontrada');
    return task;
  }

  async removeTask(userId: string, id: string) {
    const task = await this.tasks.findOneAndDelete({ _id: id, userId });
    if (!task) throw new NotFoundException('Tarea no encontrada');
  }

  /** Guarda en una sola operación el nuevo orden/columna de varias tarjetas. */
  async reorder(userId: string, { items }: ReorderTasksDto) {
    if (items.length === 0) return;
    // Solo se puede mover a listas propias.
    const listIds = [...new Set(items.map((item) => item.listId))];
    if ((await this.lists.countDocuments({ _id: { $in: listIds }, userId })) !== listIds.length) {
      throw new NotFoundException('Lista no encontrada');
    }
    await this.tasks.bulkWrite(
      items.map((item) => ({
        updateOne: {
          filter: { _id: item.id, userId: new Types.ObjectId(userId) },
          update: { $set: { listId: new Types.ObjectId(item.listId), position: item.position } },
        },
      })),
    );
  }
}
