import type { Metadata } from 'next'
import { connection } from 'next/server'
import { Toaster } from 'sonner'
import ThemeProvider from '@/components/layout/ThemeProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'FarmaRenovar — Sistema de Gestión',
  description: 'Sistema interno de seguimiento y renovación de tratamientos',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Render dinámico por request: Next.js aplica el nonce de x-nonce a scripts automáticamente.
  await connection()

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
