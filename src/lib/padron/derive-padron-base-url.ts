/** Obtiene https://<ref>.supabase.co desde una URL de REST/RPC del mismo proyecto. */
export function derivePadronProjectUrl(rpcOrRestUrl: string): string | null {
  const u = rpcOrRestUrl.trim()
  const m = u.match(/^(https:\/\/[^/]+)/i)
  return m ? m[1] : null
}
