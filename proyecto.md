# FarmaRenovar — Descripción del sistema (estado al día de hoy)

## ¿Para qué sirve?

**FarmaRenovar** es una aplicación web interna para **gestionar y dar seguimiento a las renovaciones de tratamientos farmacológicos** en una cadena de farmacias. Centraliza **pacientes**, **tratamientos activos**, **catálogo de medicamentos** y **renovaciones**, con un **panel de prioridades** según la proximidad al vencimiento del medicamento.

En la interfaz puede mostrarse el nombre comercial **«La Botica renovaciones»** (marca de la operación); el repositorio y el código siguen usando el identificador **FarmaRenovar**.

El personal de cada sucursal registra datos, prioriza renovaciones, marca contactos y registra despachos/renovaciones. Un **super administrador** ve todas las sucursales, gestiona farmacias, **usuarios (empleados vinculados a Auth)** y **reportes globales**. Perfiles **admin de sucursal** y **empleado** gestionan **medicamentos del catálogo** (no solo el super admin).

**Importante:** la aplicación **no envía mensajes automáticos** (WhatsApp, SMS ni correo). El contacto con el paciente lo hace la farmacia; el sistema es **dashboard de datos, facturación asociada y seguimiento**.

---

## Usuarios y roles

| Rol | Alcance típico |
|-----|----------------|
| **empleado** | Pacientes y operaciones de su farmacia asignada. |
| **admin_sucursal** | Misma farmacia; además **catálogo de medicamentos** (alta/edición en admin). |
| **super_admin** | Todas las farmacias; **sucursales**, **usuarios**, **reportes**; `farmacia_id` puede ser **null** (sin sede fija). |

Los permisos se aplican con **Row Level Security (RLS)** en Supabase. La gestión de **empleados** (insert/update con políticas restringidas) puede usar **clave de servicio** en servidor (`SUPABASE_SERVICE_ROLE_KEY`) solo donde la app lo define (p. ej. alta de usuario por super admin).

---

## Módulos y funcionalidades (pantallas)

### Autenticación y acceso

- **Login** (`/login`) — Email y contraseña (Supabase Auth); modo claro/oscuro; «Recordar sesión»; recuperación de contraseña; **último acceso** en badge (local); modal **contactar soporte**; campos de fecha con estilos coherentes en oscuro.
- **Sin acceso** (`/sin-acceso`) — Usuario autenticado pero **sin fila en `empleados`** o inactivo: mensaje y salida.
- **Middleware** — Rutas protegidas; excepciones típicas para login y callback de auth.

### Operación diaria

- **Panel principal** (`/dashboard`) — KPIs por bandas (vencidos, crítico, urgente, planificación); filtros por nivel y por vista (pendientes sin contacto / contactados / todos); **filtro por sucursal** (cookie) para super admin; tabla de renovaciones con **marcar contactado**; **desmarcar**; **marcado masivo**; **exportación CSV**; **vista previa de línea de tiempo** (tratamientos recientes + renovaciones del paciente).
- **Pacientes** (`/pacientes`) — Listado acotado a la farmacia del rol (o filtro global super admin).
- **Nuevo paciente** (`/pacientes/nuevo`) — Datos del paciente; **opción de primer tratamiento** con **combobox de medicamentos** (catálogo); **fecha de despacho (farmacia)** e **inicio de tratamiento (toma)** — inicio obligatorio y vacío por defecto si hay medicamento; **número de factura** y **monto total (CRC)** obligatorios si se registra medicamento; cálculo de **fecha de vencimiento** desde inicio de toma; **API opcional de persona** por cédula (`NEXT_PUBLIC_PERSONA_API_URL`) para precargar nombre.
- **Ficha paciente** (`/pacientes/[id]`) — Datos, notas editables; **tratamientos activos** e **historial de renovaciones** en secciones colapsables; prioridad por días restantes; **último despacho** e **inicio de toma**; **registrar renovación**; **marcar contactado**; métricas de puntualidad aproximadas; **eliminar paciente** (según permisos RLS).
- **Nuevo tratamiento** (`/pacientes/[id]/tratamiento/nuevo`) — Mismo esquema de fechas, factura, monto y catálogo; siempre se crea registro en **renovaciones** al guardar (despacho inicial con facturación obligatoria).
- **Renovar tratamiento** (`/pacientes/[id]/tratamiento/[id]/renovar`) — Actualiza tratamiento y registra renovación: medicamento del catálogo, dosis, unidades, **despacho**, **inicio de toma** (obligatorio, vacío por defecto), **regalía** opcional (unidades extra para cálculo de vencimiento), **factura y monto obligatorios**, notas.
- **Lista de tratamientos** (`/tratamientos`) — Vista global de activos con prioridad y enlace a ficha.
- **Renovaciones** (`/renovaciones`) — **Auditoría / timeline**: búsqueda, filtros por fecha/sucursal/usuario/tipo; severidad (tardía vs a tiempo); factura y monto cuando existan.

### Administración

- **Sucursales** (`/admin/farmacias`) — **Super admin**: CRUD de farmacias (alta, edición, **eliminación** en BD; sujeto a RLS y restricciones de integridad si existen).
- **Medicamentos** (`/admin/medicamentos`) — **Super admin y admin_sucursal**: catálogo (código, descripción, marca, concentración, activo); usado en combobox de recetas/tratamientos.
- **Usuarios** (`/admin/usuarios`) — **Solo super admin**: vincular usuarios de **Supabase Auth** con tabla **empleados** (rol, farmacia); operaciones sensibles con service role si está configurada.
- **Reportes** (`/admin/reportes`) — **Solo super admin**: analítica por rango, sucursal y tratamiento; tendencias e insights; **descarga de PDF** generada en el cliente (captura del panel con html2canvas + jsPDF).

