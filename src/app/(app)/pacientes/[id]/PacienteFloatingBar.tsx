'use client'

import { Pill, StickyNote } from 'lucide-react'
import Link from 'next/link'

type Props = {
  hrefRenovarUrgente: string | null
}

export default function PacienteFloatingBar({ hrefRenovarUrgente }: Props) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 pt-2 md:pb-6"
      aria-label="Acciones rápidas del paciente"
    >
      <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-slate-200/90 bg-white/95 px-3 py-2.5 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95">
        {hrefRenovarUrgente ? (
          <Link
            href={hrefRenovarUrgente}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-500"
          >
            <Pill className="h-4 w-4" aria-hidden />
            Renovar
          </Link>
        ) : null}
        <a
          href="#bloque-notas"
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
        >
          <StickyNote className="h-4 w-4" aria-hidden />
          Notas
        </a>
      </div>
    </div>
  )
}
