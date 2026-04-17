import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const COOKIE = 'farmarenovar-filtro-farmacia'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { data: empleado } = await supabase.from('empleados').select('rol').eq('id', user.id).single()
  if (empleado?.rol !== 'super_admin') {
    return NextResponse.json({ error: 'Solo super administrador puede filtrar por sucursal' }, { status: 403 })
  }

  let body: { farmaciaId?: string | null } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const raw = body.farmaciaId
  const farmaciaId =
    raw === '' || raw === undefined || raw === null ? null : String(raw)

  if (farmaciaId) {
    const { data: farm } = await supabase.from('farmacias').select('id').eq('id', farmaciaId).eq('activa', true).maybeSingle()
    if (!farm) {
      return NextResponse.json({ error: 'Sucursal no válida' }, { status: 400 })
    }
  }

  const res = NextResponse.json({ ok: true })
  if (!farmaciaId) {
    res.cookies.delete(COOKIE)
  } else {
    res.cookies.set(COOKIE, farmaciaId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
  }
  return res
}
