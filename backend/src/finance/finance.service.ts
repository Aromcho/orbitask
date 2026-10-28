import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type Model, Types } from 'mongoose';
import { todayISO } from '../common/dates.js';
import type {
  CreateCategoryDto,
  CreateRecurringDto,
  CreateTransactionDto,
  MonthCarryDto,
  UpdateCategoryDto,
  UpdateRecurringDto,
  UpdateTransactionDto,
} from './dto/finance.dto.js';
import { Category, MonthCarry, type MovementType, Recurring, Transaction } from './schemas.js';

/** Categorías con las que arranca cada usuario. */
const DEFAULT_CATEGORIES: CreateCategoryDto[] = [
  { name: 'Sueldo', type: 'income', color: '#2dd4bf', emoji: '💼' },
  { name: 'Freelance', type: 'income', color: '#34d399', emoji: '💻' },
  { name: 'Supermercado', type: 'expense', color: '#fb7185', emoji: '🛒' },
  { name: 'Casa', type: 'expense', color: '#f472b6', emoji: '🏠' },
  { name: 'Transporte', type: 'expense', color: '#38bdf8', emoji: '🚗' },
  { name: 'Salidas', type: 'expense', color: '#fbbf24', emoji: '🍕' },
  { name: 'Suscripciones', type: 'expense', color: '#a78bfa', emoji: '📺' },
  { name: 'Salud', type: 'expense', color: '#4ade80', emoji: '💊' },
  { name: 'Otros', type: 'expense', color: '#94a3b8', emoji: '📦' },
];

/** Mes siguiente a 'YYYY-MM'. */
function nextMonth(month: string) {
  const [y, m] = month.split('-').map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
}

/** Rango de fechas 'YYYY-MM-DD' de un mes 'YYYY-MM'. */
function monthRange(month: string) {
  return { $gte: `${month}-01`, $lte: `${month}-31` };
}

@Injectable()
export class FinanceService {
  constructor(
    @InjectModel(Category.name) private readonly categories: Model<Category>,
    @InjectModel(Transaction.name) private readonly transactions: Model<Transaction>,
    @InjectModel(Recurring.name) private readonly recurring: Model<Recurring>,
    @InjectModel(MonthCarry.name) private readonly carries: Model<MonthCarry>,
  ) {}

  // ---------- Categorías ----------

  async findCategories(userId: string) {
    // Usuario nuevo: arranca con las categorías por defecto.
    if (!(await this.categories.exists({ userId }))) {
      await this.categories.insertMany(DEFAULT_CATEGORIES.map((c) => ({ ...c, userId })));
    }
    return this.categories.find({ userId }).sort({ type: 1, name: 1 });
  }

  createCategory(userId: string, dto: CreateCategoryDto) {
    return this.categories.create({ ...dto, userId });
  }

  async updateCategory(userId: string, id: string, dto: UpdateCategoryDto) {
    const category = await this.categories.findOneAndUpdate({ _id: id, userId }, dto, { returnDocument: 'after' });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    return category;
  }

  async removeCategory(userId: string, id: string) {
    const inUse =
      (await this.transactions.exists({ userId, categoryId: id })) ||
      (await this.recurring.exists({ userId, categoryId: id }));
    if (inUse) throw new ConflictException('La categoría tiene movimientos, no se puede borrar');

    const category = await this.categories.findOneAndDelete({ _id: id, userId });
    if (!category) throw new NotFoundException('Categoría no encontrada');
  }

  // ---------- Movimientos ----------

  findTransactions(userId: string, month: string) {
    return this.transactions.find({ userId, date: monthRange(month) }).sort({ date: -1, createdAt: -1 });
  }

  async createTransaction(userId: string, dto: CreateTransactionDto) {
    await this.assertCategory(userId, dto.categoryId, dto.type);
    return this.transactions.create({ ...dto, userId });
  }

  async updateTransaction(userId: string, id: string, dto: UpdateTransactionDto) {
    const tx = await this.transactions.findOne({ _id: id, userId });
    if (!tx) throw new NotFoundException('Movimiento no encontrado');
    if (dto.categoryId || dto.type) {
      await this.assertCategory(userId, dto.categoryId ?? tx.categoryId.toString(), dto.type ?? tx.type);
    }
    tx.set(dto);
    return tx.save();
  }

  async removeTransaction(userId: string, id: string) {
    const tx = await this.transactions.findOneAndDelete({ _id: id, userId });
    if (!tx) throw new NotFoundException('Movimiento no encontrado');
  }

