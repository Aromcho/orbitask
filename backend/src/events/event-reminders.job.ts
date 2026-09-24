import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { Model } from 'mongoose';
import { CalendarEvent } from './event.schema.js';

const REMINDER_MINUTES = 15;

/**
 * Cada minuto busca eventos que empiezan en los próximos 15 minutos.
 * Por ahora solo lo registra en el log; más adelante lo mandamos por mail/push.
 * En Observe lo vas a ver en la pestaña "Jobs".
 */
@Injectable()
export class EventRemindersJob {
  private readonly logger = new Logger(EventRemindersJob.name);

  constructor(@InjectModel(CalendarEvent.name) private readonly events: Model<CalendarEvent>) {}

  @Cron(CronExpression.EVERY_MINUTE, { name: 'event-reminders' })
  async sendReminders() {
    const now = new Date();
    const soon = new Date(now.getTime() + REMINDER_MINUTES * 60_000);

    const upcoming = await this.events.find({
      allDay: false,
      reminderSentAt: null,
      start: { $gte: now, $lte: soon },
    });

    for (const event of upcoming) {
      const minutes = Math.round((event.start.getTime() - now.getTime()) / 60_000);
      this.logger.log(`⏰ "${event.title}" empieza en ${minutes} min`);
      event.reminderSentAt = now;
      await event.save();
    }
  }
}
