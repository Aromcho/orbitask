import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import {
  CheckinsRangeQueryDto,
  CreateHabitDto,
  ToggleCheckinDto,
  UpdateHabitDto,
} from './dto/habit.dto.js';
import { HabitsService } from './habits.service.js';

@Controller('habits')
export class HabitsController {
  constructor(private readonly habits: HabitsService) {}

  @Get()
  findAll() {
    return this.habits.findAll();
  }

  // Va antes de ':id' para que "checkins" no se interprete como un id.
  @Get('checkins')
  findCheckins(@Query() query: CheckinsRangeQueryDto) {
    return this.habits.findCheckins(query);
  }

  @Post()
  create(@Body() dto: CreateHabitDto) {
    return this.habits.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateHabitDto) {
    return this.habits.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.habits.remove(id);
  }

  @Post(':id/toggle')
  @HttpCode(200)
  toggle(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: ToggleCheckinDto) {
    return this.habits.toggle(id, dto.date);
  }
}
