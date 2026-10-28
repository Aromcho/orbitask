import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { CreateEventDto, EventsRangeQueryDto, UpdateEventDto } from './dto/event.dto.js';
import { CalendarEvent } from './event.schema.js';

@Injectable()
export class EventsService {
  constructor(@InjectModel(CalendarEvent.name) private readonly events: Model<CalendarEvent>) {}

  /** Eventos que se superponen con el rango [from, to). */
  findInRange(userId: string, { from, to }: EventsRangeQueryDto) {
    return this.events
      .find({ userId, start: { $lt: new Date(to) }, end: { $gt: new Date(from) } })
      .sort({ start: 1 });
  }

  create(userId: string, dto: CreateEventDto) {
    this.assertValidRange(dto.start, dto.end);
    return this.events.create({ ...dto, userId });
  }

  async update(userId: string, id: string, dto: UpdateEventDto) {
    const event = await this.events.findOne({ _id: id, userId });
    if (!event) throw new NotFoundException('Evento no encontrado');

    this.assertValidRange(dto.start ?? event.start, dto.end ?? event.end);
    // Si cambió la hora de inicio, el recordatorio tiene que volver a enviarse.
    if (dto.start && new Date(dto.start).getTime() !== event.start.getTime()) {
      event.reminderSentAt = null;
    }
    event.set(dto);
    return event.save();
  }

  async remove(userId: string, id: string) {
    const event = await this.events.findOneAndDelete({ _id: id, userId });
    if (!event) throw new NotFoundException('Evento no encontrado');
  }

  private assertValidRange(start: string | Date, end: string | Date) {
    if (new Date(end) < new Date(start)) {
      throw new BadRequestException('El evento no puede terminar antes de empezar');
    }
  }
}
