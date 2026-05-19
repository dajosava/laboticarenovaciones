/** Estilos compartidos del panel de renovaciones (toolbar, vista y acciones por fila). */

export const PANEL_ACCION_BTN =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 shadow-sm transition hover:brightness-95 dark:hover:brightness-110'

export const PANEL_ACCION_ESTILOS = {
  contactado: `${PANEL_ACCION_BTN} border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-500/20 dark:text-emerald-200`,
  renovar: `${PANEL_ACCION_BTN} border-brand-500 bg-brand-500/15 text-brand-700 hover:bg-brand-500/25 dark:border-brand-300 dark:bg-brand-500/45 dark:text-white dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] dark:hover:border-brand-200 dark:hover:bg-brand-500/55 dark:hover:brightness-100`,
  actividad: `${PANEL_ACCION_BTN} border-sky-500 bg-sky-500/15 text-sky-700 dark:border-sky-400 dark:bg-sky-500/20 dark:text-sky-200`,
  ficha: `${PANEL_ACCION_BTN} border-violet-500 bg-violet-500/15 text-violet-700 dark:border-violet-400 dark:bg-violet-500/20 dark:text-violet-200`,
  desmarcar: `${PANEL_ACCION_BTN} border-amber-500 bg-amber-500/15 text-amber-700 dark:border-amber-400 dark:bg-amber-500/20 dark:text-amber-200`,
} as const

export const PANEL_ACCION_LABEL = {
  base: 'hidden text-center text-[10px] font-semibold leading-tight whitespace-nowrap hover:underline sm:block',
  contactado: 'text-emerald-700 dark:text-emerald-100 dark:hover:text-emerald-50',
  desmarcar: 'text-amber-700 dark:text-amber-100 dark:hover:text-amber-50',
  renovar: 'text-brand-700 dark:text-brand-100 dark:hover:text-white',
  actividad: 'text-sky-700 dark:text-sky-100 dark:hover:text-sky-50',
  ficha: 'text-violet-700 dark:text-violet-100 dark:hover:text-violet-50',
} as const

const PANEL_TOOLBAR_BTN =
  'inline-flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-semibold shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed dark:hover:brightness-110'

export const PANEL_TOOLBAR_ESTILOS = {
  marcarContactados: `${PANEL_TOOLBAR_BTN} border-emerald-600 bg-emerald-500/20 text-emerald-900 enabled:bg-emerald-600 enabled:text-white enabled:shadow-md enabled:hover:bg-emerald-500 disabled:border-emerald-500 disabled:bg-emerald-500/15 disabled:text-emerald-800 dark:border-emerald-400 dark:bg-emerald-500/25 dark:text-emerald-100 dark:enabled:bg-emerald-600 dark:enabled:text-white dark:disabled:border-emerald-500 dark:disabled:bg-emerald-500/15 dark:disabled:text-emerald-200`,
  exportar: `${PANEL_TOOLBAR_BTN} border-sky-600 bg-sky-500/20 text-sky-900 shadow-sm hover:bg-sky-500/30 dark:border-sky-400 dark:bg-sky-500/25 dark:text-sky-100 dark:hover:bg-sky-500/35`,
} as const

export const PANEL_VISTA_WRAP =
  'flex flex-wrap items-center gap-1 rounded-lg border-2 border-slate-200 bg-slate-50/90 p-1 dark:border-slate-600 dark:bg-slate-900/60'

export const PANEL_VISTA_SEGMENT = {
  base: 'rounded-md border-2 px-3 py-1.5 text-xs font-semibold transition sm:text-sm',
  pendientesActive:
    'border-emerald-600 bg-emerald-600 text-white shadow-sm dark:border-emerald-500 dark:bg-emerald-600',
  pendientesInactive:
    'border-transparent bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-500/10 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-emerald-600/50 dark:hover:bg-emerald-500/10',
  contactadosActive:
    'border-amber-600 bg-amber-600 text-white shadow-sm dark:border-amber-500 dark:bg-amber-600',
  contactadosInactive:
    'border-transparent bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-500/10 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-amber-600/50 dark:hover:bg-amber-500/10',
  todosActive:
    'border-brand-600 bg-brand-600 text-white shadow-sm dark:border-brand-500 dark:bg-brand-600',
  todosInactive:
    'border-transparent bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-500/10 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-brand-600/50 dark:hover:bg-brand-500/10',
} as const

export const PANEL_LINK_PACIENTES =
  'inline-flex items-center rounded-lg border-2 border-brand-500/40 bg-brand-500/10 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-500/20 dark:border-brand-400/50 dark:bg-brand-500/15 dark:text-brand-200 sm:text-sm'

export const PANEL_KPI_CHIP =
  'inline-flex items-center gap-1 rounded-lg border-2 border-slate-400/50 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800 transition hover:bg-slate-200 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700'
