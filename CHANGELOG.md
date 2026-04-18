# Changelog — FarmaRenovar

Todos los cambios relevantes del proyecto se documentan en este archivo.

---

## [0.12.0] — 2026-04-16

### Catálogo de medicamentos (admin), reportes (UI), ficha y tratamientos (prioridad y colores), tema oscuro

#### Admin — medicamentos: alta, búsqueda, import masivo opcional

- **`supabase/migrations/009_medicamentos_catalogo.sql`** y **`010_medicamentos_codigo_descripcion.sql`** — Catálogo `medicamentos` con `codigo`, `descripcion` (y `nombre` ampliado donde aplique) para alinear inventario/receta con el resto de la app.
- **`src/lib/medicamentos-admin-query.ts`** — `fetchMedicamentosAdminList`: listado con filtros `q` (búsqueda servidor) y activos/inactivos.
- **`src/app/(app)/admin/medicamentos/page.tsx`** — Conteos exactos (`count: 'exact'`), lectura de `searchParams` (`q`, `solo`), `Suspense` + cliente; eliminado el párrafo redundante sobre formato Excel en cabecera.
- **`src/app/(app)/admin/medicamentos/MedicamentosAdminCliente.tsx`** — Formulario fijo **Agregar medicamento** (código + descripción + registrar/limpiar), cabecera **colapsable** con hover/focus; búsqueda con debounce hacia la URL; tabla con altura acotada y scroll; modal solo para **editar**; activar/desactivar filas.
- **`src/app/(app)/admin/medicamentos/actions.ts`** — `crearMedicamento`, `actualizarMedicamento`, **`importarMedicamentosDesdeTexto`** (carga masiva por texto TSV).
- **`src/lib/medicamentos-import.ts`** — `parseMedicamentosPegado` y utilidades de etiquetado para import y recetas.

##### Cómo volver a mostrar la importación masiva (Excel / pegado)

1. Abre **`src/app/(app)/admin/medicamentos/MedicamentosAdminCliente.tsx`**.
2. Arriba del componente, localiza la constante **`MOSTRAR_SECCION_IMPORT_MASIVO`** (por defecto `false`).
3. Cámbiala a **`true`**, guarda el archivo y recarga **`/admin/medicamentos`**.
4. Aparecerá la sección **«Importación masiva (Excel)»**: pega filas con **MED-… + tabulador + descripción** (copiado desde Excel como TSV) y pulsa **Importar al catálogo**. La server action omite duplicados por código o descripción ya existente.
5. Cuando termines, vuelve a poner **`false`** si no quieres que el panel quede visible para el resto de usuarios.

#### Reportes globales — filtros y tema oscuro

- **`src/app/(app)/admin/reportes/ReportesGlobalesCliente.tsx`** — Contenedor sticky de filtros con **esquinas redondeadas** (`rounded-2xl`) y borde/sombra alineados al resto de la app; bloque interior de filtros con el mismo criterio; campos de fecha/select con `rounded-xl`.
- **`src/app/globals.css`** — En `html.dark`: **`color-scheme: dark`** en `input[type=date]` y `select`; icono del calendario (**`::-webkit-calendar-picker-indicator`**) forzado a tono claro con `brightness(0) invert(1)` para que sea visible sobre fondo oscuro.

#### Ficha del paciente

- **`src/app/(app)/pacientes/[id]/page.tsx`** — Barra de estado: leyendas **Estable — Seguimiento — Crítico** de izquierda a derecha acorde al semáforo; **«Riesgo renovación»** renombrado a **«Necesidad de renovación»**; chips de tratamiento activo con textos **Planificación** (6–15 días) y **Al día** (16+); colores de pastilla alineados a los KPI del panel (ver más abajo).

#### Prioridad y colores unificados (dashboard + tratamientos + utilidades)

- **`src/lib/utils/index.ts`** — **`etiquetaPrioridadPanelPrincipal`**: mismas palabras que el panel (vencidos textuales, Crítico, Urgente, Planificación 6–15, Al día 16+). **`clasesColorBadgeKpiPanelRenovaciones`**: fondo/borde/texto alineados a los **cuatro KPI** del dashboard (rojo, naranja, amarillo, teal) más **esmeralda** para «Al día».
- **`src/app/(app)/dashboard/page.tsx`** — Badges de la tabla de renovaciones usan esas clases compartidas.
- **`src/app/(app)/tratamientos/TratamientosListaCliente.tsx`** — Etiquetas de prioridad con **`etiquetaPrioridadPanelPrincipal`**; pastillas y borde lateral de fila con los **mismos colores** que los KPI; columna «días» coherente con esa paleta.

