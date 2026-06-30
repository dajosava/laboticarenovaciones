import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { NONCE_HEADER, applySecurityHeaders } from '../../../../security-headers.js'

/**
 * Intercambia el código PKCE (OAuth / magic link) por sesión y redirige.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')?.startsWith('/') ? searchParams.get('next')! : '/dashboard'
  const nonce = request.headers.get(NONCE_HEADER) ?? undefined
  const headerOptions = nonce ? { nonce } : {}

  if (!code) {
    return applySecurityHeaders(NextResponse.redirect(`${origin}/login?error=auth`), headerOptions)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return applySecurityHeaders(NextResponse.redirect(`${origin}/login?error=auth`), headerOptions)
  }

  return applySecurityHeaders(NextResponse.redirect(`${origin}${next}`), headerOptions)
}
