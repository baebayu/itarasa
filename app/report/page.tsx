'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Printer, Loader2, ArrowLeft, Bot, Save, FileText } from 'lucide-react'
import Link from 'next/link'

export default function ReportPage() {
  const [projects, setProjects] = useState<any[]>([])
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [isDraftGenerated, setIsDraftGenerated] = useState(false)
  const [reportId, setReportId] = useState<string | null>(null)

  const [monthYear, setMonthYear] = useState('')
  const [executiveSummary, setExecutiveSummary] = useState('')
  const [maintenanceText, setMaintenanceText] = useState('')
  const [recommendationText, setRecommendationText] = useState('')

  const handleGenerateDraft = async () => {
    setIsGenerating(true)
    
    const [projRes, taskRes, logRes] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: true }),
      supabase.from('tasks').select('*'),
      supabase.from('maintenance_logs').select('*')
    ])

    const fetchedProjects = projRes.data || []
    const tasks = taskRes.data || []
    const maintenanceLogs = logRes.data || []

    setProjects(fetchedProjects)

    const today = new Date()
    const currentMonthStr = today.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }).toUpperCase()
    setMonthYear(currentMonthStr)

    const completedTasks = tasks.filter(t => t.status === 'done')
    const resolvedLogs = maintenanceLogs.filter(l => l.status === 'resolved')

    const generatedSummary = `Secara keseluruhan, sistem IT dan infrastruktur jaringan di Arasa Store berjalan dengan stabil selama periode bulan ini. Tim IT Support telah berhasil menyelesaikan ${completedTasks.length} tugas operasional preventif dan menangani ${resolvedLogs.length} tiket kendala sistem. Tingkat ketersediaan layanan utama seperti koneksi internet dan sistem database berhasil memenuhi standar Service Level Agreement (SLA) yang ditetapkan.`
    setExecutiveSummary(generatedSummary)

    let maintText = 'Kegiatan perawatan berkala yang telah dilaksanakan pada bulan ini mencakup:\n\n• Perangkat Keras (Hardware) & Infrastruktur:\n'
    
    const hardwareKeywords = ['pc', 'komputer', 'printer', 'kabel', 'lan', 'hub', 'router', 'cctv', 'ups', 'hardware']
    const hardwareTasks = completedTasks.filter(t => hardwareKeywords.some(kw => t.title.toLowerCase().includes(kw) || (t.description && t.description.toLowerCase().includes(kw))))
    const softwareTasks = completedTasks.filter(t => !hardwareTasks.includes(t))

    if (hardwareTasks.length > 0) {
      hardwareTasks.forEach(t => maintText += ` - ${t.title}\n`)
    } else {
      maintText += ` - Pengecekan fisik dan kebersihan perangkat kasir berjalan normal.\n`
    }

    maintText += '\n• Perangkat Lunak & Keamanan (Software & Security):\n'
    if (softwareTasks.length > 0) {
      softwareTasks.forEach(t => maintText += ` - ${t.title}\n`)
    } else {
      maintText += ` - Kontrol sistem berjalan otomatis.\n`
    }
    
    if (resolvedLogs.length > 0) {
      maintText += '\n• Penanganan Kendala (Troubleshooting):\n'
      resolvedLogs.forEach(l => maintText += ` - Resolved: ${l.issue_description}\n`)
    }
    setMaintenanceText(maintText)

    const recText = 'Untuk menjaga stabilitas operasional Arasa Store di bulan mendatang, berikut adalah beberapa usulan perbaikan dan kebutuhan IT:\n\n1. \n2. '
    setRecommendationText(recText)

    setIsDraftGenerated(true)
    setReportId(null) 
    setIsGenerating(false)
  }

  const handleSaveReport = async () => {
    setIsSaving(true)
    const payload = {
      month_year: monthYear,
      executive_summary: executiveSummary,
      maintenance_text: maintenanceText,
      recommendation_text: recommendationText
    }

    const { data, error } = await supabase
      .from('monthly_reports')
      .insert([payload])
      .select('id')
      .single()

    if (!error && data) {
      setReportId(data.id)
    }
    setIsSaving(false)
  }

  const handlePrint = () => {
    window.print()
  }

  const formatStatus = (status: string) => {
    switch(status) {
      case 'active': return 'Optimal'
      case 'developing': return 'Under Developing'
      case 'planning': return 'Tahap Plan'
      case 'on_hold': return 'Tertunda'
      case 'completed': return 'Selesai'
      default: return status
    }
  }

  return (
    <div className="min-h-screen pb-32 md:pb-10 font-sans text-slate-900">
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4; margin: 20mm; }
          body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-break-avoid { page-break-inside: avoid; break-inside: avoid; }
        }
      `}} />

      <div className="no-print max-w-4xl mx-auto mb-10 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2 md:px-0">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-500 hover:text-moonlight transition-colors shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">Report Gen <Bot className="w-5 h-5 text-moonlight"/></h1>
              <p className="text-sm text-slate-500">Susun dan arsipkan laporan</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {!isDraftGenerated ? (
              <button 
                onClick={handleGenerateDraft}
                disabled={isGenerating}
                className="flex-1 md:flex-none bg-blue-600 text-white px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-70 text-sm"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Generate Draft
              </button>
            ) : (
              <>
                <button 
                  onClick={handleSaveReport}
                  disabled={isSaving || reportId !== null}
                  className={`flex-1 md:flex-none px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all text-sm ${reportId ? 'bg-emerald-100 text-emerald-700 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95'}`}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {reportId ? 'Tersimpan' : 'Simpan Laporan'}
                </button>

                {reportId && (
                  <button 
                    onClick={handlePrint}
                    className="flex-1 md:flex-none bg-moonlight text-white px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-[#6c1525] active:scale-95 transition-all text-sm"
                  >
                    <Printer className="w-4 h-4" />
                    Cetak PDF
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-5">
          {!isDraftGenerated ? (
            <div className="text-center py-10">
              <Bot className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-500">Klik "Generate Draft" untuk mulai menyusun laporan otomatis.</p>
            </div>
          ) : (
            <>
              {!reportId && (
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl mb-4">
                  <p className="text-sm text-amber-700 font-medium">Draf berhasil ditarik. Silakan lengkapi bagian Rekomendasi & Kebutuhan IT secara manual sebelum klik "Simpan Laporan".</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Bulan / Tahun</label>
                  <input type="text" value={monthYear} onChange={(e) => setMonthYear(e.target.value)} disabled={reportId !== null} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-moonlight/20 text-sm font-semibold disabled:bg-slate-50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Nama Pembuat</label>
                  <input type="text" value="BAYU AGUS NURRUDIN" disabled className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm font-bold" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Ringkasan Eksekutif (Bab 2)</label>
                <textarea value={executiveSummary} onChange={(e) => setExecutiveSummary(e.target.value)} disabled={reportId !== null} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-moonlight/20 text-sm h-32 resize-none leading-relaxed disabled:bg-slate-50" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Pemeliharaan Rutin (Bab 4)</label>
                <textarea value={maintenanceText} onChange={(e) => setMaintenanceText(e.target.value)} disabled={reportId !== null} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-moonlight/20 text-sm h-64 resize-none leading-relaxed disabled:bg-slate-50" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Rekomendasi & Kebutuhan (Bab 5)</label>
                <textarea value={recommendationText} onChange={(e) => setRecommendationText(e.target.value)} disabled={reportId !== null} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-moonlight/20 text-sm h-40 resize-none leading-relaxed disabled:bg-slate-50" />
              </div>
            </>
          )}
        </div>
      </div>

      {isDraftGenerated && (
        <div className="w-full overflow-x-auto pb-8 print:overflow-visible print:pb-0 print:w-full">
          <div className="w-[210mm] min-w-[210mm] mx-auto bg-white p-[20mm] min-h-[297mm] shadow-xl md:shadow-2xl print:shadow-none print:p-0 print:m-0 border border-slate-200 print:border-none text-[11pt] leading-relaxed">
            
            <div className="text-center mb-8 border-b-2 border-slate-800 pb-4">
              <h1 className="text-2xl font-extrabold uppercase tracking-wider mb-1">LAPORAN BULANAN IT SUPPORT</h1>
              <h2 className="text-lg font-bold text-slate-600">Arasa Store - Operasional & Infrastruktur Teknologi Informasi</h2>
            </div>

            <div className="mb-6 print-break-avoid">
              <h3 className="font-bold text-[12pt] mb-3 bg-slate-100 p-1.5 border-l-4 border-slate-800 uppercase tracking-wide">1. Informasi Dokumen</h3>
              <table className="text-[10.5pt] ml-2 text-left w-full">
                <tbody>
                  <tr>
                    <td className="font-bold w-40 align-top pb-1.5">Bulan / Tahun</td>
                    <td className="w-4 align-top pb-1.5">:</td>
                    <td className="align-top pb-1.5">{monthYear}</td>
                  </tr>
                  <tr>
                    <td className="font-bold w-40 align-top pb-1.5">Nama Pembuat</td>
                    <td className="w-4 align-top pb-1.5">:</td>
                    <td className="align-top pb-1.5">BAYU AGUS NURRUDIN</td>
                  </tr>
                  <tr>
                    <td className="font-bold w-40 align-top pb-1.5">Departemen</td>
                    <td className="w-4 align-top pb-1.5">:</td>
                    <td className="align-top pb-1.5">IT Support & Infrastructure</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mb-6 print-break-avoid">
              <h3 className="font-bold text-[12pt] mb-3 bg-slate-100 p-1.5 border-l-4 border-slate-800 uppercase tracking-wide">2. Ringkasan Eksekutif</h3>
              <p className="pl-2 text-justify whitespace-pre-wrap">{executiveSummary}</p>
            </div>

            <div className="mb-6">
              <h3 className="font-bold text-[12pt] mb-3 bg-slate-100 p-1.5 border-l-4 border-slate-800 uppercase tracking-wide">3. Kinerja Jaringan & Sistem</h3>
              {projects.length === 0 ? (
                <p className="text-slate-400 italic pl-2">Memuat data sistem...</p>
              ) : (
                <table className="w-full border-collapse border border-slate-800 mt-2 text-[10pt]">
                  <thead>
                    <tr className="bg-slate-200">
                      <th className="border border-slate-800 py-2 px-3 text-left font-bold w-1/4">Indikator Kinerja</th>
                      <th className="border border-slate-800 py-2 px-3 text-center font-bold w-[15%]">Versi Aktif</th>
                      <th className="border border-slate-800 py-2 px-3 text-left font-bold">Plan Revisi</th>
                      <th className="border border-slate-800 py-2 px-3 text-center font-bold w-1/5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((proj) => (
                      <tr key={proj.id} className="print-break-avoid">
                        <td className="border border-slate-800 py-2 px-3 font-bold align-top">{proj.name}</td>
                        <td className="border border-slate-800 py-2 px-3 text-center align-top">{proj.version || '-'}</td>
                        <td className="border border-slate-800 py-2 px-3 whitespace-pre-wrap align-top">{proj.future_plan || '-'}</td>
                        <td className="border border-slate-800 py-2 px-3 text-center font-bold align-top">{formatStatus(proj.status)}</td>
                      </tr>
                    ))}
                    <tr className="print-break-avoid bg-slate-50">
                      <td className="border border-slate-800 py-2 px-3 font-bold align-top">Penyelesaian Tiket Kendala</td>
                      <td className="border border-slate-800 py-2 px-3 text-center align-top">&lt; 2 Jam</td>
                      <td className="border border-slate-800 py-2 px-3 align-top">Avg. 35 Mins</td>
                      <td className="border border-slate-800 py-2 px-3 text-center font-bold align-top">Sangat Baik</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            <div className="mb-6 print-break-avoid">
              <h3 className="font-bold text-[12pt] mb-3 bg-slate-100 p-1.5 border-l-4 border-slate-800 uppercase tracking-wide">4. Pemeliharaan Rutin (Preventive Maintenance)</h3>
              <div className="pl-2 whitespace-pre-wrap">{maintenanceText}</div>
            </div>

            <div className="mb-6 print-break-avoid">
              <h3 className="font-bold text-[12pt] mb-3 bg-slate-100 p-1.5 border-l-4 border-slate-800 uppercase tracking-wide">5. Rekomendasi & Kebutuhan IT</h3>
              <div className="pl-2 whitespace-pre-wrap">{recommendationText}</div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}