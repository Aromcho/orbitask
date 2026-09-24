import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { APP_TIMEZONE } from '../common/dates.js';
import { FinanceService } from './finance.service.js';

/** Todos los días a las 06:00 genera los gastos/ingresos recurrentes que tocan. */
@Injectable()
export class RecurringJob {
  private readonly logger = new Logger(RecurringJob.name);

  constructor(private readonly finance: FinanceService) {}

  @Cron('0 6 * * *', { name: 'finance-recurring', timeZone: APP_TIMEZONE })
  async run() {
    const { created } = await this.finance.runRecurring();
    if (created > 0) this.logger.log(`Se generaron ${created} movimientos recurrentes`);
  }
}
