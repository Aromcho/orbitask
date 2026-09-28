# 04 · Cómo está hecho el frontend

**Next.js 16** (App Router) + **shadcn/ui** (base Radix, preset Nova) + **Tailwind 4** + **TanStack Query**.

## Estructura

```
frontend/src/
├── proxy.ts                 Si no hay cookie de sesión → /login  (en Next 16 "middleware" se llama "proxy")
├── app/
│   ├── layout.tsx           Fuentes, fondo y providers
│   ├── globals.css          🎨 Tema de colores (claro y oscuro)
│   ├── login/page.tsx
│   └── (app)/               Todo lo que va con sidebar
│       ├── layout.tsx
│       ├── page.tsx         Inicio
│       ├── semana/  tareas/  habitos/  finanzas/  deseos/
├── components/
│   ├── ui/                  Componentes de shadcn (se agregan con `npx shadcn add …`)
│   ├── week/  tasks/  habits/  finance/  wishlist/   Componentes de cada sección
│   ├── mobile/              Barra inferior, el +, menú Más y filas deslizables (ver 05-mobile.md)
│   ├── form/                Chips, atajos de fecha y pie de formulario
│   └── app-sidebar.tsx, page-header.tsx, confirm-dialog.tsx…
└── lib/
    ├── api.ts               fetch al backend + manejo de errores
    ├── types.ts             Tipos de lo que devuelve la API
    ├── format.ts            Fechas y plata (es-AR)
    ├── constants.ts         Categorías de eventos, prioridades, paleta
    └── queries/             Hooks de TanStack Query por sección
```

## Cómo habla con el backend

El navegador **siempre** pide a `/api/...` en el mismo dominio, y Next lo reenvía al backend ([`next.config.ts`](../frontend/next.config.ts)):

```ts
rewrites: [{ source: "/api/:path*", destination: "http://localhost:3001/api/:path*" }]
```

Así la cookie de sesión es del mismo sitio y no hay que pelearse con CORS.

Los datos se piden con hooks de [`lib/queries/`](../frontend/src/lib/queries/):

```tsx
const { data: tasks = [] } = useTasks();   // cachea, reintenta, refresca
const update = useUpdateTask();            // mutación: al terminar refresca la lista y avisa errores con un toast
update.mutate({ id, done: true });
```

Los hábitos y el tablero de tareas usan **actualizaciones optimistas**: la UI cambia al instante y, si el backend falla, vuelve atrás.

## Tema y colores

Todos los colores están en [`globals.css`](../frontend/src/app/globals.css) como variables (`:root` para claro, `.dark` para oscuro).
Arranca en oscuro. Se cambia desde el menú del usuario, abajo en el sidebar (en el celu, desde **Más**).

| Token | Oscuro | Uso |
|---|---|---|
| `--background` | `#0B0D17` | Fondo base |
| `--card` | `rgb(20 22 38 / .72)` | Tarjetas de vidrio (con blur) |
| `--primary` | `#8B7CF6` | Violeta: botones, selección |
| `--income` | `#2DD4BF` | Ingresos |
| `--expense` | `#FB7185` | Gastos, borrar |
| `--streak` | `#FBBF24` | Rachas 🔥 |
| `--event` | `#38BDF8` | Calendario |

Se usan como clases de Tailwind: `bg-primary`, `text-income`, `bg-expense/15`…

## Fondos de pantalla

Se eligen desde el menú del usuario → **Fondo de pantalla**. Por defecto: **Sin fondo** (solo el degradado).
La elección se guarda en el `localStorage` del navegador; un script en el `<head>` la aplica antes de pintar la página, así no parpadea.

| Archivo | Qué hace |
|---|---|
| `public/backgrounds/<id>.webp` | La imagen (2560 px de ancho, WebP calidad 80, ~200-600 KB) |
| `public/backgrounds/<id>-thumb.webp` | Miniatura 400×225 para el selector |
| [`lib/background.ts`](../frontend/src/lib/background.ts) | La lista `BACKGROUNDS` y el script inicial |
| [`lib/use-background.ts`](../frontend/src/lib/use-background.ts) | Hook `useBackground()` para leer y cambiar el fondo |
| [`components/background-picker.tsx`](../frontend/src/components/background-picker.tsx) | El diálogo con la grilla |

**Sumar un fondo nuevo:** creá los dos archivos `.webp` (no subas PNGs de 20 MB: la app se pone lenta) y agregá
`{ id: "mi-fondo", label: "Mi fondo" }` a `BACKGROUNDS`. Si la imagen es **clara**, sumale `light: true`: en modo oscuro se le pone
una capa más oscura encima (`.dark[data-bg-tone="light"]` en `globals.css`) para que el texto se lea.

## Agregar una sección nueva (receta)

1. **Backend:** `nest g resource notas`, y armá el schema y los DTOs igual que en las otras secciones.
2. **Tipos:** agregá la interfaz en `lib/types.ts`.
3. **Hooks:** creá `lib/queries/notas.ts` copiando el patrón de `wishlist.ts`.
4. **Página:** `app/(app)/notas/page.tsx` con `<PageTransition>` + `<PageHeader>` + tus componentes. Revisá las [reglas para el celu](05-mobile.md#reglas-para-lo-que-agregues).
5. **Menú:** sumá la entrada en `NAV` dentro de `components/app-sidebar.tsx` (ícono de [lucide.dev](https://lucide.dev)) y, para el celu, en `MORE_SECTIONS` de `components/mobile/tabs.ts` más su tarjeta en `components/mobile/more-sheet.tsx`.
6. ¿Necesitás un componente de UI? `npx shadcn@latest add <nombre>` (lista en [ui.shadcn.com](https://ui.shadcn.com/docs/components)).

## Comandos

```bash
npm run dev     # desarrollo (http://localhost:3000)
npm run build   # build de producción
npm run lint    # ESLint
```
