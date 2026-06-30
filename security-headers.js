/** @typedef {{ key: string; value: string }} SecurityHeader */

/** @returns {string} */
function buildConnectSrc() {
  /** @type {Set<string>} */
  const sources = new Set(["'self'", 'https://*.supabase.co', 'wss://*.supabase.co'])

  for (const key of ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL_PADRON']) {
    const url = process.env[key]
    if (!url) continue
    try {
      sources.add(new URL(url).origin)
    } catch {
      /* ignore invalid URL */
    }
  }

  return [...sources].join(' ')
}

/** @returns {string} */
function buildContentSecurityPolicy() {
  /** @type {string[]} */
  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    `connect-src ${buildConnectSrc()}`,
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ]

  if (process.env.NODE_ENV === 'production') {
    directives.push('upgrade-insecure-requests')
  }

  return directives.join('; ')
}

/** @returns {SecurityHeader[]} */
function getSecurityHeaders() {
  return [
    { key: 'Content-Security-Policy', value: buildContentSecurityPolicy() },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  ]
}

/** @param {import('next/server').NextResponse} response */
function applySecurityHeaders(response) {
  for (const { key, value } of getSecurityHeaders()) {
    response.headers.set(key, value)
  }
  return response
}

/** Encabezados exigidos por la verificación HTTP (Mozilla Observatory, etc.) */
const REQUIRED_RESPONSE_HEADERS = [
  'content-security-policy',
  'referrer-policy',
  'x-frame-options',
  'x-content-type-options',
  'cross-origin-resource-policy',
]

module.exports = {
  REQUIRED_RESPONSE_HEADERS,
  applySecurityHeaders,
  buildContentSecurityPolicy,
  getSecurityHeaders,
}
