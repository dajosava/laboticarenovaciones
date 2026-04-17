import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import ThemeProvider from '@/components/layout/ThemeProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'FarmaRenovar — Sistema de Gestión',
  description: 'Sistema interno de seguimiento y renovación de tratamientos',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
