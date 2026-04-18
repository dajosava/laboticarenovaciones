'use client'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Package,
  Pill,
  RefreshCw,
  Settings,
  Stethoscope,
  User,
  UserPlus,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Empleado, Rol } from '@/types'
import { cn } from '@/lib/utils'

const SIDEBAR_COLLAPSED_KEY = 'farmarenovar-sidebar-collapsed'
const LAST_LOGIN_KEY = 'farmarenovar-last-login-at'

interface SidebarProps {
  empleado: Empleado & { farmacia?: { nombre?: string | null } | null }
  /** Solo super_admin: lista para filtrar pacientes por sucursal */
  farmaciasFiltro?: { id: string; nombre: string }[]
  /** Valor actual del filtro (cookie), solo super_admin */
  farmaciaFiltroActual?: string | null
}

type NavIcon = typeof LayoutDashboard

interface NavItem {
  href: string
  label: string
  icon: NavIcon
  roles: Rol[]
}

interface NavGroup {
  id: string
  title: string
  items: NavItem[]
}

const menuGroups: NavGroup[] = [
  {
    id: 'general',
    title: 'General',
    items: [
      {
        href: '/dashboard',
        label: 'Panel principal',
        icon: LayoutDashboard,
        roles: ['super_admin', 'admin_sucursal', 'empleado'],
      },
    ],
  },
  {
    id: 'operaciones',
    title: 'Operaciones',
    items: [
      { href: '/pacientes', label: 'Pacientes', icon: Users, roles: ['super_admin', 'admin_sucursal', 'empleado'] },
      { href: '/tratamientos', label: 'Tratamientos', icon: Pill, roles: ['super_admin', 'admin_sucursal', 'empleado'] },
      {
        href: '/renovaciones',
        label: 'Renovaciones',
        icon: RefreshCw,
        roles: ['super_admin', 'admin_sucursal', 'empleado'],
      },
    ],
  },
  {
    id: 'gestion',
    title: 'Gestión',
    items: [
      { href: '/admin/farmacias', label: 'Sucursales', icon: Building2, roles: ['super_admin'] },
      {
        href: '/admin/medicamentos',
        label: 'Medicamentos',
        icon: Package,
        roles: ['super_admin', 'admin_sucursal'],
      },
      { href: '/admin/reportes', label: 'Reportes', icon: BarChart3, roles: ['super_admin'] },
    ],
  },
]

function navItemActive(href: string, pathname: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname === href || pathname.startsWith(`${href}/`)
}

function filterGroups(rol: Rol): NavGroup[] {
  return menuGroups
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => item.roles.includes(rol)),
    }))
    .filter((g) => g.items.length > 0)
}

function initials(nombre: string): string {
  const parts = nombre.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return nombre.slice(0, 2).toUpperCase()
}