---

## [0.11.0] — 2026-02-18

### Reportes globales: pacientes por aseguradora y descarga en PDF

#### Reporte: pacientes por aseguradora (conteo)

- **`src/app/(app)/admin/reportes/page.tsx`** — Nuevo bloque **"🩺 Pacientes por aseguradora"** que agrupa pacientes activos por `seguro_medico` (valor vacío o null se muestra como "Sin seguro"). Se muestra el total por aseguradora con barra de progreso turquesa y se ordena de mayor a menor cantidad.

#### Reporte: listado de nombres por aseguradora

- **`src/app/(app)/admin/reportes/page.tsx`** — Nuevo bloque **"📋 Listado de pacientes por aseguradora"**: por cada aseguradora se muestra el nombre de la aseguradora, el número de pacientes y la lista de nombres de pacientes ordenada alfabéticamente, en columnas responsivas (1/2/3 columnas según ancho). Las aseguradoras se ordenan de mayor a menor cantidad de pacientes.

#### Descarga del reporte en PDF

- **Dependencias:** `jspdf` y `html2canvas` añadidos al proyecto para generar PDF desde el contenido del reporte.
- **`src/app/(app)/admin/reportes/BotonDescargarReportePdf.tsx`** — Componente cliente con botón **"Descargar PDF"** (icono FileDown). Al hacer clic se captura el bloque con `id="reporte-global-pdf"` mediante html2canvas, se genera un PDF A4 (varias páginas si el contenido es largo) y se descarga con nombre `reportes-globales-YYYY-MM-DD.pdf`. Incluye título "Reportes globales — FarmaRenovar", fecha de generación, tarjetas de resumen, pacientes por aseguradora (conteo), listado de pacientes por aseguradora y pacientes por sucursal.

---

## [0.10.0] — 2026-02-18

### Marcar contactado en renovaciones, umbrales de urgencia, seguro desplegable, UI dashboard y sidebar

#### Marcar como contactado en renovaciones pendientes

- **`supabase/migrations/005_contactado_renovacion.sql`** — Columna `contactado_renovacion_en` (timestamptz, nullable) en `tratamientos`. Si tiene valor, el ítem se considera ya contactado y por defecto no aparece en la lista de pendientes.
- **`src/app/(app)/dashboard/actions.ts`** — Server Actions `marcarContactadoRenovacion(tratamientoId)` y `desmarcarContactadoRenovacion(tratamientoId)` que actualizan la columna y revalidan `/dashboard`.
- **`src/app/(app)/dashboard/page.tsx`** — Filtro **Ver:** No contactados (por defecto) / Contactados / Todos. Cada línea tiene botón **"Marcar contactado"** o **"Desmarcar"** y enlace "Ver ficha". Las estadísticas (tarjetas) cuentan solo no contactados.
- **`src/app/(app)/dashboard/BotonContactadoRenovacion.tsx`** — Componente cliente para el botón que llama a la action y refresca la página.

#### Umbrales de urgencia: 5 y 15 días

- **`src/lib/utils/index.ts`** — `getNivelUrgencia`: crítico ≤1 día, urgente ≤5 días (antes 3), temprano ≤15 días (antes 7). `etiquetasUrgencia`: "🟠 5 días", "🟡 15 días".
- **`src/app/(app)/dashboard/page.tsx`** — Conteos: urgentes 2–5 días, próximos 6–15 días. Textos de tarjetas actualizados.
- **`src/app/(app)/tratamientos/page.tsx`** — Colores de la columna "Días rest." alineados a 5 y 15 días.
- **`src/types/index.ts`** — Comentario `alertas_urgentes` actualizado a "5 días".

#### Seguro médico: menú desplegable en nuevo paciente

- **`src/app/(app)/pacientes/nuevo/page.tsx`** — El campo "Seguro médico" pasó de input de texto a `<select>` con opciones fijas: INS, Pan American Life Insurance, ASSA, BMI, MAPFRE, Mediprocesos, Koris Insurance, Best Doctors Insurance, Adisa. Primera opción "Seleccionar..." (opcional).

