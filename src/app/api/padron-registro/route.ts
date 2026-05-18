import { createClient } from '@/lib/supabase/server'
import { derivePadronProjectUrl } from '@/lib/padron/derive-padron-base-url'
import { partesNombrePadron } from '@/lib/padron/partes-nombre-padron'
import { NextResponse } from 'next/server'

type Clasificacion = 'no_listado_cr' | 'menor' | 'extranjero'

interface PadronInsertBody {
  clasificacion: Clasificacion
  pacienteId: string
  nombreCompleto: string
  nombre?: string | null
  papellido?: string | null
  sapellido?: string | null
  cedula?: string | null
  pasaporte?: string | null
  dimex?: string | null
  fechaNacimiento?: string | null
  encargadoNombre?: string | null
  encargadoDocumento?: string | null
  encargadoTelefono?: string | null
  encargadoParentesco?: string | null
}

function toUpperOrNull(s: string | null | undefined): string | null {
  const t = (s ?? '').trim()
  return t ? t.toUpperCase() : null
}

function parseCedulaBigInt(c: string | null | undefined): number | null {
  if (!c) return null
  const d = c.replace(/\D/g, '')
  if (!d) return null
  const n = Number(d)
  if (!Number.isSafeInteger(n)) return null
  return n
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY_PADRON?.trim()
  const padronBase =
    process.env.SUPABASE_PADRON_URL?.trim() ||
    derivePadronProjectUrl(process.env.NEXT_PUBLIC_SUPABASE_URL_PADRON || '') ||
    ''

  if (!serviceRole || !padronBase) {
    return NextResponse.json(
      {
        error:
          'Configure SUPABASE_SERVICE_ROLE_KEY_PADRON en el servidor. Opcional: SUPABASE_PADRON_URL (https://xxx.supabase.co); si no, debe poder deducirse del host en NEXT_PUBLIC_SUPABASE_URL_PADRON.',
      },
      { status: 503 },
    )
  }

  let body: PadronInsertBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { clasificacion, pacienteId, nombreCompleto } = body
  if (!clasificacion || !pacienteId || !nombreCompleto?.trim()) {
    return NextResponse.json({ error: 'Faltan clasificacion, pacienteId o nombreCompleto' }, { status: 400 })
  }
  if (!['no_listado_cr', 'menor', 'extranjero'].includes(clasificacion)) {
    return NextResponse.json({ error: 'clasificacion inválida' }, { status: 400 })
  }

  const nc = nombreCompleto.trim()
  const split = partesNombrePadron(nc)
  const nom = toUpperOrNull(body.nombre) ?? (split.nombre || null)
  const pap = toUpperOrNull(body.papellido) ?? (split.papellido || null)
  const sap = toUpperOrNull(body.sapellido) ?? (split.sapellido || null)

  const pas = toUpperOrNull(body.pasaporte)
  const dim = toUpperOrNull(body.dimex)
  const cedStr = (body.cedula ?? '').trim()

  if (clasificacion === 'extranjero') {
    if (!pas && !dim && !cedStr) {
      return NextResponse.json(
        { error: 'Extranjero: indique al menos pasaporte, DIMEX o cédula/identificación' },
        { status: 400 },
      )
    }
  }
  if (clasificacion === 'menor') {
    if (!body.fechaNacimiento?.trim()) {
      return NextResponse.json({ error: 'Menor: indique fecha de nacimiento' }, { status: 400 })
    }
    if (
      !body.encargadoNombre?.trim() ||
      !body.encargadoDocumento?.trim() ||
      !body.encargadoTelefono?.trim() ||
      !body.encargadoParentesco?.trim()
    ) {
      return NextResponse.json({ error: 'Menor: complete datos del encargado' }, { status: 400 })
    }
  }

  const row: Record<string, unknown> = {
    tipo_registro: clasificacion,
    nombre_completo: nc.toUpperCase(),
    nombre: nom,
    papellido: pap,
    sapellido: sap,
    pasaporte: pas,
    dimex: dim,
    fecha_nacimiento: body.fechaNacimiento?.trim() || null,
    encargado_nombre: body.encargadoNombre?.trim().toUpperCase() || null,
    encargado_documento: body.encargadoDocumento?.trim() || null,
    encargado_telefono: body.encargadoTelefono?.trim() || null,
    encargado_parentesco: body.encargadoParentesco?.trim() || null,
    app_paciente_id: pacienteId,
  }

  const cedNum = parseCedulaBigInt(cedStr)
  row.cedula = cedNum

  const url = `${padronBase.replace(/\/$/, '')}/rest/v1/padron`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: serviceRole,
      Authorization: `Bearer ${serviceRole}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(row),
  })

  if (!res.ok) {
    const t = await res.text()
    console.error('padron-registro', res.status, t)
    return NextResponse.json({ error: `No se pudo guardar en el padrón (${res.status})`, detalle: t.slice(0, 400) }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
