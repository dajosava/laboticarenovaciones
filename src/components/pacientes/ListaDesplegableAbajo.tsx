'use client'

import * as Select from '@radix-ui/react-select'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const VALOR_VACIO = '__sin_seleccion__'

export type OpcionLista = { value: string; label: string }

type Props = {
  id?: string
  value: string
  onValueChange: (value: string) => void
  opciones: OpcionLista[]
  /** Texto de la opción inicial y del trigger cuando no hay valor (solo si permitirVacio). */
  placeholder: string
  disabled?: boolean
  /**
   * Si es false, no se muestra fila “sin selección” (p. ej. provincia con un único valor).
   * El valor controlado no debe ser cadena vacía.
   */
  permitirVacio?: boolean
}

const triggerClass =
  'flex h-[42px] w-full items-center justify-between gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-left text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:shadow-slate-950/30 dark:focus:ring-emerald-500/70 dark:disabled:bg-slate-800 dark:disabled:text-slate-500'

const itemClass =
  'relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm text-gray-900 outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-green-50 data-[highlighted]:text-gray-900 data-[state=checked]:font-medium data-[disabled]:text-gray-400 dark:text-slate-100 dark:data-[highlighted]:bg-slate-600 dark:data-[highlighted]:text-white dark:data-[disabled]:text-slate-500 dark:data-[state=checked]:text-white'

/**
 * Lista desplegable que abre el panel siempre hacia abajo (`side="bottom"`, sin invertir por colisiones).
 */
export default function ListaDesplegableAbajo({
  id,
  value,
  onValueChange,
  opciones,
  placeholder,
  disabled,
  permitirVacio = true,
}: Props) {
  const vacio = permitirVacio && value === ''
  const radixValue = vacio ? VALOR_VACIO : value
  const totalFilas = opciones.length + (permitirVacio ? 1 : 0)
  /** Más de 5: altura fija ~5 ítems + scroll siempre visible para indicar que hay más opciones. */
  const listaLarga = totalFilas > 5

  return (
    <Select.Root
      value={radixValue}
      onValueChange={(v) => {
        if (!permitirVacio) {
          onValueChange(v)
          return
        }
        onValueChange(v === VALOR_VACIO ? '' : v)
      }}
      disabled={disabled}
    >
      <Select.Trigger id={id} className={triggerClass} aria-label={placeholder}>
        <Select.Value placeholder={placeholder} />
        <Select.Icon className="shrink-0 text-gray-500 dark:text-slate-400">
          <ChevronDown className="h-4 w-4" aria-hidden />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          position="popper"
          side="bottom"
          align="start"
          sideOffset={4}
          avoidCollisions={false}
          className={cn(
            'z-[200] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-900 dark:shadow-black/40',
            listaLarga ? 'max-h-[13.5rem]' : 'max-h-[280px]',
          )}
        >
          <Select.Viewport
            className={cn(
              'p-1',
              listaLarga &&
                'lista-desplegable-scrollable max-h-[11.75rem] min-h-0 overflow-y-scroll [scrollbar-gutter:stable]',
              !listaLarga && 'max-h-[260px] overflow-y-auto',
            )}
          >
            {permitirVacio ? (
              <Select.Item value={VALOR_VACIO} className={itemClass}>
                <Select.ItemText>{placeholder}</Select.ItemText>
              </Select.Item>
            ) : null}
            {opciones.map((op) => (
              <Select.Item key={op.value} value={op.value} className={itemClass}>
                <Select.ItemText>{op.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}