#### Dashboard: tarjetas de métricas

- **`src/app/(app)/dashboard/page.tsx`** — Tarjetas de estadísticas (crítico, urgente, próximos 15 días):
  - Número principal en **`text-5xl font-bold`**.
  - Ícono arriba de cada número: **AlertCircle** (rojo), **Clock** (naranja), **CalendarDays** (amarillo), con etiqueta en mayúsculas.
  - **`border-b-4`** en el color de la tarjeta (`border-b-red-500`, `border-b-orange-500`, `border-b-yellow-500`) para identidad visual.

#### Sidebar

- **`src/components/layout/Sidebar.tsx`** — Badge **Super Admin** convertido en pill pequeña: `rounded-full`, `text-[10px] font-semibold uppercase tracking-widest`, fondo semitransparente (`bg-red-500/15`, `dark:bg-red-500/20`), texto rojo. Separador visual **`<hr>`** entre la sección operativa (Panel, Pacientes, Tratamientos, Renovaciones) y la administrativa (Sucursales, Reportes globales), usando `separatorAbove: true` en el ítem Sucursales.

---

## [0.9.0] — 2026-02-18

### Notas del paciente: formulario, ficha editable y server action

Se añadió el campo **Notas / preferencias** para pacientes (p. ej. "el cliente prefiere que lo llamen" o "prefiere contacto por WhatsApp"), visible en la ficha y editable desde la misma.

#### Formulario de nuevo paciente

- **`src/app/(app)/pacientes/nuevo/page.tsx`** — En la sección "Datos del paciente" se añadió el campo opcional **"Notas / preferencias"** con placeholder: "Ej: El cliente prefiere que lo llamen por teléfono; prefiere contacto por WhatsApp". El valor se guarda en `pacientes.notas`.

#### Ficha del paciente: notas en el bloque superior

- **`src/app/(app)/pacientes/[id]/page.tsx`** — En el bloque superior de datos personales (nombre, teléfono, farmacia, dirección, empresa, seguro, tipo de pago) se muestra el componente de notas justo debajo. Se eliminó el recuadro lateral "📝 Notas" para evitar duplicado; las notas solo aparecen arriba y son editables ahí.

#### Componente editable y server action

- **`src/app/(app)/pacientes/[id]/NotasPacienteEditable.tsx`** — Nuevo componente cliente que:
  - En modo lectura: muestra el texto de las notas y un botón **"Editar"** (o **"Añadir notas"** si está vacío).
  - En modo edición: textarea con botones **"Guardar"** y **"Cancelar"**; al guardar llama a la server action y hace `router.refresh()` para actualizar la ficha.
- **`src/app/(app)/pacientes/[id]/actions.ts`** — Nueva Server Action **`actualizarNotasPaciente(pacienteId, notas)`** que actualiza `pacientes.notas` en Supabase y hace `revalidatePath` de la ficha.

La columna `notas` en la tabla `pacientes` debe existir (texto opcional); si no está en el schema, hay que añadirla con una migración.

---

## [0.8.0] — 2026-02-18

### Marca y concentración en tratamientos + panel para agregar tratamiento a un paciente existente

#### Marca y concentración del medicamento

- **`supabase/migrations/004_tratamientos_marca_concentracion.sql`** — En la tabla `tratamientos` se añadieron las columnas opcionales `marca` (VARCHAR 200) y `concentracion` (VARCHAR 200), con comentarios en la base.
- **`src/types/index.ts`** — En el tipo `Tratamiento` se añadieron `marca?: string | null` y `concentracion?: string | null`.
- **`src/app/(app)/pacientes/nuevo/page.tsx`** — En la sección "Primer tratamiento" se añadieron los campos **Nombre del medicamento**, **Marca** y **Concentración** (tres inputs). Al guardar se envían `marca` y `concentracion` en el insert (null si van vacíos).
- **`src/lib/utils/index.ts`** — Nueva función `formatoMedicamento(t)` que devuelve el nombre del medicamento y, si existen, la concentración entre paréntesis y la marca separada por " · " (ej. "Metformina (500mg) · Genérico").
- **Visualización** — En la ficha del paciente (`pacientes/[id]/page.tsx`), en el dashboard (renovaciones pendientes) y en la página de tratamientos activos (`tratamientos/page.tsx`) la columna o línea del medicamento usa `formatoMedicamento(t)` para mostrar nombre, concentración y marca cuando aplique.

