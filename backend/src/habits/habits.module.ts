import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HabitCheckin, HabitCheckinSchema } from './habit-checkin.schema.js';
import { Habit, HabitSchema } from './habit.schema.js';
import { HabitStreaksJob } from './habit-streaks.job.js';
import { HabitsController } from './habits.controller.js';
import { HabitsService } from './habits.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Habit.name, schema: HabitSchema },
      { name: HabitCheckin.name, schema: HabitCheckinSchema },
    ]),
  ],
  controllers: [HabitsController],
  providers: [HabitsService, HabitStreaksJob],
})
export class HabitsModule {}
