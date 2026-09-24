import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CalendarEvent, CalendarEventSchema } from './event.schema.js';
import { EventRemindersJob } from './event-reminders.job.js';
import { EventsController } from './events.controller.js';
import { EventsService } from './events.service.js';

@Module({
  imports: [MongooseModule.forFeature([{ name: CalendarEvent.name, schema: CalendarEventSchema }])],
  controllers: [EventsController],
  providers: [EventsService, EventRemindersJob],
})
export class EventsModule {}
