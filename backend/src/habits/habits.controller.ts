import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { JwtPayload } from '../auth/auth.types.js';
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
  findAll(@CurrentUser() user: JwtPayload) {
    return this.habits.findAll(user.sub);
  }

  // Va antes de ':id' para que "checkins" no se interprete como un id.
  @Get('checkins')
  findCheckins(@CurrentUser() user: JwtPayload, @Query() query: CheckinsRangeQueryDto) {
    return this.habits.findCheckins(user.sub, query);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateHabitDto) {
    return this.habits.create(user.sub, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: JwtPayload, @Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateHabitDto) {
    return this.habits.update(user.sub, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: JwtPayload, @Param('id', ParseObjectIdPipe) id: string) {
    return this.habits.remove(user.sub, id);
  }

  @Post(':id/toggle')
  @HttpCode(200)
  toggle(@CurrentUser() user: JwtPayload, @Param('id', ParseObjectIdPipe) id: string, @Body() dto: ToggleCheckinDto) {
    return this.habits.toggle(user.sub, id, dto.date);
  }
}