### Cuenta

- **Perfil** y **Configuración** (`/cuenta/perfil`, `/cuenta/configuracion`) — Ajustes del usuario según lo implementado en la app.

---

## Modelo de datos (PostgreSQL / Supabase)

### Farmacias (`farmacias`)

Nombre, dirección, teléfono, ciudad, activa, fechas.

### Empleados (`empleados`)

Vinculados a **Auth** (`id` = `auth.users`): nombre, email, **rol**, **farmacia_id** (nullable para super admin), activo, fechas.

### Pacientes (`pacientes`)

Nombre, teléfono, email, dirección, empresa, **seguro médico**, **tipo de pago** (directo / reembolso), **farmacia_id**, **registrado_por**, notas, activo, fechas.

### Medicamentos (`medicamentos`)

Catálogo: código, descripción/nombre, marca, concentración, activo; referenciado por **tratamientos.medicamento_id**.

### Tratamientos (`tratamientos`)

Medicamento en curso por paciente: `medicamento_id` (catálogo), texto **medicamento**, marca, concentración, **dosis_diaria**, **unidades_caja**, **fecha_surtido** (fecha de despacho en farmacia), **fecha_inicio_tratamiento** (inicio real de la toma; **base del cálculo de vencimiento**), **fecha_vencimiento**, tipo crónico/temporal, notas, activo, **contactado_renovacion_en** (marca de contacto para el panel), auditoría de registro.

### Renovaciones (`renovaciones`)

Cada evento de despacho/renovación: tratamiento, farmacia, empleado, **fecha** (= fecha de despacho), **fecha_inicio_tratamiento**, notas, **numero_factura** y **monto_total_factura** (CRC) — **obligatorios en flujos nuevos** de alta de tratamiento, primer paciente con medicamento y renovación; **hubo_regalia** / **unidades_regalia** cuando aplica; enlazan facturación con el ciclo.

### Tabla eliminada

- **`alertas_enviadas`** — Retirada del esquema (migración `007`); no hay envíos automáticos ni cola interna de alertas en BD.

---

## Flujo operativo resumido

1. **Alta** de paciente y, si aplica, **primer tratamiento** con despacho, inicio de toma, factura y monto.
2. **Alta** de tratamientos adicionales o **renovación** del mismo: se recalcula vencimiento desde **inicio de toma** y unidades (± regalía).
3. **Dashboard** prioriza por **días hasta vencimiento**; el equipo **marca contactado** o exporta datos.
4. **Historial de renovaciones** y **auditoría** permiten trazabilidad por sucursal, usuario y factura.

---

## Tecnología

- **Frontend:** Next.js (App Router), React, Tailwind CSS, modo claro/oscuro, componentes cliente/servidor según ruta.
- **Backend y datos:** Supabase (PostgreSQL, Auth, RLS). Cliente anónimo en navegador; **service role** solo en rutas servidor explícitas.
- **Despliegue:** según `README` (p. ej. Netlify o Vercel).

**Desarrollo:** `NEXT_PUBLIC_USE_MOCK=true` permite **datos simulados** sin Supabase real.

---

## Seguridad y privacidad

- Acceso con **sesión autenticada**; rutas de aplicación protegidas.
- **RLS** por farmacia y rol; super admin con alcance global donde las políticas lo permiten.
- **No exponer** `SUPABASE_SERVICE_ROLE_KEY` en el cliente.

---

## Evolución del esquema (migraciones)

Referencia en `supabase/migrations/` (orden conceptual):

| Migración | Tema |
|-----------|------|
| `001` | Esquema inicial (farmacias, empleados, pacientes, tratamientos, renovaciones). |
| `002` | Campos extra en pacientes. |
| `003` | Permiso eliminar pacientes (RLS). |
| `004` | Marca y concentración en tratamientos. |
| `005` | `contactado_renovacion_en` en tratamientos. |
| `006` | Ajustes farmacias (sedes Costa Rica). |
| `007` | Eliminación tabla `alertas_enviadas`. |
| `008` | Regalía en renovaciones. |
| `009` | Catálogo `medicamentos` y `medicamento_id` en tratamientos. |
| `010` | Código y descripción en medicamentos. |
| `011` | `numero_factura` en renovaciones. |
| `013` | Factura solo en renovaciones (limpieza vs tratamientos). |
| `014` | RLS super admin sobre `empleados`. |
| `015` | `fecha_inicio_tratamiento` en tratamientos y renovaciones. |
| `016` | `monto_total_factura` en renovaciones. |

---

## Documentación técnica adicional

- `README.md` — Setup, variables de entorno, deploy, estructura.
- `supabase/migrations/` — Fuente de verdad del modelo SQL.
- `src/types/index.ts` — Tipos TypeScript alineados al dominio.
- `CHANGELOG.md` — Historial de cambios de producto, si se mantiene en el repo.

---

*Documento actualizado para describir el propósito, los módulos implementados y el modelo de información de FarmaRenovar a fecha de elaboración. Sirve como base para la **propuesta de desarrollo** y el alcance funcional acordado con negocio.*
