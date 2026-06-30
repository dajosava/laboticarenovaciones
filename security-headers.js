/** @typedef {{ key: string; value: string }} SecurityHeader */

const NONCE_HEADER = 'x-nonce'

/** @returns {string} */
function generateNonce() {
  return Buffer.from(crypto.randomUUID()).toString('base64')
}

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

/**
 * CSP estricta con nonce (sin 'unsafe-inline' en script-src).
 * @param {string} nonce
 * @returns {string}
 */
function buildContentSecurityPolicy(nonce) {
  const isDev = process.env.NODE_ENV === 'development'
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    ...(isDev ? ["'unsafe-eval'"] : []),
  ].join(' ')

  /** @type {string[]} */
  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
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

/** Encabezados sin CSP (para next.config / Netlify; la CSP va solo en middleware). */
function getStaticSecurityHeaders() {
  return [
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  ]
}

/**
 * @param {string} nonce
 * @returns {SecurityHeader[]}
 */
function getSecurityHeaders(nonce) {
  return [
    { key: 'Content-Security-Policy', value: buildContentSecurityPolicy(nonce) },
    ...getStaticSecurityHeaders(),
  ]
}

/**
 * @param {import('next/server').NextResponse} response
 * @param {{ nonce?: string }} [options]
 */
function applySecurityHeaders(response, options = {}) {
  const { nonce } = options
  const headers = nonce ? getSecurityHeaders(nonce) : getStaticSecurityHeaders()

  for (const { key, value } of headers) {
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

/** Patrones que Observatory penaliza en script-src (solo producción) */
const CSP_SCRIPT_WEAK_PATTERNS = [
  /script-src[^;]*'unsafe-inline'/,
  /script-src[^;]*'unsafe-eval'/,
  /script-src[^;]*\bdata:/,
]

module.exports = {
  CSP_SCRIPT_WEAK_PATTERNS,
  NONCE_HEADER,
  REQUIRED_RESPONSE_HEADERS,
  applySecurityHeaders,
  buildContentSecurityPolicy,
  generateNonce,
  getSecurityHeaders,
  getStaticSecurityHeaders,
}
