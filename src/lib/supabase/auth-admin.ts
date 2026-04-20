/**
 * Llamadas a la API Admin de Auth (GoTrue) con service role.
 * Solo usar en servidor (Server Actions / Route Handlers).
 */

type AuthUserRow = { id: string; email?: string | null }

export async function buscarAuthUserIdPorEmail(email: string): Promise<{ id?: string; email?: string; error?: string }> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const needle = email.trim().toLowerCase()
  if (!needle) return { error: 'Indica un correo' }
  if (!base || !key) {
    return { error: 'Falta SUPABASE_SERVICE_ROLE_KEY en el servidor para buscar por correo. Usa el UUID manual o configura la variable.' }
  }

  const perPage = 200
  let page = 1

  while (page <= 50) {
    const url = new URL(`${base}/auth/v1/admin/users`)
    url.searchParams.set('page', String(page))
    url.searchParams.set('per_page', String(perPage))

    const res = await fetch(url.toString(), {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      const t = await res.text().catch(() => '')
      return { error: t || `Error Auth Admin (${res.status})` }
    }

    const json = (await res.json()) as { users?: AuthUserRow[] }
    const users = json.users ?? []
    const found = users.find((u) => (u.email ?? '').toLowerCase() === needle)
    if (found) return { id: found.id, email: found.email ?? undefined }
    if (users.length < perPage) break
    page++
  }

  return { error: 'No hay ningún usuario en Auth con ese correo. Crea primero el usuario en Supabase → Authentication → Users.' }
}
