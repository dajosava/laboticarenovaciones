---
name: testing-react-next
description: >
  Genera pruebas automatizadas para aplicaciones React y Next.js. Úsalo siempre que el usuario
  quiera escribir tests, pruebas unitarias, pruebas de componentes, pruebas de integración, o
  pruebas e2e. También se activa cuando el usuario dice "testear", "cubrir con tests", "agregar
  pruebas", "escribir specs", "mockear", "simular un componente", "probar un hook", "probar una
  página", "probar una API route", o cuando sube un componente/hook/página y pregunta cómo
  probarlo. Soporta Vitest, Jest, React Testing Library, Playwright y Cypress. Maneja mocks de
  Supabase, Next.js API Routes, Zustand, React Query y SWR. Úsalo incluso si el usuario solo
  muestra código y no pide tests explícitamente, si el contexto sugiere que quieren cobertura.
---

# Testing para React + Next.js

Skill para generar pruebas automatizadas de alta calidad, listas para producción.

## Paso 1 — Leer el contexto antes de escribir cualquier test

Antes de generar código, identificar:

1. **¿Qué se va a testear?** (componente, hook, util, página, API route, flujo e2e)
2. **¿Qué stack usa el proyecto?** → leer `package.json` si está disponible
3. **¿Qué tipo de test corresponde?** → ver tabla de decisión abajo
4. **¿Hay dependencias externas que mockear?** (Supabase, fetch, router, stores)

Si el usuario no especifica el tipo de test, inferirlo del código que comparte.

---

## Tabla de decisión — qué tipo de test usar

| Lo que se testea | Tipo | Herramienta |
|---|---|---|
| Función pura, util, helper | Unit | Vitest / Jest |
| Hook personalizado | Unit | Vitest + `renderHook` |
| Componente UI aislado | Componente | RTL + Vitest/Jest |
| Componente con estado/efectos | Componente | RTL + mocks |
| Página Next.js (App Router) | Integración | RTL + mocks de next/navigation |
| API Route / Route Handler | Integración | Jest/Vitest + mock de Request |
| Flujo completo usuario | E2E | Playwright |
| Formulario con validación | Componente + E2E | RTL + Playwright |

---

## Paso 2 — Stack detection

Detectar automáticamente basándose en `package.json` o lo que el usuario mencione:

```
Vitest → usar `import { describe, it, expect, vi } from 'vitest'`
Jest   → usar `import { describe, it, expect, jest } from '@jest/globals'` o globals
RTL    → siempre importar desde `@testing-library/react`
Playwright → importar desde `@playwright/test`
```

Si no hay certeza, **preguntar una sola vez** antes de generar.

---

## Paso 3 — Patrones por tipo de prueba

Para cada tipo, leer el archivo de referencia correspondiente:

- Componentes React → [references/components.md](references/components.md)
- Hooks personalizados → [references/hooks.md](references/hooks.md)
- Páginas y rutas Next.js → [references/nextjs-pages.md](references/nextjs-pages.md)
- API Routes Next.js → [references/api-routes.md](references/api-routes.md)
- Supabase (auth, queries) → [references/supabase-mocks.md](references/supabase-mocks.md)
- Zustand / estado global → [references/stores.md](references/stores.md)
- React Query / SWR → [references/async-data.md](references/async-data.md)
- E2E con Playwright → [references/e2e-playwright.md](references/e2e-playwright.md)

Leer **solo los archivos relevantes** para el caso actual. No cargar todo.

---

## Paso 4 — Estructura de archivos de test

### Convención de nombres

```
# Junto al archivo fuente (recomendado para unit/componente)
src/
  components/
    PatientCard.tsx
    PatientCard.test.tsx   ← aquí

# Carpeta __tests__ (alternativa válida)
src/
  __tests__/
    PatientCard.test.tsx

# E2E siempre en carpeta separada
e2e/
  patient-flow.spec.ts
```

### Estructura interna de un test bien formado