#### Panel "Agregar tratamiento" para un paciente existente

- **`src/app/(app)/pacientes/[id]/tratamiento/nuevo/page.tsx`** — Nueva página en la ruta `/pacientes/[id]/tratamiento/nuevo` con el mismo formulario de datos del medicamento que en "Primer tratamiento" al dar de alta un cliente:
  - Nombre del medicamento *, Marca, Concentración, Unidades en la caja *, Dosis diaria *, Fecha de surtido *, Tipo de tratamiento (crónico/temporal), Notas (opcional).
  - Vista previa de la fecha de vencimiento calculada. Al enviar se inserta un nuevo registro en `tratamientos` con `paciente_id` del paciente de la URL; luego se redirige a la ficha del paciente y se muestra toast de éxito.
  - Enlace "← Volver a la ficha del paciente" y botón Cancelar.

El botón "+ Agregar tratamiento" de la ficha del paciente apuntaba ya a esta ruta; con esta página el flujo queda operativo.

---

## [0.7.0] — 2026-02-18

### Integración API persona por cédula, eliminar paciente y búsqueda en lista

Tres mejoras en el flujo de pacientes: consulta de nombre por cédula al registrar, eliminación desde la ficha y búsqueda por nombre o teléfono en la lista.

#### Consulta de nombre por cédula (nuevo paciente)

- **`src/app/(app)/pacientes/nuevo/page.tsx`** — En el formulario de nuevo paciente se añadió:
  - Campo **Cédula** y botón **"Buscar nombre"** que realiza una petición GET a `{NEXT_PUBLIC_PERSONA_API_URL}/persona/{cedula}`.
  - La respuesta JSON (con `nombre_completo`, `nombre`, `primer_apellido`, `segundo_apellido`) se usa para rellenar automáticamente el campo **Nombre completo** con `nombre_completo`.
  - Toasts de éxito o error según el resultado de la API. Soporte de Enter en el campo cédula para disparar la búsqueda.
- **`.env.local`** — Nueva variable opcional `NEXT_PUBLIC_PERSONA_API_URL` (por defecto `http://127.0.0.1:8000`). En producción puede apuntar a la URL del API de persona.

El API externo debe permitir CORS desde el origen de la app (p. ej. `http://localhost:3000` en desarrollo).

#### Eliminar paciente desde la ficha

- **`src/app/(app)/pacientes/[id]/actions.ts`** — Nueva Server Action `eliminarPaciente(pacienteId)` que elimina el paciente en Supabase y devuelve `{ error?: string }`. Hace `revalidatePath` de `/pacientes` y de la ficha.
- **`src/app/(app)/pacientes/[id]/BotonEliminarPaciente.tsx`** — Componente cliente con botón **"Eliminar paciente"** (estilo rojo). Al hacer clic se muestra un `confirm()` advirtiendo que se borrarán también tratamientos y renovaciones; si se confirma se llama a la action, se muestra toast y se redirige a `/pacientes`.
- **`src/app/(app)/pacientes/[id]/page.tsx`** — En el header de la ficha, junto a "+ Agregar tratamiento", se añadió el botón "Eliminar paciente".
- **`supabase/migrations/003_permiso_eliminar_pacientes.sql`** — Nueva política RLS **`empleado_elimina_pacientes_sucursal`** en la tabla `pacientes` para `DELETE`: permitido si el usuario es `super_admin` o si el paciente pertenece a la farmacia del empleado.

La eliminación en cascada de tratamientos y renovaciones la gestiona el schema existente (`ON DELETE CASCADE`).

#### Búsqueda por nombre o teléfono en la lista de pacientes

