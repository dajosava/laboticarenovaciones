# Componentes React — RTL

## Render básico

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

describe('MiComponente', () => {
  it('renderiza el título', () => {
    render(<MiComponente titulo="Hola" />)
    expect(screen.getByRole('heading', { name: /hola/i })).toBeInTheDocument()
  })
})
```

## Providers

Si el componente usa contexto, envolver en el test:

```typescript
function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ThemeProvider>
      <AuthProvider value={mockAuth}>{ui}</AuthProvider>
    </ThemeProvider>
  )
}
```

## Formularios (react-hook-form + zod)

```typescript
it('muestra error si el teléfono está vacío', async () => {
  const user = userEvent.setup()
  render(<FormPaciente onSubmit={vi.fn()} />)

  await user.click(screen.getByRole('button', { name: /guardar/i }))

  expect(await screen.findByText(/teléfono es requerido/i)).toBeInTheDocument()
})

it('envía datos válidos', async () => {
  const user = userEvent.setup()
  const onSubmit = vi.fn()
  render(<FormPaciente onSubmit={onSubmit} />)

  await user.type(screen.getByLabelText(/nombre/i), 'María Hernández')
  await user.type(screen.getByLabelText(/teléfono/i), '88881234')
  await user.click(screen.getByRole('button', { name: /guardar/i }))

  await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({ nombre: 'María Hernández' })
  ))
})
```

## Diálogos y modales (Radix)

```typescript
await user.click(screen.getByRole('button', { name: /eliminar/i }))
expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
await user.click(screen.getByRole('button', { name: /confirmar/i }))
```

## Combobox / Select

Preferir `getByRole('combobox')` o label asociado. Con Radix Select, abrir con click y elegir opción por `getByRole('option')`.

## Async y loading

```typescript
expect(screen.getByRole('status')).toBeInTheDocument() // spinner
await waitFor(() => {
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})
expect(screen.getByText(/resultado/i)).toBeInTheDocument()
```

## Mocks comunes

```typescript
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next/image', () => ({
  default: (props: { alt: string }) => <img alt={props.alt} />,
}))
```

## `data-testid`

Solo cuando no hay rol/label accesible (tablas densas, gráficos Recharts).
