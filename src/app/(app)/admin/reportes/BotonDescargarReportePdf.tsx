'use client'

import { useState } from 'react'
import { FileDown } from 'lucide-react'
import { toast } from 'sonner'

export default function BotonDescargarReportePdf() {
  const [loading, setLoading] = useState(false)

  async function handleDescargar() {
    const el = document.getElementById('reporte-global-pdf')
    if (!el) {
      toast.error('No se encontró el contenido del reporte')
      return
    }

    setLoading(true)
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: el.scrollWidth,
        height: el.scrollHeight,
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const margin = 10
      const pageWidth = 210 - margin * 2
      const pageHeight = 297 - margin * 2
      const imgWidth = pageWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = margin

      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      const nombre = `reportes-globales-${new Date().toISOString().slice(0, 10)}.pdf`
      pdf.save(nombre)
      toast.success('PDF descargado')
    } catch (e) {
      console.error(e)
      toast.error('Error al generar el PDF')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDescargar}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-xl transition-colors text-sm"
    >
      <FileDown className="w-4 h-4" />
      {loading ? 'Generando...' : 'Descargar PDF'}
    </button>
  )
}
