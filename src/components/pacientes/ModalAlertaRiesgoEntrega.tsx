'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { AlertTriangle, X } from 'lucide-react'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  coincidencias: string[]
}

export default function ModalAlertaRiesgoEntrega({ open, onOpenChange, coincidencias }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[300] bg-black/50" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[301] w-[min(100vw-1.5rem,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-amber-200 bg-white p-6 shadow-xl focus:outline-none dark:border-amber-900/60 dark:bg-slate-900"
        >
          <Dialog.Description className="sr-only">
            La dirección incluye un cantón, distrito o referencia asociada a zona de riesgo para entrega. Debe
            documentarse un arreglo de entrega con el cliente.
          </Dialog.Description>
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-200">
                <AlertTriangle className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <Dialog.Title className="text-lg font-semibold text-slate-900 dark:text-white">
                  Zona de riesgo para entrega
                </Dialog.Title>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  En la dirección aparece al menos un sitio catalogado como de mayor riesgo operativo para el envío o la
                  entrega a domicilio. Debe coordinarse con el cliente un <strong>arreglo de entrega</strong> (punto
                  intermedio, lugar de trabajo u otro acuerdo) y dejarlo por escrito en el campo indicado antes de
                  guardar.
                </p>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-amber-800 dark:text-amber-300">
                  Coincidencias
                </p>
                <ul className="mt-1 list-inside list-disc text-sm text-slate-700 dark:text-slate-200">
                  {coincidencias.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
            <Dialog.Close
              type="button"
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>
          <div className="mt-6 flex justify-end">
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              >
                Entendido — completar arreglo de entrega
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
