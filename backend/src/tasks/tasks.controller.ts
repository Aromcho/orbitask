import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put } from '@nestjs/common';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { JwtPayload } from '../auth/auth.types.js';
import { CreateTaskListDto, UpdateTaskListDto } from './dto/task-list.dto.js';
import { CreateTaskDto, ReorderTasksDto, UpdateTaskDto } from './dto/task.dto.js';
import { TasksService } from './tasks.service.js';

@Controller()
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get('task-lists')
  findLists(@CurrentUser() user: JwtPayload) {
    return this.tasks.findLists(user.sub);
  }

  @Post('task-lists')
  createList(@CurrentUser() user: JwtPayload, @Body() dto: CreateTaskListDto) {
    return this.tasks.createList(user.sub, dto);
  }

  @Patch('task-lists/:id')
  updateList(@CurrentUser() user: JwtPayload, @Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateTaskListDto) {
    return this.tasks.updateList(user.sub, id, dto);
  }

  @Delete('task-lists/:id')
  @HttpCode(204)
  removeList(@CurrentUser() user: JwtPayload, @Param('id', ParseObjectIdPipe) id: string) {
    return this.tasks.removeList(user.sub, id);
  }

  @Get('tasks')
  findTasks(@CurrentUser() user: JwtPayload) {
    return this.tasks.findTasks(user.sub);
  }

  @Post('tasks')
  createTask(@CurrentUser() user: JwtPayload, @Body() dto: CreateTaskDto) {
    return this.tasks.createTask(user.sub, dto);
  }

  @Put('tasks/reorder')
  @HttpCode(204)
  reorder(@CurrentUser() user: JwtPayload, @Body() dto: ReorderTasksDto) {
    return this.tasks.reorder(user.sub, dto);
  }

  @Patch('tasks/:id')
  updateTask(@CurrentUser() user: JwtPayload, @Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateTaskDto) {
    return this.tasks.updateTask(user.sub, id, dto);
  }

  @Delete('tasks/:id')
  @HttpCode(204)
  removeTask(@CurrentUser() user: JwtPayload, @Param('id', ParseObjectIdPipe) id: string) {
    return this.tasks.removeTask(user.sub, id);
  }
}
