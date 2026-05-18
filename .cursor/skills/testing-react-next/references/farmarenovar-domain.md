# FarmaRenovar / La Botica — dominio para tests

Leer este archivo cuando el proyecto sea FarmaRenovar. Tipos canónicos: `src/types/index.ts`. Mock existente: `src/lib/mock/data.ts`.

## IDs de referencia (mock)

| Entidad | ID ejemplo |
|---------|------------|
| Farmacia | `f001` (La Botica Liberia) |
| Super admin | `mock-user-001` |
| Admin sucursal | `mock-user-002` |
| Empleado | `mock-user-003` |
| Paciente | `p001` |
| Tratamiento | `t001` |

## Helpers de fechas

```typescript
export function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

/** Para bandas del dashboard */
export function makeTratamientoVencido(overrides = {}) {
  return makeTratamiento({ fecha_vencimiento: daysFromNow(-3), ...overrides })
}
export function makeTratamientoCritico(overrides = {}) {
  return makeTratamiento({ fecha_vencimiento: daysFromNow(1), dias_restantes: 1, ...overrides })
}
export function makeTratamientoUrgente(overrides = {}) {
  return makeTratamiento({ fecha_vencimiento: daysFromNow(4), dias_restantes: 4, ...overrides })
}
export function makeTratamientoPlanificacion(overrides = {}) {
  return makeTratamiento({ fecha_vencimiento: daysFromNow(10), dias_restantes: 10, ...overrides })
}
```

Bandas (alineadas a `src/lib/utils/index.ts`):

| `dias_restantes` | Banda KPI |
|------------------|-----------|
| < 0 | Vencidos |
| 0–1 | Crítico |
| 2–5 | Urgente |
| 6–15 | Planificación |
| 16+ | Al día |

## Factories

```typescript
import type { Paciente, Tratamiento, Renovacion, Empleado, Farmacia, Rol } from '@/types'

const ISO = '2024-06-01T12:00:00Z'

export function makeFarmacia(overrides: Partial<Farmacia> = {}): Farmacia {
  return {
    id: 'f001',
    nombre: 'La Botica Liberia',
    direccion: 'Test',
    telefono: '88880000',
    ciudad: 'Guanacaste',
    activa: true,
    creada_en: ISO,
    ...overrides,
  }
}

export function makeEmpleado(overrides: Partial<Empleado> = {}): Empleado {
  return {
    id: 'mock-user-003',
    nombre: 'Roberto López',
    email: 'roberto@test.com',
    rol: 'empleado' as Rol,
    farmacia_id: 'f002',
    activo: true,
    creado_en: ISO,
    ...overrides,
  }
}

export function makePaciente(overrides: Partial<Paciente> = {}): Paciente {
  return {
    id: 'p-test',
    nombre: 'María Test',
    telefono: '88881234',
    email: null,
    direccion: null,
    empresa: null,
    seguro_medico: null,
    tipo_pago: 'directo',
    farmacia_id: 'f001',
    registrado_por: 'mock-user-001',
    notas: null,
    activo: true,
    creado_en: ISO,
    ...overrides,
  }
}

export function makePacienteMenor(overrides: Partial<Paciente> = {}): Paciente {
  return makePaciente({
    clasificacion_alta: 'menor',
    fecha_nacimiento: daysFromNow(-365 * 10),
    encargado_nombre: 'Padre Test',
    encargado_documento: '1-0000-0001',
    encargado_telefono: '88889999',
    encargado_parentesco: 'padre',
    ...overrides,
  })
}

export function makeTratamiento(overrides: Partial<Tratamiento> = {}): Tratamiento {
  const inicio = daysFromNow(-10)
  return {
    id: 't-test',
    paciente_id: 'p-test',
    medicamento: 'Losartán 50mg',
    medicamento_id: 'med-001',
    dosis_diaria: 1,
    unidades_caja: 30,
    fecha_surtido: inicio,
    fecha_inicio_tratamiento: inicio,
    fecha_vencimiento: daysFromNow(20),
    tipo: 'cronico',
    activo: true,
    notas: null,
    registrado_por: 'mock-user-001',
    creado_en: ISO,
    contactado_renovacion_en: null,
    ...overrides,
  }
}

export function makeRenovacion(overrides: Partial<Renovacion> = {}): Renovacion {
  const fecha = daysFromNow(0)
  return {
    id: 'r-test',
    tratamiento_id: 't-test',
    farmacia_id: 'f001',
    empleado_id: 'mock-user-001',
    fecha,
    fecha_inicio_tratamiento: fecha,
    notas: null,
    numero_factura: 'FAC-001',
    monto_total_factura: 15000,
    creada_en: ISO,
    hubo_regalia: false,
    unidades_regalia: null,
    ...overrides,
  }
}
```

## Mocks de sesión

```typescript
export const mockSesionSuperAdmin = {
  user: { id: 'mock-user-001', email: 'admin@test.com' },
  empleado: makeEmpleado({ id: 'mock-user-001', rol: 'super_admin', farmacia_id: 'f001' }),
}

export const mockSesionEmpleado = {
  user: { id: 'mock-user-003', email: 'roberto@test.com' },
  empleado: makeEmpleado({ rol: 'empleado', farmacia_id: 'f002' }),
}

export const mockSinSesion = { user: null, empleado: null }
```

Cookie super admin: `farmarenovar-filtro-farmacia`.

## Rutas clave

| Ruta | Rol mínimo |
|------|------------|
| `/dashboard` | empleado |
| `/pacientes`, `/pacientes/nuevo` | empleado |
| `/tratamientos`, `/renovaciones` | empleado |
| `/admin/medicamentos` | admin_sucursal |
| `/admin/farmacias`, `/admin/usuarios`, `/admin/reportes` | super_admin |

## Casos críticos por módulo

### Dashboard
- Orden: vencidos → crítico → urgente → planificación
- Filtros: pendientes sin contacto / contactados / todos
- Marcar y desmarcar contactado
- Export CSV
- Filtro sucursal (solo super_admin)

### Pacientes
- Clasificación: `padron_nacional`, `menor`, `extranjero`, `no_listado_cr`
- Menor: sección encargado visible
- Alta con medicamento: factura + monto obligatorios; `fecha_inicio_tratamiento` vacía por defecto en UI
- Eliminar paciente (permisos)

### Renovaciones
- Regalía: `hubo_regalia`, `unidades_regalia` afectan vencimiento
- Factura y monto obligatorios en flujos nuevos
- Auditoría: severidad tardía vs a tiempo

### Roles
- Empleado solo ve su `farmacia_id`
- Super admin con `farmacia_id` null permitido
- `/sin-acceso` si no hay fila en `empleados` o `activo: false`

## API routes

| Ruta | Método | Notas |
|------|--------|-------|
| `/api/farmacia-filtro` | POST | Cookie filtro, super_admin |
| `/api/padron-registro` | POST | Service role padrón |
| `/api/env-check` | GET | Debug mock flag |

## Variables de entorno (test)

```bash
NEXT_PUBLIC_USE_MOCK=true
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key
# Solo en tests de server/admin:
SUPABASE_SERVICE_ROLE_KEY=test-service-key
```

## Qué NO testear en unit

- Políticas RLS (usar Supabase local o integración)
- Generación PDF (html2canvas/jspdf) — smoke E2E o mock de librería
- Envío de mensajes (no existe en el producto)

## Imports útiles del proyecto

```typescript
import { calcularDiasRestantes, etiquetaPrioridadPanelPrincipal, bandaOrdenPanelRenovaciones } from '@/lib/utils'
import { MOCK_USER, pacientes, tratamientos } from '@/lib/mock/data'
```