  /** Totales del mes, gastos por categoría y serie diaria para los gráficos. */
  async summary(userId: string, month: string) {
    // aggregate no castea tipos: el userId va como ObjectId.
    const match = { userId: new Types.ObjectId(userId), date: monthRange(month) };

    const [totals, previous, byCategory, daily] = await Promise.all([
      this.transactions.aggregate<{ _id: MovementType; total: number }>([
        { $match: match },
        { $group: { _id: '$type', total: { $sum: '$amount' } } },
      ]),
      this.carryOver(userId, month),
      this.transactions.aggregate<{
        categoryId: string;
        name: string;
        color: string;
        emoji: string;
        total: number;
      }>([
        { $match: { ...match, type: 'expense' } },
        { $group: { _id: '$categoryId', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
        {
          $lookup: {
            from: this.categories.collection.name,
            localField: '_id',
            foreignField: '_id',
            as: 'category',
          },
        },
        { $unwind: '$category' },
        {
          $project: {
            _id: 0,
            categoryId: { $toString: '$_id' },
            name: '$category.name',
            color: '$category.color',
            emoji: '$category.emoji',
            total: 1,
          },
        },
      ]),
      this.transactions.aggregate<{ _id: { date: string; type: MovementType }; total: number }>([
        { $match: match },
        { $group: { _id: { date: '$date', type: '$type' }, total: { $sum: '$amount' } } },
      ]),
    ]);

    const income = totals.find((t) => t._id === 'income')?.total ?? 0;
    const expense = totals.find((t) => t._id === 'expense')?.total ?? 0;

    // Una fila por cada día del mes (los días sin movimientos quedan en 0).
    const [year, monthNumber] = month.split('-').map(Number);
    const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => ({
      date: `${month}-${String(i + 1).padStart(2, '0')}`,
      income: 0,
      expense: 0,
    }));
    for (const row of daily) {
      const day = days[Number(row._id.date.slice(8)) - 1];
      if (day) day[row._id.type] = row.total;
    }

    const balance = income - expense;
    const { carryOver, previousAvailable, carryDecision } = previous;
    return {
      month,
      income,
      expense,
      balance,
      carryOver,
      available: carryOver + balance,
      previousAvailable,
      carryDecision,
      byCategory,
      daily: days,
    };
  }

  async setCarry(userId: string, { month, carry }: MonthCarryDto) {
    await this.carries.updateOne({ userId, month }, { $set: { carry } }, { upsert: true });
    return { month, carry };
  }

  /**
   * Lo que llega a `month` desde los meses anteriores. Mes a mes, el saldo
   * pasa al siguiente salvo que el usuario haya elegido "empezar de cero".
   */
  private async carryOver(userId: string, month: string) {
    const [balances, decisions] = await Promise.all([
      this.transactions.aggregate<{ _id: string; total: number }>([
        { $match: { userId: new Types.ObjectId(userId), date: { $lt: `${month}-01` } } },
        {
          $group: {
            _id: { $substrBytes: ['$date', 0, 7] },
            total: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', { $multiply: ['$amount', -1] }] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      this.carries.find({ userId, month: { $lte: month } }),
    ]);
    const decided = new Map(decisions.map((d) => [d.month, d.carry]));
    const byMonth = new Map(balances.map((b) => [b._id, b.total]));

    let previousAvailable = 0;
    for (let m = balances[0]?._id; m && m < month; m = nextMonth(m)) {
      const carried = decided.get(m) === false ? 0 : previousAvailable;
      previousAvailable = carried + (byMonth.get(m) ?? 0);
    }
    const carryDecision = decided.get(month) ?? null;
    return {
      carryOver: carryDecision === false ? 0 : previousAvailable,
      previousAvailable,
      /** null = todavía no eligió (se cuenta como que sí pasa). */
      carryDecision,
    };
  }

  // ---------- Recurrentes ----------

  findRecurring(userId: string) {
    return this.recurring.find({ userId }).sort({ dayOfMonth: 1 });
  }

  async createRecurring(userId: string, dto: CreateRecurringDto) {
    await this.assertCategory(userId, dto.categoryId, dto.type);
    return this.recurring.create({ ...dto, userId });
  }

  async updateRecurring(userId: string, id: string, dto: UpdateRecurringDto) {
    const item = await this.recurring.findOne({ _id: id, userId });
    if (!item) throw new NotFoundException('Recurrente no encontrado');
    if (dto.categoryId || dto.type) {
      await this.assertCategory(userId, dto.categoryId ?? item.categoryId.toString(), dto.type ?? item.type);
    }
    item.set(dto);
    return item.save();
  }

  async removeRecurring(userId: string, id: string) {
    const item = await this.recurring.findOneAndDelete({ _id: id, userId });
    if (!item) throw new NotFoundException('Recurrente no encontrado');
  }

  /**
   * Genera los movimientos de los recurrentes que ya "vencieron" este mes
   * y todavía no se generaron. Es seguro correrlo varias veces.
   * Sin userId (el cron) corre para todos los usuarios.
   */
  async runRecurring(userId?: string) {
    const today = todayISO();
    const month = today.slice(0, 7);
    const dayOfMonth = Number(today.slice(8));

    const due = await this.recurring.find({
      ...(userId && { userId }),
      active: true,
      dayOfMonth: { $lte: dayOfMonth },
      lastRunMonth: { $ne: month },
    });

    for (const item of due) {
      await this.transactions.create({
        userId: item.userId,
        type: item.type,
        amount: item.amount,
        categoryId: item.categoryId,
        date: `${month}-${String(item.dayOfMonth).padStart(2, '0')}`,
        note: item.note,
        recurringId: item._id,
      });
      item.lastRunMonth = month;
      await item.save();
    }
    return { created: due.length };
  }

  private async assertCategory(userId: string, categoryId: string, type: MovementType) {
    const category = await this.categories.findOne({ _id: categoryId, userId });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    if (category.type !== type) {
      throw new BadRequestException(`La categoría "${category.name}" no es de tipo ${type}`);
    }
  }
}
