/**
 * Verifica que las rutas principales devuelvan los encabezados de seguridad HTTP.
 *
 * Uso:
 *   node scripts/verify-security-headers.mjs
 *   HEADERS_BASE_URL=https://laboticarenovaciones.netlify.app node scripts/verify-security-headers.mjs
 */

import {
  CSP_SCRIPT_WEAK_PATTERNS,
  REQUIRED_RESPONSE_HEADERS,
} from '../security-headers.js'

const BASE_URL = (process.env.HEADERS_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')

const ROUTES = [
  '/login',
  '/dashboard',
  '/pacientes',
  '/tratamientos',
  '/renovaciones',
  '/admin/farmacias',
  '/admin/medicamentos',
  '/admin/reportes',
  '/admin/aseguradoras',
  '/admin/empresas',
  '/admin/usuarios',
  '/cuenta/perfil',
  '/cuenta/configuracion',
  '/auth/callback',
  '/api/env-check',
]

function validateCsp(csp) {
  if (!csp) return ['content-security-policy ausente']
  const issues = []
  const isLocalhost = BASE_URL.includes('localhost') || BASE_URL.includes('127.0.0.1')

  for (const pattern of CSP_SCRIPT_WEAK_PATTERNS) {
    if (pattern.test(csp)) {
      if (isLocalhost && pattern.source.includes('unsafe-eval')) continue
      issues.push(`script-src débil: ${pattern}`)
    }
  }
  if (!/script-src[^;]*'strict-dynamic'/.test(csp)) {
    issues.push("script-src sin 'strict-dynamic'")
  }
  if (!/script-src[^;]*'nonce-/.test(csp)) {
    issues.push("script-src sin nonce")
  }
  return issues
}

async function checkRoute(path) {
  const url = `${BASE_URL}${path}`
  const response = await fetch(url, { redirect: 'manual' })
  const missing = REQUIRED_RESPONSE_HEADERS.filter((name) => !response.headers.get(name))
  const csp = response.headers.get('content-security-policy') ?? ''
  const cspIssues = validateCsp(csp)

  return {
    path,
    status: response.status,
    ok: missing.length === 0 && cspIssues.length === 0,
    missing,
    cspIssues,
  }
}

async function main() {
  console.log(`Verificando encabezados de seguridad en ${BASE_URL}\n`)

  const results = await Promise.all(ROUTES.map((path) => checkRoute(path)))
  let failed = 0

  for (const result of results) {
    const icon = result.ok ? 'OK' : 'FALTA'
    console.log(`[${icon}] ${result.path} (HTTP ${result.status})`)
    if (!result.ok) {
      failed += 1
      if (result.missing.length) {
        console.log(`      Sin: ${result.missing.join(', ')}`)
      }
      if (result.cspIssues.length) {
        console.log(`      CSP: ${result.cspIssues.join('; ')}`)
      }
    }
  }

  console.log('')
  if (failed === 0) {
    console.log(`Todas las rutas (${results.length}) incluyen encabezados estrictos con nonce.`)
    process.exit(0)
  }

  console.error(`${failed} ruta(s) con encabezados incompletos o CSP débil.`)
  process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
