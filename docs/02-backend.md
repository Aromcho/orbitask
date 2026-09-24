# 02 · Cómo está hecho el backend

Un recorrido por NestJS usando el código real de Orbitask. Leelo con el código abierto al lado.

## La idea en una imagen

```
Request HTTP
   │
   ▼
main.ts ──► prefijo /api · cookies · ValidationPipe
   │
   ▼
AuthGuard (global) ──► ¿tiene cookie válida? si no → 401
   │
   ▼
Controller ──► recibe y valida el DTO, llama al service
   │
   ▼
Service ──► lógica de negocio, usa los Models de Mongoose
   │
   ▼
MongoDB
```

Y en paralelo, **NestJS Observe** mide cada paso de ese camino (ver [03-observe.md](03-observe.md)).

## Estructura

```
backend/src/
├── main.ts               Arranque: prefijo /api, cookies, validación, CORS
├── app.module.ts         Módulo raíz: config, Observe, Mongo, cron, y los módulos de cada sección
├── observe.ts            createObserveModule() → ObserveModule + ObserveInstrument
├── common/               Utilidades compartidas
│   ├── schema-options.ts   timestamps + JSON con `id` en vez de `_id`
│   ├── dates.ts            "hoy" en la zona horaria de Argentina
│   ├── validators.ts       @IsDay() y @IsMonth()
│   └── public.decorator.ts @Public() para saltear el login
├── health/               GET /api/health
├── auth/                 Login con JWT en cookie httpOnly + guard global
├── tasks/                Listas y tareas (Kanban)
├── events/               Calendario + cron de recordatorios
├── habits/               Hábitos, check-ins y rachas + cron nocturno
├── finance/              Categorías, movimientos, recurrentes + cron diario
└── wishlist/             Deseos + vista previa de links
```

Cada carpeta de sección sigue el mismo patrón:

| Archivo | Rol |
|---|---|
| `*.schema.ts` | Cómo se guarda en Mongo (clase con `@Prop()`) |
| `dto/*.dto.ts` | Qué acepta la API (clase con validaciones de `class-validator`) |
| `*.service.ts` | La lógica. Es lo único que toca la base |
| `*.controller.ts` | Las rutas HTTP. Finito: valida y delega en el service |
| `*.job.ts` | Tareas programadas (`@Cron`) |
| `*.module.ts` | Junta todo y registra los models |

## Conceptos clave (con ejemplos del proyecto)

### Módulos

Un módulo agrupa lo que pertenece a una funcionalidad. [`tasks.module.ts`](../backend/src/tasks/tasks.module.ts):

```ts
@Module({
  imports: [MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }, ...])],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
```

`forFeature` registra los models para que se puedan inyectar con `@InjectModel(Task.name)`.

### Inyección de dependencias

Nest crea las instancias y te las pasa por el constructor. Nunca hacés `new TasksService()`:

```ts
@Controller()
export class TasksController {
  constructor(private readonly tasks: TasksService) {}
}
```

### DTOs y validación

`ValidationPipe` (en `main.ts`) valida **cada body y query** contra su DTO antes de llegar al controller:

```ts
export class CreateTaskDto {
  @IsMongoId() listId: string;
  @IsString() @IsNotEmpty() @MaxLength(200) title: string;
  @IsOptional() @IsIn(PRIORITIES) priority?: Priority;
}
```

- `whitelist: true`: descarta cualquier campo que no esté en el DTO (nadie puede mandarte `{ "admin": true }`).
- `transform: true`: convierte el JSON en una instancia real del DTO.
- `PartialType(CreateTaskDto)`: el DTO de update, con todo opcional.

Probalo: `POST /api/tasks` con `{"title":""}` → 400 con la lista de errores.

### Guard global + `@Public()`

[`auth.guard.ts`](../backend/src/auth/auth.guard.ts) se registra con `APP_GUARD`, así que protege **toda** la API.
Los endpoints que no necesitan sesión (login, health) se marcan con `@Public()`.
El token viaja en una cookie **httpOnly**, que el JavaScript del navegador no puede leer. Eso la protege de ataques XSS.

### Cron jobs

`ScheduleModule.forRoot()` habilita `@Cron()`. En Orbitask hay tres:

