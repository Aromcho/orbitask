import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TaskList, TaskListSchema } from './task-list.schema.js';
import { Task, TaskSchema } from './task.schema.js';
import { TasksController } from './tasks.controller.js';
import { TasksService } from './tasks.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TaskList.name, schema: TaskListSchema },
      { name: Task.name, schema: TaskSchema },
    ]),
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
