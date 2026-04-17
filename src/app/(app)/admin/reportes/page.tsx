import { createClient } from '@/lib/supabase/server'
import { format, subDays } from 'date-fns'
import BotonDescargarReportePdf from './BotonDescargarReportePdf'
import ReportesGlobalesCliente, {
  type FarmaciaRow,
  type PacienteRow,
  type RenovacionRow,
  type ReportesPayload,
  type TratamientoRow,
} from './ReportesGlobalesCliente'

function pickTratamiento(tr: unknown): { fecha_vencimiento?: string } | null {
  if (!tr) return null
  if (Array.isArray(tr)) return (tr[0] as { fecha_vencimiento?: string }) ?? null
  return tr as { fecha_vencimiento?: string }
}

export default async function ReportesPage() {
  const supabase = await createClient()

  const desde = format(subDays(new Date(), 400), 'yyyy-MM-dd')

  const [{ data: farmaciasRaw }, { data: pacientesRaw }, { data: tratamientosRaw }, { data: renovacionesRaw }] =
    await Promise.all([
      supabase.from('farmacias').select('id, nombre, activa, creada_en').eq('activa', true),
      supabase.from('pacientes').select('id, nombre, farmacia_id, seguro_medico, creado_en, activo').eq('activo', true),
      supabase
        .from('tratamientos')
        .select('id, paciente_id, fecha_vencimiento, activo, creado_en, paciente:pacientes(farmacia_id)')
        .eq('activo', true),
      supabase
        .from('renovaciones')
        .select('id, fecha, farmacia_id, tratamiento_id, tratamiento:tratamientos(fecha_vencimiento)')
        .gte('fecha', desde),
    ])

  const farmacias: FarmaciaRow[] = (farmaciasRaw ?? []).map((f: any) => ({
    id: f.id,
    nombre: f.nombre,
    creada_en: f.creada_en,
    activa: f.activa,
  }))

  const pacientes: PacienteRow[] = (pacientesRaw ?? []).map((p: any) => ({
    id: p.id,
    nombre: p.nombre,
    farmacia_id: p.farmacia_id,
    seguro_medico: p.seguro_medico,
    creado_en: p.creado_en,
    activo: p.activo,
  }))

  const tratamientos: TratamientoRow[] = (tratamientosRaw ?? []).map((t: any) => {
    const pac = t.paciente
    const farmacia_id = Array.isArray(pac) ? pac?.[0]?.farmacia_id : pac?.farmacia_id
    return {
      id: t.id,
      paciente_id: t.paciente_id,
      farmacia_id: farmacia_id ?? '',
      fecha_vencimiento: t.fecha_vencimiento,
      activo: t.activo,
      creado_en: t.creado_en,
    }
  })

  const renovaciones: RenovacionRow[] = (renovacionesRaw ?? []).map((r: any) => {
    const tr = pickTratamiento(r.tratamiento)
    return {
      id: r.id,
      fecha: r.fecha,
      farmacia_id: r.farmacia_id,
      tratamiento_id: r.tratamiento_id,
      fecha_vencimiento_trat: tr?.fecha_vencimiento ?? null,
    }
  })

  const payload: ReportesPayload = {
    farmacias,
    pacientes,
    tratamientos,
    renovaciones,
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Reportes globales</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Analítica, tendencias y comparación por periodo · renovaciones últimos ~13 meses
          </p>
        </div>
        <BotonDescargarReportePdf />
      </div>

      <ReportesGlobalesCliente payload={payload} />
    </div>
  )
}
