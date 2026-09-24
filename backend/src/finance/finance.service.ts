import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { todayISO } from '../common/dates.js';
import type {
  CreateCategoryDto,
  CreateRecurringDto,
  CreateTransactionDto,
  UpdateCategoryDto,
  UpdateRecurringDto,
  UpdateTransactionDto,
} from './dto/finance.dto.js';
import { Category, type MovementType, Recurring, Transaction } from './schemas.js';

/** Categorías con las que arranca la app la primera vez. */
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

/** Rango de fechas 'YYYY-MM-DD' de un mes 'YYYY-MM'. */
function monthRange(month: string) {
  return { $gte: `${month}-01`, $lte: `${month}-31` };
}

@Injectable()
export class FinanceService implements OnApplicationBootstrap {
  constructor(
    @InjectModel(Category.name) private readonly categories: Model<Category>,
    @InjectModel(Transaction.name) private readonly transactions: Model<Transaction>,
    @InjectModel(Recurring.name) private readonly recurring: Model<Recurring>,
  ) {}

  async onApplicationBootstrap() {
    if ((await this.categories.estimatedDocumentCount()) === 0) {
      await this.categories.insertMany(DEFAULT_CATEGORIES);
    }
  }

  // ---------- Categorías ----------

  findCategories() {
    return this.categories.find().sort({ type: 1, name: 1 });
  }

  createCategory(dto: CreateCategoryDto) {
    return this.categories.create(dto);
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const category = await this.categories.findByIdAndUpdate(id, dto, { returnDocument: 'after' });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    return category;
  }

  async removeCategory(id: string) {
    const inUse =
      (await this.transactions.exists({ categoryId: id })) ||
      (await this.recurring.exists({ categoryId: id }));
    if (inUse) throw new ConflictException('La categoría tiene movimientos, no se puede borrar');

    const category = await this.categories.findByIdAndDelete(id);
    if (!category) throw new NotFoundException('Categoría no encontrada');
  }

  // ---------- Movimientos ----------

  findTransactions(month: string) {
    return this.transactions.find({ date: monthRange(month) }).sort({ date: -1, createdAt: -1 });
  }

  async createTransaction(dto: CreateTransactionDto) {
    await this.assertCategory(dto.categoryId, dto.type);
    return this.transactions.create(dto);
  }

  async updateTransaction(id: string, dto: UpdateTransactionDto) {
    const tx = await this.transactions.findById(id);
    if (!tx) throw new NotFoundException('Movimiento no encontrado');
    if (dto.categoryId || dto.type) {
      await this.assertCategory(dto.categoryId ?? tx.categoryId.toString(), dto.type ?? tx.type);
    }
    tx.set(dto);
    return tx.save();
  }

  async removeTransaction(id: string) {
    const tx = await this.transactions.findByIdAndDelete(id);
    if (!tx) throw new NotFoundException('Movimiento no encontrado');
  }

  /** Totales del mes, gastos por categoría y serie diaria para los gráficos. */
  async summary(month: string) {
    const match = { date: monthRange(month) };

    const [totals, byCategory, daily] = await Promise.all([
      this.transactions.aggregate<{ _id: MovementType; total: number }>([
        { $match: match },
        { $group: { _id: '$type', total: { $sum: '$amount' } } },
      ]),
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

    return { month, income, expense, balance: income - expense, byCategory, daily: days };
  }

  // ---------- Recurrentes ----------

  findRecurring() {
    return this.recurring.find().sort({ dayOfMonth: 1 });
  }

  async createRecurring(dto: CreateRecurringDto) {
    await this.assertCategory(dto.categoryId, dto.type);
    return this.recurring.create(dto);
  }

  async updateRecurring(id: string, dto: UpdateRecurringDto) {
    const item = await this.recurring.findById(id);
    if (!item) throw new NotFoundException('Recurrente no encontrado');
    if (dto.categoryId || dto.type) {
      await this.assertCategory(dto.categoryId ?? item.categoryId.toString(), dto.type ?? item.type);
    }
    item.set(dto);
    return item.save();
  }

  async removeRecurring(id: string) {
    const item = await this.recurring.findByIdAndDelete(id);
    if (!item) throw new NotFoundException('Recurrente no encontrado');
  }

  /**
   * Genera los movimientos de los recurrentes que ya "vencieron" este mes
   * y todavía no se generaron. Es seguro correrlo varias veces.
   */
  async runRecurring() {
    const today = todayISO();
    const month = today.slice(0, 7);
    const dayOfMonth = Number(today.slice(8));

    const due = await this.recurring.find({
      active: true,
      dayOfMonth: { $lte: dayOfMonth },
      lastRunMonth: { $ne: month },
    });

    for (const item of due) {
      await this.transactions.create({
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

  private async assertCategory(categoryId: string, type: MovementType) {
    const category = await this.categories.findById(categoryId);
    if (!category) throw new NotFoundException('Categoría no encontrada');
    if (category.type !== type) {
      throw new BadRequestException(`La categoría "${category.name}" no es de tipo ${type}`);
    }
  }
}
