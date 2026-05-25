'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PANEL_VISTA_SEGMENT, PANEL_VISTA_WRAP } from './panel-renovaciones-ui'

type FiltroVer = 'pendientes' | 'contactados' | 'todos'

type Props = {
  ver: FiltroVer
  pendientesHref: string
  contactadosHref: string
  todosHref: string
}

export default function DashboardVistaFiltros({
  ver,
  pendientesHref,
  contactadosHref,
  todosHref,
}: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  const qs = searchParams.toString()
  const currentHref = `${pathname}${qs ? `?${qs}` : ''}`

  useEffect(() => {
    setPendingHref(null)
  }, [currentHref])

  const opciones: Array<{
    id: FiltroVer
    label: string
    href: string
    activeClass: string
    inactiveClass: string
  }> = [
    {
      id: 'pendientes',
      label: 'No contactados',
      href: pendientesHref,
      activeClass: PANEL_VISTA_SEGMENT.pendientesActive,
      inactiveClass: PANEL_VISTA_SEGMENT.pendientesInactive,
    },
    {
      id: 'contactados',
      label: 'Contactados',
      href: contactadosHref,
      activeClass: PANEL_VISTA_SEGMENT.contactadosActive,
      inactiveClass: PANEL_VISTA_SEGMENT.contactadosInactive,
    },
    {
      id: 'todos',
      label: 'Todos',
      href: todosHref,
      activeClass: PANEL_VISTA_SEGMENT.todosActive,
      inactiveClass: PANEL_VISTA_SEGMENT.todosInactive,
    },
  ]

  return (
    <div className={PANEL_VISTA_WRAP} aria-live="polite">
      {opciones.map((opcion) => {
        const isActive = ver === opcion.id
        const isLoading = pendingHref === opcion.href

        return (
          <Link
            key={opcion.id}
            href={opcion.href}
            aria-busy={isLoading}
            onClick={() => {
              if (currentHref !== opcion.href) setPendingHref(opcion.href)
            }}
            className={cn(
              PANEL_VISTA_SEGMENT.base,
              'inline-flex items-center justify-center gap-1.5',
              isActive ? opcion.activeClass : opcion.inactiveClass,
              isLoading && 'cursor-wait',
            )}
          >
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
            {opcion.label}
          </Link>
        )
      })}
    </div>
  )
}
