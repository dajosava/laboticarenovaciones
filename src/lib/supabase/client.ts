import { createBrowserClient } from '@supabase/ssr'
import { createMockClient } from '@/lib/mock/supabase-mock'

function useMock(): boolean {
  if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') return true
  // En build (p. ej. Netlify) si no hay URL/key, usar mock para que no falle el prerender
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return true
  return false
}

export function createClient() {
  if (useMock()) {
    return createMockClient() as any
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
