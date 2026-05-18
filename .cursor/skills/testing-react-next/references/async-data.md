# React Query, SWR y datos async

## TanStack Query

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  )
}
```

```typescript
it('muestra pacientes', async () => {
  render(<ListaPacientes />, { wrapper })
  expect(await screen.findByText(/maría/i)).toBeInTheDocument()
})
```

## Mock de fetch en hooks

```typescript
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ data: [] }),
})
```

## SWR

```typescript
import { SWRConfig } from 'swr'

const wrapper = ({ children }) => (
  <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map() }}>
    {children}
  </SWRConfig>
)
```

## MSW (opcional, proyectos grandes)

Para muchas rutas API, preferir [MSW](https://mswjs.io/) en `src/mocks/handlers.ts` y activar en `vitest.setup.ts`.

## FarmaRenovar

No usa React Query ni SWR. Datos vía Supabase directo y Server Actions. Ver [supabase-mocks.md](supabase-mocks.md).