- **`src/app/(app)/pacientes/page.tsx`** — Lista de pacientes con filtro en servidor:
  - La página recibe `searchParams.q` (ej. `/pacientes?q=maria`). Si hay término, se aplica a la consulta Supabase con `.or()` sobre `nombre.ilike` y `telefono.ilike` (búsqueda insensible a mayúsculas).
  - **Barra de búsqueda** debajo del título: input "Buscar por nombre o teléfono", botón **"Buscar"** (formulario GET a `/pacientes?q=...`) y enlace **"Limpiar"** (visible solo con búsqueda activa) que vuelve a `/pacientes` sin parámetros.
  - Textos contextuales: sin búsqueda se muestra "X pacientes registrados"; con búsqueda "X resultado(s)". Si no hay resultados y hay búsqueda: "Ningún paciente coincide con la búsqueda." y "Prueba con otro nombre o teléfono."

No se requiere JavaScript para que la búsqueda funcione; el filtrado es server-side.

---

## [0.6.0] — 2026-02-18

### Compatibilidad Next.js 15+ (cookies async) y mejoras para Supabase real

Ajustes para que la app funcione correctamente con Supabase en producción, evite pantalla blanca al iniciar sesión y supere el type-check estricto en el build de Netlify.

#### Next.js 15+: `cookies()` es asíncrono

En Next.js 15+, `cookies()` de `next/headers` devuelve una Promise y debe usarse con `await`.

- **`src/lib/supabase/server.ts`** — `createClient()` pasó a ser `async` y se usa `await cookies()` antes de leer/escribir cookies. `createServiceClient()` sin cambios (no usa cookies).
- **Páginas que usan el cliente de servidor** — Todas llaman ahora `await createClient()`:
  - `src/app/(app)/layout.tsx`
  - `src/app/(app)/dashboard/page.tsx`
  - `src/app/(app)/pacientes/page.tsx`
  - `src/app/(app)/pacientes/[id]/page.tsx`
  - `src/app/(app)/tratamientos/page.tsx`
  - `src/app/(app)/admin/reportes/page.tsx`
  - `src/app/(app)/admin/farmacias/page.tsx`
  - `src/app/(app)/renovaciones/page.tsx`

#### Modo mock vs Supabase real

- **`src/app/api/env-check/route.ts`** — Nuevo endpoint GET que devuelve `useMock`, `rawValue` de `NEXT_PUBLIC_USE_MOCK` y un mensaje. Sirve para comprobar qué valor ve el servidor al depurar.
- **`src/app/(app)/layout.tsx`** — Banner amarillo en la parte superior cuando `NEXT_PUBLIC_USE_MOCK === 'true'`, con texto que indica borrar `.next` y reiniciar para usar la base real.
- **`.env.local`** — Comentario aclaratorio: `false = usar Supabase real`.

#### Pantalla blanca y usuario sin perfil de empleado

- **`src/app/(app)/loading.tsx`** — Nuevo componente de carga (spinner + "Cargando…") para el route group `(app)`, de modo que no se muestre pantalla en blanco mientras se resuelve el layout.
- **`src/app/(app)/dashboard/page.tsx`** — Saludo seguro: `empleado?.nombre?.split(' ')[0]` → `empleado?.nombre?.split(' ')[0] ?? 'Usuario'` para evitar error si `nombre` es null.
- **`src/app/(app)/layout.tsx`** — Si el usuario está autenticado pero no existe en la tabla `empleados` (o está inactivo), se redirige a `/sin-acceso` en lugar de a `/login`.
- **`src/app/sin-acceso/page.tsx`** — Nueva página que explica que la cuenta no tiene perfil de empleado, indica que un administrador debe dar de alta en la tabla `empleados` y ofrece botón "Cerrar sesión".

#### TypeScript: build en Netlify

El build de producción (`next build`) ejecuta el comprobador de tipos; parámetros sin tipo explícito en callbacks pueden dar "Parameter implicitly has an 'any' type".

- **`src/app/(app)/dashboard/page.tsx`** — Import de tipo `Tratamiento` desde `@/types`. Tipados todos los `.filter()` y `.map()` sobre tratamientos con `(t: Tratamiento)`. Variable `tratamientosFiltrados` tipada como `Tratamiento[] | undefined`.
- **`src/app/(app)/pacientes/[id]/page.tsx`** — Import de tipos `Tratamiento` y `Renovacion`. Tipados el `.filter()` de tratamientos activos y los `.map()` de `tratamientosActivos` y de `renovaciones` con `(t: Tratamiento)` y `(r: Renovacion)`.

Con estos cambios el deploy en Netlify completa correctamente la fase "Running TypeScript".

