# 05 · Orbitask en el celu

Orbitask es **una sola app responsive**: la misma URL y el mismo código. En pantallas angostas o táctiles (el celu) cambia la forma de usarla; en la compu todo queda como estaba.

## Qué cambia en el celu

| | |
|---|---|
| **Barra inferior** | Hoy · Semana · **+** · Tareas · Más. Hábitos, Finanzas y Deseos están en **Más**, con su dato del día. |
| **El +** | Un toque crea lo de la sección donde estás (en Finanzas un gasto, en Semana un evento…). En Hoy, o **manteniéndolo apretado**, muestra las 6 opciones. |
| **Hojas** | Todos los formularios suben desde abajo. Se cierran deslizando el asa hacia abajo o tocando afuera. Guardar queda siempre a mano, abajo. |
| **Gastos** | Teclado numérico propio (con coma), categorías con un toque y la fecha con "Hoy / Ayer". |
| **Semana** | Un día a la vez: deslizá la agenda para pasar de día y la tira de arriba para pasar de semana. Tocá un hueco para agendar. Arriba a la derecha: vista **Lista**. |
| **Tareas** | Una lista por pestaña. Deslizá una tarea **→** para completarla, **←** para Mover o Borrar (con Deshacer). La manija ⋮⋮ reordena. El campo de abajo agrega tareas en ráfaga. |
| **Hábitos** | Check grande para hoy; la tira de la semana corrige días anteriores. Si completás todos los del día, hay festejo 🎉. |
| **Finanzas** | Balance del mes arriba. Tocá o deslizá el dedo sobre el gráfico para ver cada día. Los movimientos se deslizan para borrar. |
| **Deseos** | Copiá un link en la app de la tienda y tocá **Pegar**. En Android también podés compartir el link directo a Orbitask. |

## 1. Probarla en el celu (misma Wi-Fi)

Con todo corriendo como siempre (`docker compose up -d`, backend y `npm run dev`), la terminal del frontend muestra algo así:

```
- Network:  http://192.168.0.17:3000
```

Abrí esa dirección en Safari del iPhone. `next.config.ts` ya habilita las IPs de tu PC para el modo desarrollo.

> En modo desarrollo aparece una **N** abajo a la izquierda (el indicador de Next). En modo producción no está.

## 2. Usarla desde cualquier lado con Tailscale

[Tailscale](https://tailscale.com) arma una red privada entre tus dispositivos: el iPhone llega a tu PC desde cualquier lugar (datos móviles incluidos) sin exponer nada a internet, y con **HTTPS**. Es gratis para uso personal.

1. Instalá Tailscale en la **PC** (tailscale.com/download) y en el **iPhone** (App Store). Iniciá sesión con la **misma cuenta** en los dos.
2. En el [panel de Tailscale](https://login.tailscale.com/admin/dns) → **DNS**: activá **MagicDNS** y **HTTPS Certificates**.
3. En la PC, con el frontend corriendo en el puerto 3000:
   ```powershell
   tailscale serve --bg 3000
   ```
   Te muestra tu dirección, por ejemplo `https://mi-pc.tail1234.ts.net`.
4. En el iPhone, con Tailscale conectado, abrí esa dirección en Safari.

La PC tiene que estar prendida (y Mongo, backend y frontend corriendo). Para dejar de compartirla: `tailscale serve reset`.

## 3. Instalarla como app en el iPhone

1. Abrila en **Safari**.
2. Botón **Compartir** (el cuadrado con la flecha) → **Agregar a inicio** → **Agregar**.

Queda como un ícono más: abre a pantalla completa, con pantalla de arranque oscura y sin barra del navegador. En Android: menú ⋮ → **Instalar app**. Mantener apretado el ícono muestra accesos directos (Nuevo gasto, Nueva tarea, Nuevo evento).

## 4. Para el día a día: modo producción

Es bastante más rápido que el modo desarrollo, sobre todo en el celu.

```bash
# backend (terminal 1)
cd backend
npm run build
npm run start:prod

# frontend (terminal 2)
cd frontend
npm run build
npm run start
```

## Cómo está hecho

| Archivo | Qué hace |
|---|---|
| [`app/manifest.ts`](../frontend/src/app/manifest.ts) | Manifest de la PWA: nombre, íconos, accesos directos y "compartir a Orbitask". |
| [`app/layout.tsx`](../frontend/src/app/layout.tsx) | `viewport` (pantalla completa detrás del notch) y datos de app de iOS con las pantallas de arranque ([`lib/splash-screens.json`](../frontend/src/lib/splash-screens.json)). |
| [`app/globals.css`](../frontend/src/app/globals.css) | Variante **`touch:`** (pantallas táctiles), `pt-safe`/`pb-safe`, `pressable`, vidrio más liviano en el celu y animaciones entre pestañas. |
| [`components/ui/dialog.tsx`](../frontend/src/components/ui/dialog.tsx) | En el celu, **cualquier** `DialogContent` se muestra como hoja inferior (asa, pie fijo, se acomoda al teclado). `useSheetMode()` dice si está en ese modo. |
| [`components/mobile/`](../frontend/src/components/mobile/) | Barra inferior, hojas **Crear** y **Más**, filas deslizables y `MobileProvider` (el + y los formularios de captura rápida). |
| [`components/form/`](../frontend/src/components/form/) | Piezas de formulario táctiles: chips, atajos de fecha y el pie con Guardar/Eliminar. |
| [`hooks/use-viewport-vars.ts`](../frontend/src/hooks/use-viewport-vars.ts) | Mide el teclado del iPhone (`--keyboard-inset`, `data-keyboard="open"`) para que hojas y barras queden por encima. |
| [`lib/persist.ts`](../frontend/src/lib/persist.ts) | Guarda los últimos datos en el dispositivo: la app abre al instante y se refresca sola. Se borra al cerrar sesión. |

Los íconos, las pantallas de arranque y los fondos verticales (`public/backgrounds/<id>-mobile.webp`) se generaron con `sharp` a partir de `app/icon.svg` y de los fondos originales. Si sumás un fondo nuevo, agregá también su versión `-mobile.webp` (recorte vertical 9:16 del centro).

## Reglas para lo que agregues

- **Tamaños:** usá los componentes de `components/ui` (ya miden 44 px en táctil). Si hacés un botón propio, sumale `touch:h-11` o similar y `pressable`.
- **Nada de hover para mostrar cosas:** en el celu no existe. Si algo aparece con `group-hover`, tiene que estar en otro lado (un formulario, un menú, una fila deslizable).
- **Nada más ancho que la pantalla:** nada de `min-w-[…]` grandes ni grillas de muchas columnas; en el celu, una columna.
- **Formularios en `Dialog`:** se vuelven hoja solos. Usá `FormFooter` para el pie y `autoFocus` solo al crear (al editar, el teclado no tiene que abrirse solo).
- **Montos:** `inputMode="decimal"` y `parseAmount()` de `lib/format.ts` (acepta "4.500,50").
- **Página nueva:** envolvé el contenido en `<PageTransition>` y, si el + tiene que crear algo ahí, sumala a `CREATE_BY_ROUTE` en [`components/mobile/tabs.ts`](../frontend/src/components/mobile/tabs.ts).
