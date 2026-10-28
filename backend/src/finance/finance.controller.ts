import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { JwtPayload } from '../auth/auth.types.js';
import {
  CreateCategoryDto,
  CreateRecurringDto,
  CreateTransactionDto,
  MonthCarryDto,
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
  findCategories(@CurrentUser() user: JwtPayload) {
    return this.finance.findCategories(user.sub);
  }

  @Post('categories')
  createCategory(@CurrentUser() user: JwtPayload, @Body() dto: CreateCategoryDto) {
    return this.finance.createCategory(user.sub, dto);
  }

  @Patch('categories/:id')
  updateCategory(@CurrentUser() user: JwtPayload, @Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateCategoryDto) {
    return this.finance.updateCategory(user.sub, id, dto);
  }

  @Delete('categories/:id')
  @HttpCode(204)
  removeCategory(@CurrentUser() user: JwtPayload, @Param('id', ParseObjectIdPipe) id: string) {
    return this.finance.removeCategory(user.sub, id);
  }

  // ---------- Movimientos ----------

  @Get('transactions')
  findTransactions(@CurrentUser() user: JwtPayload, @Query() { month }: MonthQueryDto) {
    return this.finance.findTransactions(user.sub, month);
  }

  @Post('transactions')
  createTransaction(@CurrentUser() user: JwtPayload, @Body() dto: CreateTransactionDto) {
    return this.finance.createTransaction(user.sub, dto);
  }

  @Patch('transactions/:id')
  updateTransaction(@CurrentUser() user: JwtPayload, @Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateTransactionDto) {
    return this.finance.updateTransaction(user.sub, id, dto);
  }

  @Delete('transactions/:id')
  @HttpCode(204)
  removeTransaction(@CurrentUser() user: JwtPayload, @Param('id', ParseObjectIdPipe) id: string) {
    return this.finance.removeTransaction(user.sub, id);
  }

  @Get('summary')
  summary(@CurrentUser() user: JwtPayload, @Query() { month }: MonthQueryDto) {
    return this.finance.summary(user.sub, month);
  }

  /** Al empezar un mes: si pasa (o no) el saldo del mes anterior. */
  @Put('carry')
  setCarry(@CurrentUser() user: JwtPayload, @Body() dto: MonthCarryDto) {
    return this.finance.setCarry(user.sub, dto);
  }

  // ---------- Recurrentes ----------

  @Get('recurring')
  findRecurring(@CurrentUser() user: JwtPayload) {
    return this.finance.findRecurring(user.sub);
  }

  @Post('recurring')
  createRecurring(@CurrentUser() user: JwtPayload, @Body() dto: CreateRecurringDto) {
    return this.finance.createRecurring(user.sub, dto);
  }

  /** Corre a mano lo mismo que hace el cron de las 06:00 (útil para probar). */
  @Post('recurring/run')
  @HttpCode(200)
  runRecurring(@CurrentUser() user: JwtPayload) {
    return this.finance.runRecurring(user.sub);
  }

  @Patch('recurring/:id')
  updateRecurring(@CurrentUser() user: JwtPayload, @Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateRecurringDto) {
    return this.finance.updateRecurring(user.sub, id, dto);
  }

  @Delete('recurring/:id')
  @HttpCode(204)
  removeRecurring(@CurrentUser() user: JwtPayload, @Param('id', ParseObjectIdPipe) id: string) {
    return this.finance.removeRecurring(user.sub, id);
  }
}
