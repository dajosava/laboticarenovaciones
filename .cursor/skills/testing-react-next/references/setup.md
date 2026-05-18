# Setup inicial de testing

Detectar stack en `package.json`. Si no hay ninguno, **recomendar Vitest** para proyectos Next.js modernos.

## Vitest + RTL + jsdom (recomendado Next.js)

```bash
npm install -D vitest @vitejs/plugin-react jsdom \
  @testing-library/react @testing-library/dom @testing-library/jest-dom \
  @testing-library/user-event
```

`vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'e2e'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

`vitest.setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest'
```

`package.json` scripts:

```json
"test": "vitest",
"test:run": "vitest run",
"test:coverage": "vitest run --coverage"
```

## Jest (proyectos legacy)

```bash
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/jest ts-jest
```

Usar `next/jest` si el proyecto es Next.js — ver docs oficiales de Next para `jest.config.js`.

## Playwright E2E

```bash
npm init playwright@latest
```

Añadir script: `"test:e2e": "playwright test"`.

## TypeScript

Incluir tipos en `tsconfig.json`:

```json
"types": ["vitest/globals", "@testing-library/jest-dom"]
```

O imports explícitos desde `vitest` (preferido).

## CI

```yaml
- run: npm run test:run
- run: npx playwright install --with-deps && npm run test:e2e
```

## FarmaRenovar (estado actual)

Vitest ya está configurado en el repo:

- `vitest.config.ts` — alias `@/`, `NEXT_PUBLIC_USE_MOCK=true`
- `vitest.setup.ts` — `@testing-library/jest-dom/vitest`
- Scripts: `npm run test:run`, `npm test`
- Suite inicial: `src/lib/utils/index.test.ts` (utilidades del dashboard)

Pendiente para ampliar cobertura:

1. `@testing-library/user-event` cuando haya tests de componentes
2. Factories en `src/test/factories.ts` (extraer de `references/farmarenovar-domain.md`)
3. Reutilizar `src/lib/mock/data.ts` en tests de integración
4. E2E Playwright opcional en staging
