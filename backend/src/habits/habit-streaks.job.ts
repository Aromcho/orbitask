import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { APP_TIMEZONE } from '../common/dates.js';
import { HabitsService } from './habits.service.js';

/** Todas las noches a las 00:05 recalcula las rachas (corta las que se rompieron ayer). */
@Injectable()
export class HabitStreaksJob {
  private readonly logger = new Logger(HabitStreaksJob.name);

  constructor(private readonly habits: HabitsService) {}

  @Cron('5 0 * * *', { name: 'habit-streaks', timeZone: APP_TIMEZONE })
  async recalculate() {
    const count = await this.habits.recalculateAll();
    this.logger.log(`Rachas recalculadas para ${count} hábitos`);
  }
}
