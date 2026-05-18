# Mocks de Supabase

## Cliente mock mínimo (Vitest)

```typescript
export function createMockSupabase(overrides?: Partial<MockAuth>) {
  const auth = {
    getUser: vi.fn().mockResolvedValue({ data: { user: MOCK_USER }, error: null }),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    ...overrides?.auth,
  }

  const from = vi.fn((table: string) => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: overrides?.tables?.[table] ?? null,
      error: null,
    }),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  }))

  return { auth, from }
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => createMockSupabase()),
}))
```

## Sesión por rol (FarmaRenovar)

```typescript
export const mockSesionSuperAdmin = createMockSupabase({
  tables: {
    empleados: { id: 'mock-user-001', rol: 'super_admin', farmacia_id: 'f001', activo: true },
  },
})

export const mockSesionEmpleado = createMockSupabase({
  tables: {
    empleados: { id: 'mock-user-003', rol: 'empleado', farmacia_id: 'f002', activo: true },
  },
})

export const mockSinSesion = createMockSupabase({
  auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
})
```

## `@supabase/ssr`

Mockear el módulo que exporta `createBrowserClient` / `createServerClient` en la capa `@/lib/supabase/*`, no el paquete entero.

## Reutilizar mock del proyecto

Si existe `src/lib/mock/supabase-mock.ts`, preferir importarlo o alinear factories con `src/lib/mock/data.ts`.

## Variables de entorno en tests

```bash
NEXT_PUBLIC_USE_MOCK=true
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key
```

En `vitest.config.ts`:

```typescript
test: { env: { NEXT_PUBLIC_USE_MOCK: 'true' } }
```

## Server Actions

Mockear `createClient` de `@/lib/supabase/server` y assertar llamadas a `.from('pacientes').insert(...)`.

## RLS

Los tests unitarios **no validan RLS**; documentar que políticas se verifican en integración/Supabase local. Para lógica de filtro por `farmacia_id`, testear funciones puras de filtrado.
