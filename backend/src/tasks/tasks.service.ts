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

  findLists() {
    return this.lists.find().sort({ position: 1, createdAt: 1 });
  }

  async createList(dto: CreateTaskListDto) {
    const position = await this.lists.countDocuments();
    return this.lists.create({ ...dto, position });
  }

  async updateList(id: string, dto: UpdateTaskListDto) {
    const list = await this.lists.findByIdAndUpdate(id, dto, { returnDocument: 'after' });
    if (!list) throw new NotFoundException('Lista no encontrada');
    return list;
  }

  async removeList(id: string) {
    const list = await this.lists.findByIdAndDelete(id);
    if (!list) throw new NotFoundException('Lista no encontrada');
    await this.tasks.deleteMany({ listId: list._id });
  }

  // ---------- Tareas ----------

  findTasks() {
    return this.tasks.find().sort({ position: 1, createdAt: 1 });
  }

  async createTask(dto: CreateTaskDto) {
    if (!(await this.lists.exists({ _id: dto.listId }))) {
      throw new NotFoundException('Lista no encontrada');
    }
    const position = await this.tasks.countDocuments({ listId: dto.listId });
    return this.tasks.create({ ...dto, position });
  }

  async updateTask(id: string, dto: UpdateTaskDto) {
    const task = await this.tasks.findByIdAndUpdate(id, dto, { returnDocument: 'after' });
    if (!task) throw new NotFoundException('Tarea no encontrada');
    return task;
  }

  async removeTask(id: string) {
    const task = await this.tasks.findByIdAndDelete(id);
    if (!task) throw new NotFoundException('Tarea no encontrada');
  }

  /** Guarda en una sola operación el nuevo orden/columna de varias tarjetas. */
  async reorder({ items }: ReorderTasksDto) {
    if (items.length === 0) return;
    await this.tasks.bulkWrite(
      items.map((item) => ({
        updateOne: {
          filter: { _id: item.id },
          update: { $set: { listId: new Types.ObjectId(item.listId), position: item.position } },
        },
      })),
    );
  }
}
