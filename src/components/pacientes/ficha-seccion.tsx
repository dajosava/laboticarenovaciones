import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
} from 'lucide-react'
import { cn, clasesColorBadgeKpiPanelRenovaciones } from '@/lib/utils'

export const clasesSeccionFicha =
  'rounded-2xl border border-slate-200/90 bg-white p-4 shadow-md dark:border-slate-800 dark:bg-slate-900 md:p-5'

export const clasesTituloSeccionFicha =
  'text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500'

export const clasesSubtituloSeccionFicha = 'text-sm text-slate-500 dark:text-slate-400'

export const clasesArticuloInternoFicha =
  'rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950/20 md:p-5'

export function CeldaMetrica({
  icon: Icon,
  label,
  children,
  mono,
  destacarWarning,
  className,
}: {
  icon: LucideIcon
  label: string
  children: React.ReactNode
  mono?: boolean
  destacarWarning?: boolean
  className?: string
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        <Icon className="h-3 w-3 shrink-0" aria-hidden />
        {label}
      </p>
      <p
        className={cn(
          'text-sm font-medium leading-snug text-slate-900 dark:text-slate-100',
          mono && 'font-mono text-[13px]',
          destacarWarning && 'text-amber-600 dark:text-amber-400',
        )}
      >
        {children}
      </p>
    </div>
  )
}

export function PieSeccionFicha({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'mt-4 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-[11px] leading-relaxed text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function EncabezadoSeccionColapsable({
  icon: Icon,
  titulo,
  tituloClassName,
}: {
  icon: LucideIcon
  titulo: string
  tituloClassName?: string
}) {
  return (
    <summary className="group flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40">
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" aria-hidden />
        <h2 className={cn(clasesTituloSeccionFicha, tituloClassName)}>{titulo}</h2>
      </span>
      <ChevronDown
        className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180 dark:text-slate-500"
        aria-hidden
      />
    </summary>
  )
}

export function etiquetaPrioridadTratamiento(dias: number): {
  label: string
  Icon: LucideIcon
} {
  if (dias < 0) return { label: 'Vencido', Icon: AlertTriangle }
  if (dias <= 1) return { label: 'Crítico', Icon: AlertTriangle }
  if (dias <= 5) return { label: 'Urgente', Icon: Clock }
  if (dias <= 15) return { label: 'Planificación', Icon: Calendar }
  return { label: 'Al día', Icon: CheckCircle2 }
}

export function BadgePrioridadTratamiento({ dias }: { dias: number }) {
  const { label, Icon } = etiquetaPrioridadTratamiento(dias)
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
        clasesColorBadgeKpiPanelRenovaciones(dias),
      )}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      {label}
    </span>
  )
}

export function FilaMetrica({
  label,
  value,
  destacarWarning,
}: {
  label: string
  value: React.ReactNode
  destacarWarning?: boolean
}) {
  return (
    <li className="flex items-baseline justify-between gap-3 py-1">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span
        className={cn(
          'text-sm font-semibold text-slate-900 dark:text-slate-100',
          destacarWarning && 'text-amber-600 dark:text-amber-400',
        )}
      >
        {value}
      </span>
    </li>
  )
}

export function BarraProgresoTratamiento({ dias }: { dias: number }) {
  const porcentaje = Math.max(0, Math.min(100, (dias / 30) * 100))
  const color =
    dias <= 1 ? 'bg-red-500' : dias <= 5 ? 'bg-amber-500' : dias <= 15 ? 'bg-yellow-400' : 'bg-emerald-500'

  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${porcentaje}%` }} />
    </div>
  )
}
