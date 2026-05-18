# Zustand y estado global

## Reset entre tests

```typescript
import { useMiStore } from './miStore'

beforeEach(() => {
  useMiStore.setState(useMiStore.getInitialState(), true)
})
```

## Render con store real

```typescript
function renderWithStore(ui: React.ReactElement, state?: Partial<StoreState>) {
  if (state) useMiStore.setState(state)
  return render(ui)
}

it('muestra contador del store', () => {
  renderWithStore(<Badge />, { count: 5 })
  expect(screen.getByText('5')).toBeInTheDocument()
})
```

## Mock del módulo (si el store es pesado)

```typescript
vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn((selector) =>
    selector({ user: mockUser, logout: vi.fn() })
  ),
}))
```

## Selectores

Testear componentes que usan `useStore(s => s.x)` con estado pre-cargado; no testear el store y el componente en el mismo archivo salvo que sea crítico.

## FarmaRenovar

Este proyecto **no usa Zustand**. Estado vía Server Components, Server Actions, `useState` local y cookie `farmarenovar-filtro-farmacia`. Mockear cookie/API en su lugar.
