import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import { Public } from '../common/public.decorator.js';

@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Public()
  @Get()
  check() {
    return {
      status: 'ok',
      database: this.connection.readyState === 1 ? 'up' : 'down',
      uptime: Math.round(process.uptime()),
    };
  }
}
