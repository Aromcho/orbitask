import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { addDays, todayISO, weekday } from '../common/dates.js';
import type { CheckinsRangeQueryDto, CreateHabitDto, UpdateHabitDto } from './dto/habit.dto.js';
import { HabitCheckin } from './habit-checkin.schema.js';
import { Habit, type HabitDocument } from './habit.schema.js';

/** Hasta cuántos días hacia atrás miramos para calcular una racha. */
const STREAK_LOOKBACK_DAYS = 400;

@Injectable()
export class HabitsService {
  constructor(
    @InjectModel(Habit.name) private readonly habits: Model<Habit>,
    @InjectModel(HabitCheckin.name) private readonly checkins: Model<HabitCheckin>,
  ) {}

  findAll(userId: string) {
    return this.habits.find({ userId, archived: false }).sort({ position: 1, createdAt: 1 });
  }

  async create(userId: string, dto: CreateHabitDto) {
    const position = await this.habits.countDocuments({ userId, archived: false });
    return this.habits.create({ ...dto, userId, position });
  }

  async update(userId: string, id: string, dto: UpdateHabitDto) {
    const habit = await this.findOne(userId, id);
    habit.set(dto);
    // Si cambiaron los días, la racha puede cambiar.
    if (dto.days) await this.recalculateStreak(habit);
    return habit.save();
  }

  async remove(userId: string, id: string) {
    const habit = await this.habits.findOneAndDelete({ _id: id, userId });
    if (!habit) throw new NotFoundException('Hábito no encontrado');
    await this.checkins.deleteMany({ habitId: habit._id });
  }

  findCheckins(userId: string, { from, to }: CheckinsRangeQueryDto) {
    return this.checkins.find({ userId, date: { $gte: from, $lte: to } });
  }

  /** Marca o desmarca un día. Devuelve el estado nuevo y la racha actualizada. */
  async toggle(userId: string, id: string, date: string) {
    if (date > todayISO()) {
      throw new BadRequestException('No podés marcar días futuros');
    }
    const habit = await this.findOne(userId, id);

    const removed = await this.checkins.findOneAndDelete({ habitId: habit._id, date });
    if (!removed) await this.checkins.create({ userId: habit.userId, habitId: habit._id, date });

    await this.recalculateStreak(habit);
    await habit.save();
    return { done: !removed, currentStreak: habit.currentStreak, bestStreak: habit.bestStreak };
  }

  /** Recalcula las rachas de todos los hábitos (lo usa el cron nocturno). */
  async recalculateAll() {
    const habits = await this.habits.find({ archived: false });
    for (const habit of habits) {
      await this.recalculateStreak(habit);
      await habit.save();
    }
    return habits.length;
  }

  /**
   * Racha = días programados seguidos cumplidos, contando hacia atrás desde hoy.
   * Hoy no rompe la racha si todavía no lo marcaste (el día no terminó).
   */
  private async recalculateStreak(habit: HabitDocument) {
    const today = todayISO();
    const since = addDays(today, -STREAK_LOOKBACK_DAYS);
    const done = new Set(
      (await this.checkins.find({ habitId: habit._id, date: { $gte: since } }, { date: 1 })).map(
        (c) => c.date,
      ),
    );

    let streak = 0;
    for (let i = 0, day = today; i < STREAK_LOOKBACK_DAYS; i++, day = addDays(day, -1)) {
      if (!habit.days.includes(weekday(day))) continue; // día libre: no suma ni corta
      if (done.has(day)) streak++;
      else if (day !== today) break;
    }

    habit.currentStreak = streak;
    habit.bestStreak = Math.max(habit.bestStreak, streak);
  }

  private async findOne(userId: string, id: string) {
    const habit = await this.habits.findOne({ _id: id, userId });
    if (!habit) throw new NotFoundException('Hábito no encontrado');
    return habit;
  }
}
