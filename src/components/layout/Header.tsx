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
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200/80 bg-white/95 px-6 shadow-sm backdrop-blur-sm dark:border-gray-700/80 dark:bg-gray-900/95">
      {!isHome ? (
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors
                     text-gray-500 hover:text-green-700 hover:bg-green-50
                     dark:text-gray-400 dark:hover:text-green-400 dark:hover:bg-green-900/30"
        >
          <Home size={18} />
          <span className="hidden sm:inline">Panel principal</span>
        </Link>
      ) : (
        <div />
      )}

      <button
        onClick={toggleTheme}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors
                   text-gray-500 hover:text-gray-900 hover:bg-gray-100
                   dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700"
        aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      >
        {theme === 'dark' ? (
          <>
            <Sun size={18} />
            <span className="hidden sm:inline">Modo claro</span>
          </>
        ) : (
          <>
            <Moon size={18} />
            <span className="hidden sm:inline">Modo oscuro</span>
          </>
        )}
      </button>
    </header>
  )
}
