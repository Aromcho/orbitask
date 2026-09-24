# 03 · NestJS Observe

## Qué es

**NestJS Observe** es la plataforma oficial de observabilidad de NestJS. Instalás un paquete (`@nestjs/observe`), ponés dos keys,
y tu API empieza a mandar a un dashboard en la nube **todo lo que pasa adentro**: cada request, cada método de cada service,
cada query a Mongo, cada cron job, cada error y el uso de CPU y memoria. Sin configurar colectores ni armar dashboards a mano.

La diferencia con herramientas genéricas (Datadog, OpenTelemetry): como se engancha en el ciclo de vida de Nest,
los spans se llaman como **tus clases y métodos** (`FinanceService.summary`), no solo como la ruta HTTP.

- Dashboard: https://observe.nestjs.com
- Demo sin registrarte: https://www.observe-demo.nestjs.com/dashboard
- Docs: https://docs.nestjs.com/observability/overview

### Plan gratis

| | Free | Pro |
|---|---|---|
| Eventos/mes | 300.000 | 25M |
| Retención | **3 días** | 30 días |
| Logs y alertas | ✗ | ✓ |

Para una app personal alcanza de sobra. Las queries a la base y los fetch salientes **no cuentan** como eventos.
Ojo: con 3 días de retención, lo que mires hoy desaparece el fin de semana.

## Cómo está integrado en Orbitask

Son solo tres piezas:

**1. [`src/observe.ts`](../backend/src/observe.ts)** crea el módulo y el "instrument":

```ts
export const { ObserveModule, ObserveInstrument } = createObserveModule();
```

**2. [`src/main.ts`](../backend/src/main.ts)** conecta el instrument al crear la app. Esto es lo que permite medir cada provider:

```ts
const app = await NestFactory.create(AppModule, { instrument: ObserveInstrument });
```

**3. [`src/app.module.ts`](../backend/src/app.module.ts)** registra el módulo con la config:

```ts
ObserveModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    appKey: config.getOrThrow('OBSERVE_APP_KEY'),
    appSecret: config.getOrThrow('OBSERVE_APP_SECRET'),
    serviceId: 'orbitask',                        // nombre del servicio en el dashboard
    serviceVersion: config.get('GIT_SHA', 'dev'),   // para comparar versiones
    http: {
      ignore: [/\/health$/],                         // el health check no nos interesa
      getUserId: (req) => req.user?.sub ?? 'anonymous',
    },
  }),
}),
```

Al arrancar, en la consola vas a ver `Observe agent worker initialized.`
La telemetría se serializa en un **worker thread** aparte, así que no frena tus requests.

## Recorrido por el dashboard

Usá la app unos minutos (crear tareas, marcar hábitos, cargar gastos, agregar un deseo) y después entrá al dashboard.
Los nombres exactos de las secciones pueden variar un poco en la interfaz, pero esto es lo que ofrece:

| Pestaña | Qué vas a ver en Orbitask | Qué preguntarte |
|---|---|---|
| **Requests** | `GET /api/tasks`, `POST /api/habits/:id/toggle`… con p50/p95, throughput y % de errores | ¿Cuál es el endpoint más lento? ¿Alguno falla? |
| **Traces** | La cascada de un request: `FinanceController.summary → FinanceService.summary → 3 aggregate` | ¿El tiempo se va en mi código o en la base? |
| **Errors** | Los 4xx/5xx agrupados, con stack trace | ¿Hay errores que no sabía que existían? |
| **Jobs** | `event-reminders` (cada minuto), `habit-streaks`, `finance-recurring` | ¿Corren? ¿Cuánto tardan? ¿Fallan? |
| **Services** | Tiempo por clase y método (`HabitsService.recalculateStreak`) | ¿Qué método consume más en total? |
| **Runtime** | CPU, memoria, event loop, garbage collector | ¿Hay fugas de memoria? ¿Bloqueos? |

## 🧪 Laboratorio: aprender rompiendo cosas

Cada experimento es un cambio chico. Hacelo, mirá el dashboard y después **revertilo**.

### Experimento 1: un endpoint lento

En `TasksService.findTasks()` agregá un delay falso:

```ts
async findTasks() {
  await new Promise((r) => setTimeout(r, 1500)); // 🐢
  return this.tasks.find().sort({ position: 1, createdAt: 1 });
}
```

Recargá la página de Tareas varias veces.
**Mirá:** en *Requests*, `GET /api/tasks` sube a ~1,5 s de p95. En el trace, `TasksService.findTasks` tiene **self time** alto,
mientras que la query a Mongo sigue siendo rápida. Así se distingue "mi código es lento" de "la base es lenta".