```typescript
// 1. Imports — primero librerías, luego locales
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PatientCard } from './PatientCard'

// 2. Mocks al tope, antes de describe()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

// 3. Factories de datos de prueba
const makePatient = (overrides = {}) => ({
  id: 'test-id',
  name: 'Pedro Pablo Marín',
  email: 'test@email.com',
  ...overrides,
})

// 4. describe agrupa por componente/función
describe('PatientCard', () => {
  // 5. beforeEach limpia mocks
  beforeEach(() => { vi.clearAllMocks() })

  // 6. it / test describe comportamiento, no implementación
  it('muestra el nombre del paciente', () => { ... })
  it('llama onDelete al confirmar eliminación', async () => { ... })

  // 7. Agrupar casos edge en describe anidados
  describe('cuando el paciente es menor de edad', () => {
    it('muestra el badge de menor de edad', () => { ... })
    it('muestra la sección de persona encargada', () => { ... })
  })
})
```

---

## Paso 5 — Reglas de calidad

### Siempre hacer
- Usar `userEvent` en lugar de `fireEvent` para interacciones (más realista)
- Queries por rol semántico: `getByRole`, `getByLabelText` > `getByTestId` > `getByText`
- Un solo `expect` principal por test (+ asserts de soporte si son necesarios)
- Nombres de test en español si el proyecto lo está, en inglés si el proyecto lo está
- `waitFor` para efectos asíncronos, nunca `setTimeout` en tests
- Limpiar mocks en `beforeEach` o `afterEach`

### Nunca hacer
- No testear detalles de implementación (nombres de funciones internas, estado interno)
- No usar `querySelector` o `getElementById` — usar queries de RTL
- No hacer `expect(component).toMatchSnapshot()` como único assert
- No ignorar warnings de `act()` — resolverlos correctamente
- No mockear más de lo necesario

---

## Paso 6 — Generar el output

Siempre entregar:

1. **El archivo de test completo** — listo para copiar/pegar, con todos los imports
2. **Comando para correrlo** — ej. `npx vitest run PatientCard.test.tsx`
3. **Notas de setup** — si falta alguna dependencia o configuración (ej. `@testing-library/user-event`, `jsdom` en vitest config)
4. **Qué casos NO están cubiertos** — para que el usuario sepa qué falta

Si el test requiere configuración inicial (vitest.config.ts, jest.config.js, setup files), incluirla.

---

## Paso 7 — Setup inicial del proyecto (si aplica)

Si el usuario no tiene testing configurado, ofrecer el setup completo.
Ver [references/setup.md](references/setup.md) para las instrucciones de instalación por stack.

---

## Contexto de proyecto — FarmaRenovar / La Botica

Si el usuario está trabajando en **FarmaRenovar** (también llamado "La Botica renovaciones"), leer **siempre** [references/farmarenovar-domain.md](references/farmarenovar-domain.md) antes de generar cualquier test. Contiene:

- Factories listas para todos los modelos (`makePaciente`, `makeTratamiento`, `makeRenovacion`, etc.)
- Helpers de fechas para las bandas de prioridad del dashboard
- Mock de sesión por rol (`mockSesionEmpleado`, `mockSesionSuperAdmin`, `mockSinSesion`)
- Lista de casos críticos por módulo (dashboard, pacientes, renovaciones, roles)
- Variables de entorno para el entorno de test

Señales de que el usuario está en este proyecto: menciona "farmacia", "renovación", "vencimiento", "tratamiento", "La Botica", "FarmaRenovar", "pacientes", "despacho", "regalía", o rutas como `/dashboard`, `/pacientes`, `/renovaciones`.

---

## Casos especiales

### Componente Server (Next.js App Router)
Los Server Components no se pueden testear con RTL directamente.
→ Testear la lógica de datos por separado, y la UI con un wrapper client.
→ Ver [references/nextjs-pages.md](references/nextjs-pages.md) sección "Server Components".

### Rutas protegidas por auth
Mockear el contexto de sesión de Supabase o el middleware.
→ Ver [references/supabase-mocks.md](references/supabase-mocks.md).

### Formularios con react-hook-form / zod
Usar `userEvent.type()` para simular input, verificar mensajes de validación.
→ Ver [references/components.md](references/components.md) sección "Formularios".
