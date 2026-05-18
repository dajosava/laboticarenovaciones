# E2E con Playwright

## Estructura

```
e2e/
  auth.setup.ts      # login una vez, guardar storageState
  dashboard.spec.ts
playwright.config.ts
```

## Test básico

```typescript
import { test, expect } from '@playwright/test'

test('dashboard muestra KPIs', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: /panel/i })).toBeVisible()
  await expect(page.getByText(/vencidos/i)).toBeVisible()
})
```

## Auth persistida

```typescript
// auth.setup.ts
import { test as setup } from '@playwright/test'

setup('login empleado', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel(/correo/i).fill(process.env.E2E_EMAIL!)
  await page.getByLabel(/contraseña/i).fill(process.env.E2E_PASSWORD!)
  await page.getByRole('button', { name: /ingresar/i }).click()
  await page.waitForURL('/dashboard')
  await page.context().storageState({ path: 'e2e/.auth/empleado.json' })
})
```

```typescript
// playwright.config.ts — projects
{ name: 'chromium', use: { storageState: 'e2e/.auth/empleado.json' } }
```

## Buenas prácticas

- `getByRole` / `getByLabel` igual que RTL
- `await expect(locator).toBeVisible()` auto-wait
- No usar `page.waitForTimeout`
- Aislar datos: usuario E2E dedicado en Supabase staging

## FarmaRenovar — flujos críticos

1. Login → dashboard con bandas KPI
2. Alta paciente + primer tratamiento (factura obligatoria)
3. Marcar contactado en dashboard
4. Renovar tratamiento con regalía
5. Super admin: cambiar filtro sucursal

## Mock mode

Con `NEXT_PUBLIC_USE_MOCK=true` el E2E puede correr sin DB; documentar que no valida RLS real.
