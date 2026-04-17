# FarmaRenovar — Descripción del sistema

## ¿Para qué sirve?

**FarmaRenovar** es una aplicación web interna para **gestionar y dar seguimiento a las renovaciones de tratamientos farmacológicos** en una cadena de farmacias. Su objetivo es centralizar la información de **pacientes**, **tratamientos activos** y **renovaciones**, y ofrecer un **panel de prioridades** según la proximidad al vencimiento del medicamento.

El personal de cada sucursal puede registrar datos, ver qué renovaciones están pendientes o ya fueron contactadas, y registrar cuando se renueva un tratamiento. Un **super administrador** puede ver todas las sucursales, administrar farmacias y consultar reportes globales.

**Importante:** la aplicación **no envía mensajes automáticos** (WhatsApp, SMS ni correo). El contacto con el paciente lo realiza la farmacia por sus propios medios; el sistema es un **dashboard de datos y seguimiento**.

---

## Usuarios y roles

| Rol | Alcance típico |
|-----|----------------|
| **empleado** | Pacientes y operaciones de su farmacia asignada. |
| **admin_sucursal** | Misma farmacia, con visibilidad ampliada según la configuración de la app. |
| **super_admin** | Todas las farmacias; gestión de sucursales y reportes globales. |

Los permisos se aplican en base de datos mediante **Row Level Security (RLS)** en Supabase: cada usuario solo accede a filas que le corresponden según su rol y `farmacia_id`.

---

## Módulos principales (pantallas)

- **Inicio de sesión** — Autenticación vía Supabase Auth (email/contraseña).
- **Dashboard** — Resumen por urgencia (vencidos, crítico, urgente, planificación), lista de renovaciones pendientes con filtros por nivel y por vista (no contactados / contactados / todos).
- **Pacientes** — Listado, alta de paciente (con primer tratamiento), ficha por paciente.
- **Tratamientos** — Vista de tratamientos activos.
- **Renovaciones** — Historial de renovaciones registradas.
- **Administración** — Farmacias (sucursales) y reportes (según rol).

---

## Qué información guarda el sistema

Los datos viven en **PostgreSQL** (Supabase). A grandes rasgos:

### Farmacias (`farmacias`)

Datos de cada sucursal: nombre, dirección, teléfono, ciudad, si está activa, fecha de creación.

### Empleados (`empleados`)

Perfil del usuario vinculado a **Supabase Auth** (`id` = `auth.users`): nombre, email, **rol**, **farmacia** asignada (puede ser nula para super admin), activo, fechas.

### Pacientes (`pacientes`)

- Identificación y contacto: nombre, teléfono, email (opcional).
- Ubicación y contexto: dirección, empresa, seguro médico (opcional).
- **Tipo de pago:** directo o reembolso (opcional).
- **Farmacia** a la que pertenece, **quién lo registró** (`registrado_por`), notas, activo, fechas.

### Tratamientos (`tratamientos`)

Cada línea representa un **medicamento en curso** asociado a un paciente:

- Medicamento (nombre), **marca** y **concentración** (opcionales, añadidas en migraciones posteriores).
- **Dosis diaria**, **unidades por caja**.
- **Fecha de surtido** y **fecha de vencimiento** (clave para alertas y listas de renovación).
- Tipo: **crónico** o **temporal**, activo/inactivo, notas.
- Quién lo registró y cuándo se creó.
- **Contactado para renovación** (`contactado_renovacion_en`): marca de fecha/hora si el equipo ya contactó al paciente respecto a esa renovación pendiente; se usa para filtrar la lista del dashboard.

### Renovaciones (`renovaciones`)

Registro de que un tratamiento fue **renovado** en la farmacia: tratamiento, farmacia, empleado, fecha, notas opcionales, fecha de creación del registro.

### Alertas enviadas (`alertas_enviadas`)

Estructura prevista para registrar **recordatorios** (tipo 7d / 3d / 1d, canal whatsapp / sms / email / interno), si fueron exitosos y respuesta de API. En la práctica actual del producto, el énfasis está en el seguimiento manual; esta tabla queda disponible si en el futuro se integran envíos o registros externos.

---

## Cómo se usa la información en el día a día

1. Se **dan de alta pacientes** y sus **tratamientos** con fechas de vencimiento.
2. El **dashboard** agrupa por días restantes: vencidos, crítico (hoy/mañana), urgente (unos días), planificación (ventana próxima).
3. El equipo puede **marcar** que ya **contactó** al paciente por una renovación pendiente, sin borrar el tratamiento.
4. Al **renovar**, se registra una **renovación** (y el flujo de la app puede actualizar o dar de alta el tratamiento según la pantalla de renovación).

---

## Tecnología

- **Frontend:** Next.js (App Router), React, Tailwind CSS, modo claro/oscuro.
- **Backend y datos:** Supabase (PostgreSQL, Auth, políticas RLS).
- **Despliegue:** típicamente Netlify o Vercel (según configuración del repo).

Modo desarrollo: puede usarse **datos simulados** (`NEXT_PUBLIC_USE_MOCK=true`) sin conectar Supabase real.

---

## Seguridad y privacidad

- Acceso solo con **usuario autenticado**; rutas protegidas por middleware.
- **RLS** en tablas sensibles: un empleado no ve pacientes ni tratamientos de otra farmacia salvo rol global.
- Las **claves de servicio** y variables sensibles deben estar solo en servidor / entorno seguro (no exponer `service_role` en el cliente).

---

## Documentación técnica adicional

- `README.md` — Setup, variables de entorno, deploy y estructura de carpetas.
- `supabase/migrations/` — Esquema SQL completo y cambios incrementales (campos extra, permisos de borrado, marca/concentración, contactado renovación).
- `src/types/index.ts` — Tipos TypeScript alineados con el modelo de datos.

---

*Documento generado para describir el propósito y el modelo de información de FarmaRenovar. Para el historial de cambios de producto, consultar `CHANGELOG.md` si está disponible en el repositorio.*
