'use client'

import { useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

/** Cliente Supabase estable por montaje (evita re-ejecutar efectos en cada render). */
export function useSupabaseBrowser() {
  return useMemo(() => createClient(), [])
}
