/** Parte nombre_completo como en tabla padron: nombre, papellido, sapellido (mayúsculas). */
export function partesNombrePadron(nombreCompleto: string): { nombre: string; papellido: string; sapellido: string } {
  const partes = nombreCompleto.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return { nombre: '', papellido: '', sapellido: '' }
  if (partes.length === 1) return { nombre: partes[0].toUpperCase(), papellido: '', sapellido: '' }
  if (partes.length === 2) {
    return { nombre: partes[0].toUpperCase(), papellido: partes[1].toUpperCase(), sapellido: '' }
  }
  return {
    nombre: partes[0].toUpperCase(),
    papellido: partes[1].toUpperCase(),
    sapellido: partes.slice(2).join(' ').toUpperCase(),
  }
}
