# Backend — API + Prisma + Supabase

El front (plataforma-mj) se comunica con este backend; el backend habla con Supabase (Auth + Postgres vía Prisma).

## Estructura (control y claridad)

```
back/
├── config/           # Env y configuración
│   └── index.js
├── lib/              # Prisma client
│   └── prisma.js
├── services/         # Lógica de negocio (qué pasa, cómo pasa)
│   ├── supabase.service.js   # Cliente Supabase (Auth)
│   ├── auth.service.js       # login, getUserFromToken, checkConnection
│   └── admin.service.js      # listAdmins (Prisma)
├── routes/           # HTTP → servicios
│   ├── health.routes.js
│   ├── auth.routes.js
│   └── admin.routes.js
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── server.js         # Express + CORS + montaje de rutas
└── package.json
```

- **config**: una sola fuente de verdad para `PORT`, `FRONT_ORIGIN`, Supabase URL/key.
- **services**: llaman a Prisma o Supabase; las rutas no tocan la DB ni Supabase directamente.
- **routes**: validan body/headers y delegan en servicios; devuelven JSON y códigos HTTP.

## Setup

```bash
cd back
cp .env.example .env
# Rellena .env: SUPABASE_URL, SUPABASE_ANON_KEY, DATABASE_URL, DIRECT_URL
npm install
```

## Prisma (migraciones y datos)

```bash
npx prisma migrate dev   # crea/aplica migraciones
npx prisma generate      # regenera el cliente
npx prisma studio        # UI para la DB (opcional)
```

El schema está en `prisma/schema.prisma`. La URL para migraciones se toma de `DIRECT_URL` en `prisma.config.ts`.

## Uso

```bash
npm run dev   # con --watch
# o
npm start
```

## Crear usuario administrador

**Opción A — Script (desde la raíz de back/, con .env cargado):**

```bash
cd back
CREATE_ADMIN_EMAIL=jrodriguez@mjnewellhomes.com CREATE_ADMIN_PASSWORD="tu-password" node scripts/create-admin.js
```

Crea el usuario en Supabase Auth y un registro en la tabla Admin. Requiere registro por email/contraseña habilitado en Supabase (Authentication → Providers).

**Opción B — Dashboard Supabase:**  
Authentication → Users → Add user → introduce email y contraseña. Luego, para tener el admin en tu tabla Admin, ejecuta el script solo para ese email (creará el registro en Prisma) o inserta a mano en la tabla `Admin`.

## Rutas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /health | Estado del servidor |
| GET | /supabase-check | Prueba conexión Supabase Auth |
| POST | /api/auth/login | Login (email, password) → devuelve access_token y user |
| GET | /api/auth/me | Usuario actual (Bearer o cookie sb-access-token) |
| GET | /api/admins | Lista admins (Prisma) |
