# API Routes (Route Handlers)

## Patrón Vitest

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/farmacia-filtro/route'

function makeRequest(body: object, cookies = '') {
  return new Request('http://localhost/api/farmacia-filtro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: cookies },
    body: JSON.stringify(body),
  })
}

describe('POST /api/farmacia-filtro', () => {
  beforeEach(() => vi.clearAllMocks())

  it('401 sin sesión super_admin', async () => {
    vi.mocked(createClient).mockReturnValue(mockSinSesion)
    const res = await POST(makeRequest({ farmacia_id: 'f001' }))
    expect(res.status).toBe(401)
  })

  it('setea cookie con farmacia válida', async () => {
    vi.mocked(createClient).mockReturnValue(mockSuperAdmin)
    const res = await POST(makeRequest({ farmacia_id: 'f001' }))
    expect(res.status).toBe(200)
    expect(res.headers.get('set-cookie')).toMatch(/farmarenovar-filtro-farmacia/)
  })
})
```

## Mocks necesarios

```typescript
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createServiceClient: vi.fn(),
}))
```

## NextRequest (cuando el handler lo usa)

```typescript
import { NextRequest } from 'next/server'

const req = new NextRequest('http://localhost/api/padron-registro', {
  method: 'POST',
  body: JSON.stringify({ cedula: '1-2345-6789' }),
})
```

## Qué assertar

- `res.status`
- `await res.json()` para cuerpo
- Headers (`set-cookie`, `content-type`)
- Que **no** se llamó service role en rutas públicas

## Errores

```typescript
it('400 si falta cedula', async () => {
  const res = await POST(makeRequest({}))
  expect(res.status).toBe(400)
  const json = await res.json()
  expect(json.error).toBeTruthy()
})
```
