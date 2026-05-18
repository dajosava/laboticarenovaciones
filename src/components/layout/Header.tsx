'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from './ThemeProvider'
import { Sun, Moon, Home } from 'lucide-react'

export default function Header() {
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()
  const isHome = pathname === '/dashboard'

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200/80 bg-white/95 px-6 shadow-sm backdrop-blur-sm dark:border-slate-800/90 dark:bg-slate-950/95 dark:text-slate-100">
      {!isHome ? (
        <Link
          href="/dashboard"
          className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-green-50 hover:text-green-700 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
        >
          <Home
            className="h-5 w-5 shrink-0 text-slate-500 transition-colors group-hover:text-green-700 dark:text-slate-500 dark:group-hover:text-slate-200"
            strokeWidth={2}
            aria-hidden
          />
          <span className="hidden sm:inline">Panel principal</span>
        </Link>
      ) : (
        <div />
      )}

      <button
        type="button"
        onClick={toggleTheme}
        className="flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm font-medium text-gray-500 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-white/[0.06] dark:hover:text-white"
        aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      >
        {theme === 'dark' ? (
          <>
            <Sun className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
            <span className="hidden sm:inline">Modo claro</span>
          </>
        ) : (
          <>
            <Moon className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
            <span className="hidden sm:inline">Modo oscuro</span>
          </>
        )}
      </button>
    </header>
  )
}