| Job | Cuándo | Qué hace |
|---|---|---|
| `event-reminders` | cada minuto | Busca eventos que empiezan en ≤15 min y loguea el recordatorio |
| `habit-streaks` | 00:05 | Recalcula rachas (corta las que se rompieron ayer) |
| `finance-recurring` | 06:00 | Genera los gastos e ingresos recurrentes del mes |

Los tres aparecen en la pestaña **Jobs** de Observe con su duración y sus errores.
El de finanzas también se puede correr a mano: `POST /api/finance/recurring/run` (botón *Generar ahora* en la app).

### Aggregation pipeline (Mongo)

El resumen del mes ([`finance.service.ts`](../backend/src/finance/finance.service.ts) → `summary()`) usa `aggregate` para sumar en la base en vez de traer todo a Node:

```ts
{ $match: { date: { $gte: '2026-09-01', $lte: '2026-09-31' } } },
{ $group: { _id: '$type', total: { $sum: '$amount' } } }
```

En Observe vas a ver estas queries como spans debajo de `FinanceService.summary`.

### Fetch saliente (vista previa de links)

[`link-preview.service.ts`](../backend/src/wishlist/link-preview.service.ts) descarga la página del link y lee sus metadatos:
`og:image`, `og:title`, JSON-LD `Product` (precio). Observe traza ese `fetch` como un span `GET store.steampowered.com`.

> Mercado Libre bloquea a los servidores con un captcha, así que ahí la app te pide completar los datos a mano.

## Lecciones que salieron al construirlo

Dos bugs reales que encontramos probando. Vale la pena entenderlos:

1. **`useDefineForClassFields: false`** en `tsconfig.json`.
   Con TypeScript moderno, los campos de clase sin valor se inicializan en `undefined`.
   Entonces un DTO de update `{ title: "x" }` llegaba como `{ title: "x", description: undefined, ... }`, y `doc.set(dto)` **borraba** los otros campos.
   Con esa opción en `false`, los campos que no mandás directamente no existen.

2. **`SchemaTypes.ObjectId`** y no `Types.ObjectId` en `@Prop({ type })`.
   Con Mongoose 9, `Types.ObjectId` no se reconoce como tipo de schema y los ids se guardaban como texto.
   Consecuencia: el `$lookup` de categorías no encontraba nada y el chequeo de "categoría en uso" fallaba.
   `SchemaTypes.ObjectId` es el tipo de schema; `Types.ObjectId` es el tipo del valor (para TypeScript).

## Endpoints

Todos bajo `/api`, y todos requieren sesión salvo `auth/login`, `auth/logout` y `health`.

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/login` | `{ email, password }` → setea la cookie |
| POST | `/auth/logout` | Borra la cookie |
| GET | `/auth/me` | Usuario actual |
| GET | `/health` | Estado de la API y la base |
| GET/POST | `/task-lists` | Listas del tablero |
| PATCH/DELETE | `/task-lists/:id` | Editar / borrar (borra sus tareas) |
| GET/POST | `/tasks` | Tareas |
| PUT | `/tasks/reorder` | `{ items: [{ id, listId, position }] }` después de arrastrar |
| PATCH/DELETE | `/tasks/:id` | Editar / borrar |
| GET | `/events?from=ISO&to=ISO` | Eventos de un rango |
| POST, PATCH/DELETE | `/events`, `/events/:id` | CRUD |
| GET | `/habits` | Hábitos activos con rachas |
| GET | `/habits/checkins?from=YYYY-MM-DD&to=…` | Días cumplidos |
| POST | `/habits/:id/toggle` | `{ date }` → marca/desmarca y devuelve la racha |
| GET | `/finance/summary?month=YYYY-MM` | Totales, por categoría y por día |
| GET/POST | `/finance/transactions?month=YYYY-MM` | Movimientos |
| GET/POST | `/finance/categories` | Categorías (se crean 9 por defecto) |
| GET/POST | `/finance/recurring` | Recurrentes |
| POST | `/finance/recurring/run` | Genera los recurrentes pendientes |
| GET/POST | `/wishlist` | Deseos (si mandás solo `url`, completa el resto) |
| POST | `/wishlist/preview` | `{ url }` → título, imagen, precio |
| POST | `/wishlist/:id/refresh` | Vuelve a leer el link |

## Comandos

```bash
npm run start:dev   # desarrollo con recarga automática
npm run build       # compila a dist/
npm run start:prod  # corre lo compilado
npm test            # tests (Vitest)
npm run lint        # oxlint
```
