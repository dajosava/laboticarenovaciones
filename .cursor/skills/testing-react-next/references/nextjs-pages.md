# Páginas y rutas Next.js (App Router)

## Estrategia

| Capa | Cómo testear |
|------|----------------|
| Util pura (`calcularDiasRestantes`) | Unit directo |
| Server Component (fetch en servidor) | Extraer fetch a función testeable; mock Supabase |
| Client Component de página | RTL + mocks navigation/auth |
| Server Action | Unit con mock de `createClient` |

## Client page component

```typescript
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({ id: 'p001' }),
}))

import PacientePageClient from './PacientePageCliente' // extraer UI client

it('muestra nombre del paciente', async () => {
  render(<PacientePageClient paciente={makePaciente()} />)
  expect(await screen.findByRole('heading', { name: /maría/i })).toBeInTheDocument()
})
```

Patrón recomendado: página `page.tsx` delgada (Server) + componente `*Cliente.tsx` testeable.

## Server Components

No usar `render()` de RTL en async Server Components.

1. Extraer lógica: `async function loadPaciente(id: string) { ... }` → test con mock Supabase.
2. UI client: test con props estáticas.

```typescript
// loadPaciente.test.ts
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

it('redirige si no hay paciente', async () => {
  mockFromSingle(null)
  await expect(loadPaciente('x')).rejects.toThrow() // o notFound mock
})
```

## `redirect` / `notFound`

```typescript
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`) }),
  notFound: vi.fn(() => { throw new Error('NOT_FOUND') }),
}))
```

## Layout con auth

Mockear el resultado de `getUser` + query `empleados` antes de renderizar hijos. Ver [supabase-mocks.md](supabase-mocks.md).

## `next/link`

No requiere mock; RTL trata `<a>` como enlace. Verificar `href` con `getByRole('link', { name: ... })`.

## Cookies y headers (server)

Testear funciones que leen cookies pasando un `Request` mock o extrayendo `getFarmaciaFiltro(cookies)` como pure function.
