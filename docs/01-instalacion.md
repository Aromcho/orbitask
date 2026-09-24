# 01 · Instalación del entorno (Windows 11)

Lo que ya tenés instalado: **Node 24** ✅ y **Git** ✅.
Te falta: **WSL 2**, **Docker Desktop** y (recomendado) **MongoDB Compass**.

---

## 1. WSL 2 (Subsistema de Windows para Linux)

Docker en Windows corre sobre WSL 2, así que va primero.

1. Abrí **PowerShell como administrador** (clic derecho en Inicio → *Terminal (Administrador)*).
2. Ejecutá:
   ```powershell
   wsl --install
   ```
3. **Reiniciá la PC** cuando termine.
4. Al volver puede abrirse una ventana de Ubuntu pidiendo usuario y contraseña de Linux: elegí cualquiera (no tiene que ser la de Windows).
5. Verificá:
   ```powershell
   wsl --status
   ```
   Tiene que decir *Versión predeterminada: 2*.

> Si dice que la virtualización está deshabilitada: entrá a la BIOS y activá **Intel VT-x** o **AMD-V / SVM**.

## 2. Docker Desktop

1. Descargalo de **https://www.docker.com/products/docker-desktop/** → *Download for Windows – AMD64*.
2. Instalalo dejando tildado **"Use WSL 2 instead of Hyper-V"**.
3. Reiniciá si te lo pide y abrí **Docker Desktop**. Aceptá los términos. Podés saltear el login (no hace falta cuenta).
4. Esperá a que abajo a la izquierda diga **Engine running** 🟢.
5. En una terminal nueva:
   ```bash
   docker --version
   docker compose version
   docker run --rm hello-world
   ```
   Si ves *Hello from Docker!* está todo OK.

> 💡 En *Settings → General* podés tildar **"Start Docker Desktop when you sign in"** para que arranque solo.

### ¿Qué es Docker y por qué lo usamos?

Docker corre programas dentro de **contenedores**: cajas aisladas que traen todo lo que necesitan.
En vez de instalar MongoDB en Windows, bajamos la **imagen** oficial `mongo:8` y la corremos en un contenedor.
Todo está descrito en [`docker-compose.yml`](../docker-compose.yml), así que la base de datos es idéntica en tu PC y en producción.

## 3. Levantar MongoDB

Desde la carpeta `orbitask/`:

```bash
docker compose up -d          # -d = en segundo plano
docker compose ps             # tiene que figurar orbitask-mongo como "healthy"
```

Comandos útiles:

| Comando | Qué hace |
|---|---|
| `docker compose up -d` | Levanta Mongo |
| `docker compose stop` | Lo apaga (los datos quedan) |
| `docker compose logs -f mongo` | Ver los logs en vivo |
| `docker compose down -v` | ⚠️ Borra el contenedor **y todos los datos** |

Los datos viven en un **volumen** de Docker (`orbitask_mongo-data`), así que sobreviven a reinicios.

## 4. MongoDB Compass (para ver la base con interfaz gráfica)

1. Descargalo de **https://www.mongodb.com/try/download/compass**.
2. Conectate con:
   ```
   mongodb://orbitask:orbitask@localhost:27017/?authSource=admin
   ```
3. Vas a ver la base **`orbitask`** con sus colecciones (`tasks`, `habits`, `transactions`…).

## 5. Nest CLI (opcional, pero útil)

El backend ya está creado; la CLI sirve para generar código nuevo:

```bash
npm install -g @nestjs/cli
nest --version
```

Por ejemplo, para crear un módulo nuevo más adelante:

```bash
cd backend
nest g resource notas --no-spec   # módulo + controller + service + DTOs
```

## 6. Configurar el backend

Editá `backend/.env` (ya está creado con un `JWT_SECRET` aleatorio):

```ini
ADMIN_EMAIL=barriosarom@gmail.com
ADMIN_PASSWORD=una-contraseña-tuya     # ← cambiala ANTES del primer arranque
OBSERVE_APP_KEY=...                    # ← de observe.nestjs.com
OBSERVE_APP_SECRET=...
```

> El usuario se crea **solo la primera vez** que arranca la API con la base vacía.
> Si querés cambiar la contraseña después, borrá la colección `users` en Compass y reiniciá la API.

## 7. Arrancar todo

```bash
# Terminal 1
cd backend
npm install
npm run start:dev      # modo watch: se reinicia al guardar

# Terminal 2
cd frontend
npm install
npm run dev
```

- API: http://localhost:3001/api/health → `{"status":"ok","database":"up"}`
- App: http://localhost:3000

## 8. Extensiones de VS Code recomendadas

- **ESLint** y **Prettier**: formato y errores
- **Tailwind CSS IntelliSense**: autocompletado de clases
- **MongoDB for VS Code**: explorar la base sin salir del editor
- **REST Client** o **Thunder Client**: probar la API

## Problemas comunes

| Síntoma | Solución |
|---|---|
| `Configuration key "OBSERVE_APP_KEY" does not exist` | Falta la línea en `backend/.env` (copiala de `.env.example`) |
| La app anda pero en Observe no aparece nada | Las keys están vacías o mal copiadas (el colector responde 401 y descarta los datos). Revisalas y reiniciá la API |
| `MongooseServerSelectionError: connect ECONNREFUSED` | Mongo no está corriendo: `docker compose up -d` |
| `docker: command not found` | Abrí una terminal nueva después de instalar Docker |
| Puerto 3000/3001 ocupado | Cerrá la otra app o cambiá `PORT` en `.env` |
| Login dice "Email o contraseña incorrectos" | La contraseña es la que estaba en `.env` en el **primer** arranque |