---

## [0.5.0] — 2026-02-18

### Eliminación del envío automático de mensajes

El cliente indicó que solo necesita un dashboard con los datos y que ellos gestionan el contacto con los pacientes. Se eliminó todo lo relacionado con envío automático de mensajes (WhatsApp, SMS, email) y la pestaña de alertas enviadas.

#### Eliminado

- **Página y navegación:** Ruta `/alertas`, ítem "Alertas enviadas" del Sidebar, página `src/app/(app)/alertas/page.tsx`
- **Ficha de paciente:** Sección "Últimas alertas enviadas" y consulta a `alertas_enviadas`
- **Reportes globales:** Tarjetas "Alertas exitosas" y "Alertas fallidas" y consulta a `alertas_enviadas`
- **Backend de envío:** `src/lib/utils/notificaciones.ts` (Twilio + Resend), `src/lib/utils/motor-alertas.ts`, `src/app/api/cron/route.ts`
- **Cron:** `netlify/functions/cron-alertas.mts`, configuración de scheduled function en `netlify.toml`, crons en `vercel.json`
- **Utilidad:** `formatearTelefonoTwilio` en `src/lib/utils/index.ts`
- **Dependencias:** `twilio` y `resend` en `package.json`
- **Mock:** Array `alertas_enviadas` y entrada en `mockTables` de `src/lib/mock/data.ts`

#### Modificado

- **Middleware:** `matcher` ya no excluye `api/cron`
- **Pacientes/nuevo:** Textos que hablaban de "alertas automáticas" sustituidos por "seguimiento en el dashboard"
- **README, comandos.log:** Actualizados (stack, estructura, variables de entorno, diagrama de arquitectura) para reflejar que no hay notificaciones ni cron

La base de datos puede seguir teniendo la tabla `alertas_enviadas` (schema en Supabase); el sistema ya no la usa ni la muestra.

---

## [0.4.0] — 2026-02-18

### Adaptación a Netlify

El proyecto ahora es compatible tanto con **Netlify** (opción principal) como con Vercel (alternativa).

#### Archivos nuevos

- **`netlify.toml`** — Configuración de build para Netlify:
  - Comando de build: `npm run build`
  - Directorio de publicación: `.next`
  - Node.js 20
  - Plugin `@netlify/plugin-nextjs` para soporte completo de Next.js 16
  - Scheduled Function configurada a las 15:00 UTC (9 AM México)

- **`netlify/functions/cron-alertas.mts`** — Scheduled Function de Netlify que reemplaza el Vercel Cron:
  - Se ejecuta diariamente a las 9 AM hora México
  - Llama al endpoint `/api/cron` existente con el `CRON_SECRET`
  - Usa la variable `URL` que Netlify inyecta automáticamente

#### Dependencias añadidas

- **`@netlify/plugin-nextjs`** (devDependency) — Adaptador que permite correr Next.js 16 con App Router, Server Components y middleware en Netlify

#### Archivos conservados

- **`vercel.json`** — Se mantiene para compatibilidad si se prefiere desplegar en Vercel
- **`src/app/api/cron/route.ts`** — El endpoint sigue funcionando igual en ambas plataformas

---

## [0.3.0] — 2026-02-18

### Dark Mode + Header con botón Home

#### Modo oscuro

- **`tailwind.config.js`** — Habilitado `darkMode: 'class'`
- **`src/components/layout/ThemeProvider.tsx`** — Nuevo componente que gestiona el tema (claro/oscuro) con React Context, persistencia en `localStorage` y detección automática de preferencia del sistema operativo
- **`src/components/layout/Header.tsx`** — Nueva barra superior con:
  - Botón de **modo oscuro/claro** (iconos Sun/Moon de lucide-react) a la derecha
  - Botón de **Home** ("Panel principal") a la izquierda, visible en todas las páginas excepto el dashboard
- **`src/app/globals.css`** — Overrides globales de dark mode para cards, tablas, bordes, inputs, scrollbar y tarjetas de colores (rojo, naranja, amarillo, verde, azul, púrpura)
- **`src/app/layout.tsx`** — Envuelto con `ThemeProvider` y `suppressHydrationWarning` en `<html>`
- **`src/app/login/page.tsx`** — Gradiente y card adaptados a dark mode
- **`src/components/layout/Sidebar.tsx`** — Clases `dark:` añadidas a fondo, bordes, textos, hover y avatar

