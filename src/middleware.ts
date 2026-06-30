import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  NONCE_HEADER,
  applySecurityHeaders,
  generateNonce,
} from '../security-headers.js'

function createSecureContext(request: NextRequest) {
  const nonce = generateNonce()
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(NONCE_HEADER, nonce)

  function secureResponse(response: NextResponse) {
    return applySecurityHeaders(response, { nonce })
  }

  function nextResponse() {
    return secureResponse(
      NextResponse.next({
        request: { headers: requestHeaders },
      }),
    )
  }

  function redirectResponse(url: URL) {
    return secureResponse(NextResponse.redirect(url))
  }

  return { nonce, requestHeaders, nextResponse, redirectResponse, secureResponse }
}

export async function middleware(request: NextRequest) {
  const { nextResponse, redirectResponse } = createSecureContext(request)

  if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
    return nextResponse()
  }

  let supabaseResponse = nextResponse()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = nextResponse()
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

  if (!user && !isPublicAuth) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return redirectResponse(url)
  }

  if (user && request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return redirectResponse(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
