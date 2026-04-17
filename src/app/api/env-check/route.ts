import { NextResponse } from 'next/server'

/**
 * Comprueba qué valor de NEXT_PUBLIC_USE_MOCK ve el servidor.
 * Útil para depurar cuando la app sigue mostrando datos mock.
 * GET /api/env-check
 */
export async function GET() {
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true'
  const raw = process.env.NEXT_PUBLIC_USE_MOCK
  return NextResponse.json({
    useMock,
    rawValue: raw ?? '(no definido)',
    message: useMock
      ? 'El servidor está en MODO MOCK. Para usar Supabase real: para el servidor, borra la carpeta .next y ejecuta de nuevo npm run dev.'
      : 'El servidor está usando Supabase real.',
  })
}
