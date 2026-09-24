# 🪐 Orbitask

Mi agenda personal: **semana**, **tareas**, **hábitos**, **finanzas** y **deseos**.
Backend en **NestJS 12** con observabilidad de **[NestJS Observe](https://observe.nestjs.com)**, frontend en **Next.js 16 + shadcn/ui**, base de datos **MongoDB** en Docker.

```
orbitask/
├── backend/            API NestJS (puerto 3001)
├── frontend/           App Next.js (puerto 3000)
├── docs/               Guías paso a paso
└── docker-compose.yml  MongoDB local
```

## Arranque rápido

> ¿Primera vez? Seguí antes [docs/01-instalacion.md](docs/01-instalacion.md) (Docker, WSL, Compass…).

```bash
# 1. Base de datos
docker compose up -d

# 2. Backend  (terminal 1)
cd backend
npm install
#    → completá OBSERVE_APP_KEY / OBSERVE_APP_SECRET y tu contraseña en backend/.env
npm run start:dev

# 3. Frontend (terminal 2)
cd frontend
npm install
npm run dev
```

Abrí **http://localhost:3000** y entrá con `ADMIN_EMAIL` / `ADMIN_PASSWORD` del `backend/.env`.

## Secciones

| Sección | Qué hace |
|---|---|
| **Inicio** | Resumen del día: eventos, hábitos, tareas, balance del mes y tu próximo deseo |
| **Semana** | Calendario semanal por horas. Clic en un hueco para crear un evento |
| **Tareas** | Tablero Kanban con listas y drag & drop |
| **Hábitos** | Checklist semanal, rachas 🔥 y mapa de calor de los últimos 6 meses |
| **Finanzas** | Ingresos/gastos, gráfico diario, gastos por categoría y movimientos recurrentes |
| **Deseos** | Pegás un link y arma la tarjeta con foto, título y precio |

## Guías

1. [Instalación del entorno](docs/01-instalacion.md): Node, Docker, MongoDB, herramientas
2. [Cómo está hecho el backend](docs/02-backend.md): tour por NestJS con el código real
3. [NestJS Observe](docs/03-observe.md): qué mirar en el dashboard y el laboratorio de experimentos
4. [Cómo está hecho el frontend](docs/04-frontend.md): estructura, tema de colores y cómo agregar cosas

## Fondos de pantalla

Menú del usuario (abajo en el sidebar) → **Fondo de pantalla**. Hay 6 incluidos: Burbujas, Amatista, Fibra óptica, Gemas, Prisma y Spider-Verse.
Por defecto no hay imagen: se ve el degradado violeta. La elección se guarda en cada navegador.

Para sumar uno propio, ver [docs/04-frontend.md](docs/04-frontend.md#fondos-de-pantalla).
