# Hooks personalizados

## Vitest + renderHook

```typescript
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useContador } from './useContador'

describe('useContador', () => {
  it('inicia en cero', () => {
    const { result } = renderHook(() => useContador())
    expect(result.current.count).toBe(0)
  })

  it('incrementa', () => {
    const { result } = renderHook(() => useContador())
    act(() => result.current.increment())
    expect(result.current.count).toBe(1)
  })
})
```

## Hook con dependencias de contexto

```typescript
function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>
}

const { result } = renderHook(() => usePacientes(), { wrapper })
```

## Efectos asíncronos

```typescript
it('carga datos', async () => {
  const { result } = renderHook(() => useFarmaciaFiltro())

  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(result.current.farmaciaId).toBe('f001')
})
```

## Mock de módulos usados por el hook

```typescript
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}))
```

## Reglas

- Probar **comportamiento observable** (valor retornado, callbacks), no re-renders internos.
- Un `act()` por actualización de estado síncrona.
- Para hooks que solo envuelven `useRouter` o `useSearchParams`, preferir test de integración del componente consumidor.
