# 💊 FarmaRenovar — Guía para el Desarrollador

Sistema interno de gestión de renovaciones de tratamientos para una cadena de farmacias.

## Stack

- **Frontend:** Next.js 16 (App Router) + Tailwind CSS + modo oscuro
- **Backend/DB:** Supabase (PostgreSQL + Auth + RLS)
- **Hosting:** Netlify (principal) o Vercel

El sistema **no envía mensajes automáticos** (WhatsApp, SMS ni email). El cliente gestiona el contacto con los pacientes por su cuenta; la app es solo un dashboard de datos y seguimiento.

---

## 🚀 Setup inicial (en orden)

### 1. Instalar dependencias

```bash
npm install
```

### 2. Modo desarrollo sin Supabase (mock)

Para levantar el proyecto **sin configurar Supabase** (datos simulados):

- En `.env.local` deja o pon: `NEXT_PUBLIC_USE_MOCK=true`
- Ejecuta `npm run dev` y abre http://localhost:3000  
- No necesitas credenciales de Supabase. El login redirige directo al dashboard con usuario mock.

### 3. Modo producción (Supabase real)

Cuando quieras conectar a Supabase:

1. Crear proyecto en [supabase.com](https://supabase.com) → New project  
2. Copiar **Project URL** y las dos API Keys (anon + service_role).

### 4. Variables de entorno

1. Copia `.env.example` a **`.env.local`** (Next.js carga `.env.local` en local; ese archivo **no** debe versionarse).
2. Rellena con los valores de tu proyecto Supabase (Settings → API). **No** subas `.env`, `.env.local` ni pegues la `service_role` en código o en issues de GitHub.

```env
# SUPABASE
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# Para producción:
NEXT_PUBLIC_USE_MOCK=false
```

### 5. Ejecutar la base de datos

En el **SQL Editor de Supabase**, ejecutar el archivo completo:

```
supabase/migrations/001_schema_inicial.sql
```

Crea tablas, índices, políticas RLS y las 16 farmacias iniciales.

### 6. Crear el primer Super Admin

En Supabase → Authentication → Users → Add user (email + contraseña).  
Luego en SQL Editor:

```sql
INSERT INTO empleados (id, nombre, email, rol, farmacia_id)
VALUES (
  'UUID_DEL_USUARIO_CREADO',  -- el id que aparece en Auth
  'Administrador General',
  'admin@tuempresa.com',
  'super_admin',
  NULL
);
```

### 7. Correr en desarrollo

```bash
npm run dev
# Abre http://localhost:3000
```

Si aparece *"Port in use"* o *"Unable to acquire lock"*, ver la sección **Soporte** al final o `comandos.log`.

---

## 📁 Estructura del proyecto

```
farmarenovar/
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout + ThemeProvider + Toaster
│   │   ├── page.tsx                   # Redirección / → /dashboard
│   │   ├── globals.css                # Estilos globales + dark mode
│   │   ├── login/page.tsx             # Login
│   │   ├── (app)/                     # Route group (no afecta la URL)
│   │   │   ├── layout.tsx            # Layout compartido: Sidebar + Header
│   │   │   ├── dashboard/page.tsx    # Panel principal
│   │   │   ├── pacientes/
│   │   │   │   ├── page.tsx          # Lista de pacientes
│   │   │   │   ├── nuevo/page.tsx    # Registrar paciente + 1er tratamiento
│   │   │   │   └── [id]/page.tsx    # Ficha del paciente
│   │   │   ├── tratamientos/page.tsx # Tratamientos activos
│   │   │   ├── renovaciones/page.tsx # Historial de renovaciones
│   │   │   └── admin/
│   │   │       ├── farmacias/page.tsx # Sucursales
│   │   │       └── reportes/page.tsx  # Reportes globales
│   ├── components/layout/
│   │   ├── Sidebar.tsx               # Navegación lateral por rol
│   │   ├── Header.tsx                # Barra superior: Home + modo oscuro
│   │   └── ThemeProvider.tsx         # Contexto tema claro/oscuro
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # Cliente browser
│   │   │   └── server.ts             # Cliente server + service role
│   │   ├── mock/
│   │   │   ├── data.ts               # Datos mock (modo desarrollo)
│   │   │   └── supabase-mock.ts      # Cliente Supabase simulado
│   │   └── utils/
│   │       └── index.ts              # Fechas, urgencia, formateo
│   ├── types/index.ts                # Tipos TypeScript
│   └── middleware.ts                 # Protección de rutas
├── supabase/migrations/
│   └── 001_schema_inicial.sql        # Schema + datos iniciales
├── netlify.toml                      # Config Netlify + plugin Next.js
├── vercel.json                       # Config mínima (opcional para Vercel)
├── comandos.log                      # Comandos y arquitectura
├── CHANGELOG.md                      # Historial de cambios
└── package.json
```

---

## 👥 Roles y permisos

| Rol              | Ve                    | Puede hacer                                                                 |
|------------------|------------------------|-----------------------------------------------------------------------------|
| `empleado`       | Pacientes de su farmacia | Registrar pacientes, tratamientos, renovaciones                           |
| `admin_sucursal` | Todo de su farmacia   | Mismo que empleado + visibilidad ampliada                                   |
| `super_admin`    | Todas las farmacias    | + Reportes globales, sucursales                                             |

Los permisos se aplican con **Row Level Security (RLS)** en Supabase.

---

## 🌐 Deploy

### Netlify (recomendado)

1. Conectar el repo en [netlify.com](https://netlify.com) → Add new site → Import from Git.
2. Build command: `npm run build` (ya viene en `netlify.toml`).
3. En **Site settings → Environment variables** agregar las variables de Supabase y `NEXT_PUBLIC_USE_MOCK=false`.
4. Deploy.

Desde CLI:

```bash
npx netlify-cli login
npx netlify-cli init
npx netlify-cli deploy --prod
```

### Vercel (alternativa)

1. Conectar el repo en [vercel.com](https://vercel.com) → Import.
2. Añadir las variables de entorno (Supabase y `NEXT_PUBLIC_USE_MOCK=false`).

---

## 🆘 Soporte / Preguntas frecuentes

**Puerto 3000 en uso o "Unable to acquire lock"**  
Hay otra instancia de `next dev`. Detener procesos Node y borrar cache:

```powershell
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run dev
```

Más comandos en `comandos.log`.

**¿Cómo agrego una nueva farmacia?**  
Desde `/admin/farmacias` o con un INSERT en la tabla `farmacias` en Supabase.

**Arquitectura y comandos**  
Diagrama y lista de comandos en `comandos.log`. Changelog en `CHANGELOG.md`.