#### Reestructuración con Route Group `(app)`

Todas las páginas autenticadas se movieron dentro del route group `src/app/(app)/` para que compartan un único layout con Sidebar + Header. Las URLs no cambian (el paréntesis se excluye de la ruta).

**Estructura anterior:**
```
src/app/
├── dashboard/layout.tsx    ← solo cubría /dashboard
├── dashboard/page.tsx
├── pacientes/              ← sin Sidebar ni Header
├── tratamientos/           ← sin Sidebar ni Header
├── renovaciones/           ← sin Sidebar ni Header
├── alertas/                ← sin Sidebar ni Header
└── admin/                  ← sin Sidebar ni Header
```

**Estructura nueva:**
```
src/app/
├── (app)/
│   ├── layout.tsx          ← Sidebar + Header para TODAS las páginas
│   ├── dashboard/page.tsx
│   ├── pacientes/
│   ├── tratamientos/
│   ├── renovaciones/
│   ├── alertas/
│   └── admin/
├── login/page.tsx
├── layout.tsx
└── page.tsx
```

- **`src/app/(app)/layout.tsx`** — Layout compartido con Sidebar, Header y clases dark mode (`dark:bg-gray-900`)
- Todas las páginas (`/pacientes`, `/tratamientos`, `/renovaciones`, `/alertas`, `/admin/*`) ahora tienen Sidebar y Header automáticamente

---

## [0.2.0] — 2026-02-18

### Modo Mock (desarrollo sin Supabase)

Se implementó un sistema completo de datos simulados para poder levantar y desarrollar la aplicación sin necesidad de una conexión activa a Supabase, Twilio ni Resend.

#### Archivos nuevos

- **`src/lib/mock/data.ts`** — Datos mock realistas que incluyen:
  - 6 farmacias con dirección, teléfono y ciudad
  - 3 empleados con roles distintos (`super_admin`, `admin_sucursal`, `empleado`)
  - 8 pacientes con datos completos y notas clínicas
  - 10 tratamientos activos con fechas relativas a la fecha actual (el dashboard siempre muestra datos relevantes)
  - 13 alertas enviadas (mezcla de exitosas/fallidas por WhatsApp, SMS y Email)
  - 3 renovaciones históricas con farmacia y empleado asociados

- **`src/lib/mock/supabase-mock.ts`** — Cliente mock que simula el API de Supabase:
  - Query builder encadenable: `.select()`, `.eq()`, `.neq()`, `.lte()`, `.gte()`, `.in()`, `.order()`, `.limit()`, `.single()`
  - Auth mock: `.getUser()`, `.signInWithPassword()`, `.signOut()`, `.onAuthStateChange()`
  - Operaciones de escritura: `.insert()`, `.update()`, `.delete()`

- **`postcss.config.js`** — Configuración de PostCSS necesaria para Tailwind CSS (faltaba en el proyecto)

- **`src/app/page.tsx`** — Página raíz que redirecciona automáticamente a `/dashboard`

#### Páginas nuevas

Cinco páginas que el sidebar referenciaba pero no existían en el código:

- **`src/app/tratamientos/page.tsx`** — Tabla de tratamientos activos con semáforo de urgencia (crítico, urgente, temprano, ok), tipo de tratamiento y enlace a la ficha del paciente
- **`src/app/renovaciones/page.tsx`** — Historial de renovaciones con fecha, farmacia, empleado y notas
- **`src/app/alertas/page.tsx`** — Historial de alertas enviadas con estado (exitosa/fallida), tipo (7d/3d/1d), canal y respuesta de la API
- **`src/app/admin/farmacias/page.tsx`** — Grid de tarjetas de sucursales con dirección, teléfono, ciudad y estado activa/inactiva
- **`src/app/admin/reportes/page.tsx`** — Dashboard global con 6 tarjetas de estadísticas y gráfico de barras de pacientes por sucursal

#### Archivos modificados

