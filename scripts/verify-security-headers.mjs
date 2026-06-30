/**
 * Verifica que las rutas principales devuelvan los encabezados de seguridad HTTP.
 *
 * Uso:
 *   node scripts/verify-security-headers.mjs
 *   HEADERS_BASE_URL=https://laboticarenovaciones.netlify.app node scripts/verify-security-headers.mjs
 */

import { REQUIRED_RESPONSE_HEADERS } from '../security-headers.js'

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

async function checkRoute(path) {
  const url = `${BASE_URL}${path}`
  const response = await fetch(url, { redirect: 'manual' })
  const missing = REQUIRED_RESPONSE_HEADERS.filter((name) => !response.headers.get(name))

  return {
    path,
    status: response.status,
    ok: missing.length === 0,
    missing,
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
      console.log(`      Sin: ${result.missing.join(', ')}`)
    }
  }

  console.log('')
  if (failed === 0) {
    console.log(`Todas las rutas (${results.length}) incluyen los encabezados requeridos.`)
    process.exit(0)
  }

  console.error(`${failed} ruta(s) sin encabezados completos.`)
  process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