### Experimento 2: un error que se escapa

En `EventsService.findInRange()`:

```ts
if (Math.random() < 0.3) throw new Error('Falla aleatoria de prueba');
```

Navegá semanas en el calendario.
**Mirá:** *Errors* agrupa las ocurrencias bajo una misma "huella" (fingerprint), muestra la línea exacta y el trace que la produjo.
Observe además captura los headers del request fallido para que puedas reproducirlo.

### Experimento 3: el problema N+1

En `HabitsService.findAll()` reemplazá la consulta por una que haga una query por hábito:

```ts
async findAll() {
  const habits = await this.habits.find({ archived: false });
  for (const h of habits) await this.checkins.countDocuments({ habitId: h._id }); // N queries
  return habits;
}
```

**Mirá:** el trace de `GET /api/habits` muestra una escalera de queries `countDocuments` una detrás de otra.
Es el patrón más común de lentitud en APIs, y en la cascada se ve a simple vista.

### Experimento 4: un cron que falla

En `RecurringJob.run()` tirá un error y cambiá el cron a `CronExpression.EVERY_30_SECONDS`.
**Mirá:** *Jobs* muestra las ejecuciones fallidas. Sin Observe, un cron que falla de noche pasa desapercibido.

### Experimento 5: bloquear el event loop

En cualquier endpoint:

```ts
const end = Date.now() + 2000;
while (Date.now() < end) {} // 🔥 bloquea todo el proceso
```

**Mirá:** en *Runtime* el **event loop delay** se dispara, y **todos** los requests se frenan a la vez, no solo ese.
Desde el dashboard podés pedir un **CPU profile** y ver la función culpable.

### Experimento 6: tu propia métrica (este sí dejalo 😉)

Contá cuántas tareas completás por prioridad. En [`tasks.service.ts`](../backend/src/tasks/tasks.service.ts):

```ts
import { TracerService } from '@nestjs/observe';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(TaskList.name) private readonly lists: Model<TaskList>,
    @InjectModel(Task.name) private readonly tasks: Model<Task>,
    private readonly tracer: TracerService, // ← ObserveModule es global, se inyecta directo
  ) {}

  private readonly completed = this.tracer.counter<'priority'>('tasks_completed', {
    description: 'Tareas marcadas como hechas',
    labels: ['priority'],
  });

  async updateTask(id: string, dto: UpdateTaskDto) {
    const task = await this.tasks.findByIdAndUpdate(id, dto, { returnDocument: 'after' });
    if (!task) throw new NotFoundException('Tarea no encontrada');
    if (dto.done) this.completed.increment({ priority: task.priority }); // ← acá
    return task;
  }
}
```

Hay tres tipos de métricas:

| Tipo | Para qué | Ejemplo en Orbitask |
|---|---|---|
| `counter` | Algo que solo sube | tareas completadas, hábitos marcados |
| `gauge` | Un valor que sube y baja | saldo del mes, cantidad de deseos pendientes |
| `summary` | Una distribución (p50/p95/p99) | cuánto tarda la vista previa de links |

> ⚠️ No uses labels con valores infinitos (ids, URLs): cada combinación es una serie nueva. Máximo 1000 por métrica.

### Experimento 7: comparar versiones

Arrancá con `GIT_SHA=v1` en el `.env`, usá la app, cambiá a `GIT_SHA=v2`, meté el experimento 1 y usala de nuevo.
Observe te deja comparar el rendimiento **entre versiones**. Así se detecta que un deploy empeoró algo.

## Opciones útiles que todavía no usamos

```ts
http: {
  capture: {
    slowerThanMs: 2000,        // guardar headers de los requests lentos (además de los fallidos)
    body: { maxBytes: 4096 },  // también el body (ojo: son tus datos)
  },
},
forwardLogs: true,             // manda los logs correlacionados con cada trace (plan Pro)
debug: true,                   // logs del agente en consola, para diagnosticar
```

## ¿Para qué te sirve en la vida real?

- **En el trabajo:** cuando alguien dice "la app está lenta", en vez de adivinar abrís el trace y ves exactamente qué método o query tarda.
- **Antes de que se queje nadie:** los errores aparecen agrupados en el dashboard aunque ningún usuario te avise.
- **Crons y colas:** los jobs en segundo plano son los que más fallan en silencio, y acá los ves.
- **Deploys:** comparás versiones y detectás regresiones de rendimiento.
- **Aprender:** ver la cascada real de un request es la mejor forma de entender qué hace tu código.
