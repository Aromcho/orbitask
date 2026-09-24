import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module.js';
import { EventsModule } from './events/events.module.js';
import { FinanceModule } from './finance/finance.module.js';
import { HabitsModule } from './habits/habits.module.js';
import { HealthModule } from './health/health.module.js';
import { ObserveModule } from './observe.js';
import { TasksModule } from './tasks/tasks.module.js';
import { WishlistModule } from './wishlist/wishlist.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ObserveModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        appKey: config.getOrThrow<string>('OBSERVE_APP_KEY'),
        appSecret: config.getOrThrow<string>('OBSERVE_APP_SECRET'),
        serviceId: 'orbitask', // tiene que coincidir con la app registrada en Observe
        serviceVersion: config.get<string>('GIT_SHA', 'dev'),
        http: {
          ignore: [/\/health$/],
          getUserId: (req) => req.user?.sub ?? 'anonymous',
        },
      }),
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
      }),
    }),
    ScheduleModule.forRoot(),
    HealthModule,
    AuthModule,
    TasksModule,
    EventsModule,
    HabitsModule,
    FinanceModule,
    WishlistModule,
  ],
})
export class AppModule {}
