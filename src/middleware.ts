import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { applySecurityHeaders } from '../security-headers.js'

function withSecurityHeaders(response: NextResponse) {
  return applySecurityHeaders(response)
}

export async function middleware(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
    return withSecurityHeaders(NextResponse.next({ request }))
  }

  let supabaseResponse = withSecurityHeaders(NextResponse.next({ request }))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = withSecurityHeaders(NextResponse.next({ request }))
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isPublicAuth =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/auth/callback')

  // Si no está autenticado y no está en rutas públicas de auth → redirigir al login
  if (!user && !isPublicAuth) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return withSecurityHeaders(NextResponse.redirect(url))
  }

  // Si está autenticado y va al login → redirigir al dashboard
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return withSecurityHeaders(NextResponse.redirect(url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