- **`src/lib/supabase/client.ts`** — Retorna el cliente mock cuando `NEXT_PUBLIC_USE_MOCK=true`
- **`src/lib/supabase/server.ts`** — Idem para `createClient()` y `createServiceClient()` en el servidor
- **`src/middleware.ts`** — Bypass de autenticación en modo mock (evita redirecciones a `/login`)
- **`.env.local`** — Agregada variable `NEXT_PUBLIC_USE_MOCK=true`

#### Correcciones

- **`src/app/pacientes/[id]/page.tsx`** — Corregido para Next.js 16 donde `params` es un `Promise` y requiere `await` antes de acceder a sus propiedades

---

## [0.1.0] — 2026-02-18

### Scaffold inicial del proyecto

Estructura base del proyecto FarmaRenovar creada con Next.js 16 (App Router), Tailwind CSS, Supabase y TypeScript.

#### Estructura del proyecto

```
src/
├── app/
│   ├── api/cron/route.ts        — Endpoint cron para alertas diarias (9 AM)
│   ├── dashboard/
│   │   ├── layout.tsx           — Layout protegido con Sidebar
│   │   └── page.tsx             — Panel principal con renovaciones pendientes
│   ├── login/page.tsx           — Página de inicio de sesión
│   ├── pacientes/
│   │   ├── [id]/page.tsx        — Ficha del paciente con tratamientos, renovaciones y alertas
│   │   ├── nuevo/page.tsx       — Formulario de registro de paciente + primer tratamiento
│   │   └── page.tsx             — Lista de pacientes
│   ├── globals.css
│   └── layout.tsx               — Layout raíz con Toaster de notificaciones
├── components/
│   └── layout/Sidebar.tsx       — Sidebar con navegación filtrada por rol
├── lib/
│   ├── supabase/
│   │   ├── client.ts            — Cliente Supabase para el navegador
│   │   └── server.ts            — Cliente Supabase para el servidor + service role
│   └── utils/
│       ├── index.ts             — Utilidades (fechas, urgencia, formateo)
│       ├── motor-alertas.ts     — Motor de alertas diarias
│       └── notificaciones.ts    — Envío por WhatsApp, SMS y Email
├── middleware.ts                — Protección de rutas por autenticación
└── types/index.ts               — Tipos TypeScript globales
```

#### Base de datos (Supabase)

- **`supabase/migrations/001_schema_inicial.sql`** — Schema completo con:
  - 6 tablas: `farmacias`, `empleados`, `pacientes`, `tratamientos`, `alertas_enviadas`, `renovaciones`
  - Row Level Security (RLS) con políticas por rol
  - Funciones helper: `get_user_role()`, `get_user_farmacia()`
  - Datos iniciales: 16 farmacias
  - Índices de rendimiento para el cron diario

#### Funcionalidades implementadas

- Autenticación con Supabase Auth y middleware de protección de rutas
- Tres roles: `super_admin`, `admin_sucursal`, `empleado`
- Dashboard con semáforo de urgencia (crítico ≤1d, urgente ≤3d, temprano ≤7d)
- Registro de pacientes con primer tratamiento y cálculo automático de fecha de vencimiento
- Ficha de paciente con tratamientos activos, barra de progreso, historial de renovaciones y alertas
- Motor de alertas automáticas (7, 3 y 1 día antes del vencimiento)
- Notificaciones multicanal: WhatsApp (Twilio), SMS (Twilio), Email (Resend)
- Cron diario configurado en Vercel (`vercel.json`) a las 9 AM UTC-6

#### Configuración

- **`next.config.js`** — Server Actions habilitados
- **`tailwind.config.js`** — Colores de marca `brand` (verde farmacia)
- **`tsconfig.json`** — Alias `@/*` → `./src/*`
- **`vercel.json`** — Cron job diario
- **`.env.local`** — Variables para Supabase, Twilio, Resend y CRON_SECRET

#### Dependencias principales

| Paquete | Uso |
|---------|-----|
| `next` 16.1.6 | Framework React con App Router |
| `@supabase/ssr` + `@supabase/supabase-js` | Base de datos y autenticación |
| `twilio` | WhatsApp y SMS |
| `resend` | Email transaccional |
| `tailwindcss` | Estilos utilitarios |
| `sonner` | Notificaciones toast |
| `lucide-react` | Iconos |
| `date-fns` | Manejo de fechas |
| `zod` + `react-hook-form` | Validación de formularios |
| `recharts` | Gráficos (preparado para reportes) |
