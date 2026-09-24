import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FinanceController } from './finance.controller.js';
import { FinanceService } from './finance.service.js';
import { RecurringJob } from './recurring.job.js';
import {
  Category,
  CategorySchema,
  Recurring,
  RecurringSchema,
  Transaction,
  TransactionSchema,
} from './schemas.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: Recurring.name, schema: RecurringSchema },
    ]),
  ],
  controllers: [FinanceController],
  providers: [FinanceService, RecurringJob],
})
export class FinanceModule {}
