import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put } from '@nestjs/common';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { CreateTaskListDto, UpdateTaskListDto } from './dto/task-list.dto.js';
import { CreateTaskDto, ReorderTasksDto, UpdateTaskDto } from './dto/task.dto.js';
import { TasksService } from './tasks.service.js';

@Controller()
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get('task-lists')
  findLists() {
    return this.tasks.findLists();
  }

  @Post('task-lists')
  createList(@Body() dto: CreateTaskListDto) {
    return this.tasks.createList(dto);
  }

  @Patch('task-lists/:id')
  updateList(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateTaskListDto) {
    return this.tasks.updateList(id, dto);
  }

  @Delete('task-lists/:id')
  @HttpCode(204)
  removeList(@Param('id', ParseObjectIdPipe) id: string) {
    return this.tasks.removeList(id);
  }

  @Get('tasks')
  findTasks() {
    return this.tasks.findTasks();
  }

  @Post('tasks')
  createTask(@Body() dto: CreateTaskDto) {
    return this.tasks.createTask(dto);
  }

  @Put('tasks/reorder')
  @HttpCode(204)
  reorder(@Body() dto: ReorderTasksDto) {
    return this.tasks.reorder(dto);
  }

  @Patch('tasks/:id')
  updateTask(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateTaskDto) {
    return this.tasks.updateTask(id, dto);
  }

  @Delete('tasks/:id')
  @HttpCode(204)
  removeTask(@Param('id', ParseObjectIdPipe) id: string) {
    return this.tasks.removeTask(id);
  }
}
