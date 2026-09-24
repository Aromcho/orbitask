import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import {
  CreateCategoryDto,
  CreateRecurringDto,
  CreateTransactionDto,
  MonthQueryDto,
  UpdateCategoryDto,
  UpdateRecurringDto,
  UpdateTransactionDto,
} from './dto/finance.dto.js';
import { FinanceService } from './finance.service.js';

@Controller('finance')
export class FinanceController {
  constructor(private readonly finance: FinanceService) {}

  // ---------- Categorías ----------

  @Get('categories')
  findCategories() {
    return this.finance.findCategories();
  }

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.finance.createCategory(dto);
  }

  @Patch('categories/:id')
  updateCategory(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateCategoryDto) {
    return this.finance.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @HttpCode(204)
  removeCategory(@Param('id', ParseObjectIdPipe) id: string) {
    return this.finance.removeCategory(id);
  }

  // ---------- Movimientos ----------

  @Get('transactions')
  findTransactions(@Query() { month }: MonthQueryDto) {
    return this.finance.findTransactions(month);
  }

  @Post('transactions')
  createTransaction(@Body() dto: CreateTransactionDto) {
    return this.finance.createTransaction(dto);
  }

  @Patch('transactions/:id')
  updateTransaction(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateTransactionDto) {
    return this.finance.updateTransaction(id, dto);
  }

  @Delete('transactions/:id')
  @HttpCode(204)
  removeTransaction(@Param('id', ParseObjectIdPipe) id: string) {
    return this.finance.removeTransaction(id);
  }

  @Get('summary')
  summary(@Query() { month }: MonthQueryDto) {
    return this.finance.summary(month);
  }

  // ---------- Recurrentes ----------

  @Get('recurring')
  findRecurring() {
    return this.finance.findRecurring();
  }

  @Post('recurring')
  createRecurring(@Body() dto: CreateRecurringDto) {
    return this.finance.createRecurring(dto);
  }

  /** Corre a mano lo mismo que hace el cron de las 06:00 (útil para probar). */
  @Post('recurring/run')
  @HttpCode(200)
  runRecurring() {
    return this.finance.runRecurring();
  }

  @Patch('recurring/:id')
  updateRecurring(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateRecurringDto) {
    return this.finance.updateRecurring(id, dto);
  }

  @Delete('recurring/:id')
  @HttpCode(204)
  removeRecurring(@Param('id', ParseObjectIdPipe) id: string) {
    return this.finance.removeRecurring(id);
  }
}
