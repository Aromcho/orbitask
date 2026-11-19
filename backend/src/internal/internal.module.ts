import {
  Controller,
  Get,
  Injectable,
  Module,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  InjectConnection,
  InjectModel,
  MongooseModule,
} from '@nestjs/mongoose';
import type { Connection, Model, Types } from 'mongoose';
import { User, UserSchema } from '../auth/user.schema.js';
import { Public } from '../common/public.decorator.js';
import { CalendarEvent, CalendarEventSchema } from '../events/event.schema.js';
import { Task, TaskSchema } from '../tasks/task.schema.js';
import { InternalGuard } from './internal.guard.js';
import {
  type UpcomingItem,
  baDay,
  baLocal,
  bump,
  emptySeries,
  parseLimit,
  parseRange,
  sortUpcoming,
  today,
  totalsOf,
} from './internal.util.js';

/**
 * Módulo /internal de Orbitask (panel central). Solo lectura.
 * Contrato: GET /api/internal/health · /api/internal/metrics?desde=&hasta= · /api/internal/upcoming?limite=
 * Contrato completo y cómo sumar un proyecto: README del repo panel-dios.
 *
 * Orbitask tiene varios usuarios y cada uno ve solo lo suyo: hacia el panel salen únicamente las
 * tareas y los eventos del usuario de ADMIN_EMAIL. Finanzas, hábitos y deseos no salen nunca.
 */
const SERVICE = 'orbitask';

/** Contadores de la serie diaria */
const COUNTERS = ['tareas', 'tareasHechas', 'eventos'] as const;
/** Orbitask no tiene publicaciones, consultas, ventas ni visitas */
const COMMON = { publicaciones: [], consultas: [], ventas: [], visitas: [] };

@Injectable()
export class InternalService {
  constructor(
    @InjectModel(Task.name) private readonly tasks: Model<Task>,
    @InjectModel(CalendarEvent.name)
    private readonly events: Model<CalendarEvent>,
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectConnection() private readonly connection: Connection,
    private readonly config: ConfigService,
  ) {}

  /** El dueño del panel: el usuario de ADMIN_EMAIL. Sin ese usuario no sale ningún dato. */
  private async ownerId(): Promise<Types.ObjectId | null> {
    const email = this.config.get<string>('ADMIN_EMAIL')?.trim().toLowerCase();
    if (!email) return null;
    const user = await this.users.findOne({ email }).select('_id').lean();
    return user?._id ?? null;
  }

  health() {
    const db = this.connection.readyState === 1 ? 'up' : 'down';
    return {
      ok: db === 'up',
      service: SERVICE,
      version: this.config.get<string>('GIT_SHA', 'dev'),
      uptime: Math.round(process.uptime()),
      db,
      now: new Date().toISOString(),
    };
  }

  async metrics(query: Record<string, unknown>) {
    const range = parseRange(query);
    const series = emptySeries(range, COUNTERS);
    const userId = await this.ownerId();
    if (userId) {
      const inRange = { $gte: range.from, $lt: range.to };
      const [created, done, events] = await Promise.all([
        this.tasks
          .find({ userId, createdAt: inRange })
          .select('createdAt')
          .lean<{ createdAt: Date }[]>(),
        // No hay fecha de «hecha»: se toma la última modificación de la tarea terminada
        this.tasks
          .find({ userId, done: true, updatedAt: inRange })
          .select('updatedAt')
          .lean<{ updatedAt: Date }[]>(),
        this.events.find({ userId, start: inRange }).select('start').lean(),
      ]);
      created.forEach((t) => bump(series, baDay(t.createdAt), 'tareas'));
      done.forEach((t) => bump(series, baDay(t.updatedAt), 'tareasHechas'));
      events.forEach((e) => bump(series, baDay(e.start), 'eventos'));
    }
    return {
      service: SERVICE,
      desde: range.desde,
      hasta: range.hasta,
      totals: totalsOf(series, COUNTERS),
      common: COMMON,
      series: [...series.values()],
      byProperty: [],
    };
  }

  async upcoming(query: Record<string, unknown>) {
    const limite = parseLimit(query);
    const hoy = today();
    const userId = await this.ownerId();
    const items: UpcomingItem[] = [];
    if (userId) {
      const [next, overdue, events] = await Promise.all([
        // due es texto 'YYYY-MM-DD': se compara como texto
        this.tasks
          .find({ userId, done: false, due: { $gte: hoy } })
          .sort({ due: 1 })
          .limit(limite)
          .lean(),
        this.tasks
          .find({ userId, done: false, due: { $lt: hoy, $ne: null } })
          .sort({ due: 1 })
          .limit(limite)
          .lean(),
        this.events
          .find({ userId, start: { $gte: new Date() } })
          .sort({ start: 1 })
          .limit(limite)
          .lean(),
      ]);
      const task = (
        t: (typeof next)[number],
        pending: boolean,
      ): UpcomingItem => ({
        kind: 'tarea',
        title: t.title,
        date: t.due ?? hoy,
        pending,
        who: '',
        status: pending ? 'vencida' : `prioridad ${t.priority}`,
        propertyId: null,
        ref: String(t._id),
      });
      items.push(
        ...next.map((t) => task(t, false)),
        ...overdue.map((t) => task(t, true)),
      );
      items.push(
        ...events.map((e) => ({
          kind: 'evento',
          title: e.title,
          date: e.allDay ? baDay(e.start) : baLocal(e.start),
          pending: false,
          who: '',
          status: e.category,
          propertyId: null,
          ref: String(e._id),
        })),
      );
    }
    const sorted = sortUpcoming(items);
    return {
      service: SERVICE,
      generatedAt: new Date().toISOString(),
      items: [
        ...sorted.filter((i) => !i.pending).slice(0, limite),
        ...sorted.filter((i) => i.pending),
      ],
    };
  }
}

// @Public saltea el AuthGuard global (sesión por cookie); el que decide acá es InternalGuard
@Public()
@Controller('internal')
@UseGuards(InternalGuard)
export class InternalController {
  constructor(private readonly internal: InternalService) {}

  @Get('health')
  health() {
    return this.internal.health();
  }

  @Get('metrics')
  metrics(@Query() query: Record<string, unknown>) {
    return this.internal.metrics(query);
  }

  @Get('upcoming')
  upcoming(@Query() query: Record<string, unknown>) {
    return this.internal.upcoming(query);
  }
}

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: CalendarEvent.name, schema: CalendarEventSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [InternalController],
  providers: [InternalService, InternalGuard],
})
export class InternalModule {}