export default function Sidebar({ empleado, farmaciasFiltro = [], farmaciaFiltroActual = null }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [collapsed, setCollapsed] = useState(false)
  const [lastAccessLabel, setLastAccessLabel] = useState<string | null>(null)
  const [farmaciaSelect, setFarmaciaSelect] = useState(farmaciaFiltroActual ?? '')

  useEffect(() => {
    setFarmaciaSelect(farmaciaFiltroActual ?? '')
  }, [farmaciaFiltroActual])

  const groups = filterGroups(empleado.rol)

  useEffect(() => {
    try {
      const v = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
      if (v === '1') setCollapsed(true)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LAST_LOGIN_KEY)
      if (!raw) return
      const d = new Date(raw)
      if (Number.isNaN(d.getTime())) return
      setLastAccessLabel(formatDistanceToNow(d, { addSuffix: true, locale: es }))
    } catch {
      /* ignore */
    }
  }, [])

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      const next = !c
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const roleBadge =
    empleado.rol === 'super_admin' ? (
      <span
        className="inline-flex max-w-full items-center rounded-md border border-amber-400/35 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-100 shadow-sm"
        title="Rol en el sistema"
      >
        Super admin
      </span>
    ) : empleado.rol === 'admin_sucursal' ? (
      <span className="inline-flex max-w-full items-center rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-sky-100">
        Admin sucursal
      </span>
    ) : (
      <span className="inline-flex max-w-full items-center rounded-md border border-slate-500/40 bg-slate-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-200">
        Equipo
      </span>
    )

  return (
    <aside
      className={cn(
        'relative flex h-full shrink-0 flex-col border-r border-slate-800/90 bg-slate-950 text-slate-100 shadow-[6px_0_32px_-12px_rgba(0,0,0,0.45)] transition-[width] duration-300 ease-in-out',
        collapsed ? 'w-[4.25rem]' : 'w-64',
      )}
    >
      {/* Brand header */}
      <div
        className={cn(
          'border-b border-slate-800/90 bg-slate-950/95 px-3 py-4 backdrop-blur-sm',
          collapsed ? 'px-2' : 'px-4',
        )}
      >
        <div
          className={cn(
            'flex items-center gap-2',
            collapsed ? 'flex-col items-stretch gap-2' : 'flex-row',
          )}
        >
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 text-white shadow-md ring-1 ring-white/10',
              collapsed && 'mx-auto',
            )}
          >
            <Stethoscope className="h-5 w-5" strokeWidth={2} aria-hidden />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold tracking-tight text-white">FarmaRenovar</p>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">Sistema interno</p>
            </div>
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            title={collapsed ? 'Expandir menú' : 'Contraer menú'}
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-700/80 bg-slate-900/80 text-slate-400 transition-all duration-200 hover:border-slate-600 hover:bg-white/[0.06] hover:text-white active:scale-[0.96]',
              collapsed ? 'mx-auto' : 'ml-auto',
            )}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" aria-hidden /> : <ChevronLeft className="h-4 w-4" aria-hidden />}
          </button>
        </div>
      </div>

      {/* Context strip: rol / sucursal */}
      <div
        className={cn(
          'border-b border-slate-800/80 bg-slate-900/40 px-3 py-3',
          collapsed && 'flex flex-col items-center gap-2 px-2',
        )}
      >
        {empleado.rol === 'super_admin' ? (
          roleBadge
        ) : (
          <p
            className={cn(
              'text-xs font-semibold uppercase tracking-wide text-slate-200',
              collapsed && 'max-w-[3rem] truncate text-center text-[10px] leading-tight',
            )}
            title={empleado.farmacia?.nombre || undefined}
          >
            {empleado.farmacia?.nombre || 'Mi farmacia'}
          </p>
        )}
        {!collapsed && empleado.rol !== 'super_admin' && (
          <div className="mt-2 flex flex-wrap items-center gap-2">{roleBadge}</div>
        )}
        {collapsed && empleado.rol !== 'super_admin' && <div className="flex justify-center">{roleBadge}</div>}
        {!collapsed && lastAccessLabel && (
          <p className="mt-2 text-[11px] leading-snug text-slate-500">Último acceso {lastAccessLabel}</p>
        )}
      </div>

      {/* Filtro de sucursal (pacientes) — super admin */}
      {!collapsed && empleado.rol === 'super_admin' && farmaciasFiltro.length > 0 && (
        <div className="border-b border-slate-800/80 px-3 py-3">
          <label htmlFor="sidebar-farmacia-filtro" className="mb-1.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <Building2 className="h-3.5 w-3.5 text-slate-400" aria-hidden />
            Sucursal (pacientes)
          </label>
          <select
            id="sidebar-farmacia-filtro"
            value={farmaciaSelect}
            onChange={async (e) => {
              const v = e.target.value
              setFarmaciaSelect(v)
              const res = await fetch('/api/farmacia-filtro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ farmaciaId: v || null }),
              })
              if (!res.ok) {
                setFarmaciaSelect(farmaciaFiltroActual ?? '')
                return
              }
              router.refresh()
            }}
            className="w-full rounded-lg border border-slate-700/90 bg-slate-900/80 px-2.5 py-2 text-sm text-slate-100 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25"
          >
            <option value="">Todas las sucursales</option>
            {farmaciasFiltro.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nombre}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-[11px] leading-snug text-slate-500">
            Panel principal, pacientes, tratamientos, renovaciones y métricas usan la sucursal elegida (o todas si está vacío).
          </p>
        </div>
      )}

      {/* Alta rápida de paciente (mismos roles que el listado de pacientes) */}
      <div className={cn('border-b border-slate-800/80 px-3 py-2.5', collapsed && 'px-2')}>
        <Link
          href="/pacientes/nuevo"
          title={collapsed ? 'Nuevo paciente' : undefined}
          className={cn(
            'flex items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-white/10 transition hover:bg-brand-500 active:scale-[0.99]',
            collapsed ? 'min-h-[2.75rem] w-full px-0' : 'px-3',
          )}
        >
          <UserPlus className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          {!collapsed ? <span className="truncate">Nuevo paciente</span> : null}
        </Link>
      </div>

      {/* Navegación agrupada */}
      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto overflow-x-hidden p-3" aria-label="Principal">
        {groups.map((group) => (
          <div key={group.id}>
            <p
              className={cn(
                'mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500',
                collapsed && 'sr-only',
              )}
            >
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const active = navItemActive(item.href, pathname)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'group flex items-center gap-3 rounded-lg border-l-4 py-2.5 text-sm transition-all duration-200 ease-in-out',
                        'hover:bg-white/[0.06] active:scale-[0.99]',
                        collapsed ? 'justify-center px-2' : 'pl-[calc(0.75rem-4px)] pr-3',
                        active
                          ? 'border-brand-500 bg-brand-600/15 font-semibold text-white shadow-sm ring-1 ring-white/[0.04]'
                          : 'border-transparent font-medium text-slate-300',
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-5 w-5 shrink-0 transition-colors duration-200',
                          active ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-200',
                        )}
                        strokeWidth={active ? 2.25 : 2}
                        aria-hidden
                      />
                      {!collapsed && <span className="min-w-0 truncate">{item.label}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Usuario + menú */}
      <div className={cn('border-t border-slate-800/90 bg-slate-950/90 p-2', collapsed && 'px-1.5')}>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border border-transparent p-2 text-left transition-all duration-200 hover:border-slate-700/80 hover:bg-white/[0.05] active:scale-[0.99]',
                collapsed && 'justify-center p-2',
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-700 text-xs font-bold text-white ring-2 ring-slate-800">
                {initials(empleado.nombre)}
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{empleado.nombre}</p>
                  <p className="truncate text-xs text-slate-500">{empleado.email}</p>
                </div>
              )}
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              side="top"
              align={collapsed ? 'center' : 'start'}
              sideOffset={8}
              className={cn(
                'z-[200] min-w-[13rem] overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl',
                'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
              )}
            >
              <DropdownMenu.Item asChild>
                <Link
                  href="/cuenta/perfil"
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none transition-colors hover:bg-slate-100 data-[highlighted]:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 dark:data-[highlighted]:bg-slate-800"
                >
                  <User className="h-4 w-4 text-slate-500" aria-hidden />
                  Perfil
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <Link
                  href="/cuenta/configuracion"
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none transition-colors hover:bg-slate-100 data-[highlighted]:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 dark:data-[highlighted]:bg-slate-800"
                >
                  <Settings className="h-4 w-4 text-slate-500" aria-hidden />
                  Configuración
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 h-px bg-slate-200 dark:bg-slate-700" />
              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 outline-none transition-colors hover:bg-red-50 data-[highlighted]:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50 dark:data-[highlighted]:bg-red-950/50"
                onSelect={(e) => {
                  e.preventDefault()
                  void handleLogout()
                }}
              >
                <LogOut className="h-4 w-4" aria-hidden />
                Cerrar sesión
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </aside>
  )
}
