'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Wrench, Search, Plus, X, CheckCircle2, Clock, Loader2, ChevronDown, ChevronUp, Activity, Database, FolderKanban } from 'lucide-react'

export default function LogsPage() {
  const [activeTab, setActiveTab] = useState<'timeline' | 'knowledge'>('timeline')
  
  // States
  const [activities, setActivities] = useState<any[]>([])
  const [maintenanceLogs, setMaintenanceLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // UI States
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Form States
  const [newIssue, setNewIssue] = useState('')
  const [newResolution, setNewResolution] = useState('')

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    const [actRes, maintRes] = await Promise.all([
      supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('maintenance_logs').select('*').order('created_at', { ascending: false }).limit(100)
    ])
    
    if (actRes.data) setActivities(actRes.data)
    if (maintRes.data) setMaintenanceLogs(maintRes.data)
    setLoading(false)
  }

  // Handle khusus form Maintenance (Buku Pintar)
  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const payload = {
      issue_description: newIssue,
      resolution: newResolution,
      status: newResolution.trim() ? 'resolved' : 'pending',
      input_source: 'web'
    }

    const { error } = await supabase.from('maintenance_logs').insert([payload])

    if (!error) {
      setNewIssue('')
      setNewResolution('')
      setShowForm(false)
      fetchAllData() // Refresh biar trigger otomatis nongol di Timeline
    }
    setIsSubmitting(false)
  }

  const toggleMaintenanceStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'resolved' ? 'pending' : 'resolved'
    setMaintenanceLogs(maintenanceLogs.map(log => log.id === id ? { ...log, status: newStatus } : log))
    const { error } = await supabase.from('maintenance_logs').update({ status: newStatus }).eq('id', id)
    if (error) fetchAllData()
    else fetchAllData() // Reload timeline activities
  }

  // Filters
  const filteredMaintenance = maintenanceLogs.filter(log => 
    log.issue_description.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (log.resolution && log.resolution.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const pendingCount = maintenanceLogs.filter(l => l.status === 'pending').length

  // Helper Ikon buat Timeline
  const getModuleIcon = (module: string) => {
    if (module === 'Task') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
    if (module === 'Project') return <FolderKanban className="w-4 h-4 text-indigo-500" />
    return <Wrench className="w-4 h-4 text-amber-500" />
  }

  return (
    <div className="pb-32 space-y-6 md:pb-8">
      {/* Header */}
      <div className="flex justify-between items-end mb-6 px-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Logs</h1>
          <p className="text-slate-500 text-sm mt-1">Timeline aktivitas & troubleshooting</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-moonlight text-white p-3 rounded-2xl shadow-sm hover:bg-[#6c1525] active:scale-95 transition-all"
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>
      </div>

      {/* TABS */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl">
        <button 
          onClick={() => setActiveTab('timeline')}
          className={`flex-1 flex items-center justify-center py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'timeline' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Activity className="w-4 h-4 mr-2" /> Timeline
        </button>
        <button 
          onClick={() => setActiveTab('knowledge')}
          className={`flex-1 flex items-center justify-center py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'knowledge' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Database className="w-4 h-4 mr-2" /> Buku Pintar
        </button>
      </div>

      {/* Form Input Maintenance Baru */}
      {showForm && (
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-moonlight/20 animate-in slide-in-from-top-4">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <Wrench className="w-5 h-5 mr-2 text-moonlight" /> Catat Masalah Baru
          </h2>
          <form onSubmit={handleAddLog} className="space-y-4">
            <textarea 
              required value={newIssue} onChange={(e) => setNewIssue(e.target.value)}
              placeholder="Jelaskan kendala/masalah..." 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-moonlight/20 text-sm font-semibold h-20 resize-none"
            />
            <textarea 
              value={newResolution} onChange={(e) => setNewResolution(e.target.value)}
              placeholder="Tindakan/Solusi (kosongi jika belum beres)..." 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-moonlight/20 text-sm font-semibold h-20 resize-none"
            />
            <button disabled={isSubmitting} type="submit" className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 hover:bg-slate-800 disabled:opacity-70 text-sm">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Log'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-slate-400 text-sm animate-pulse">Memuat rekam jejak sistem...</div>
      ) : activeTab === 'timeline' ? (
        
        /* --- TIMELINE VIEW --- */
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
          <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 py-2">
            {activities.length > 0 ? (
              activities.map((act) => (
                <div key={act.id} className="relative pl-6">
                  {/* Dot Marker */}
                  <div className="absolute -left-[9px] top-1 bg-white p-1 rounded-full border border-slate-200">
                    {getModuleIcon(act.module)}
                  </div>
                  
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-1">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{act.action_detail}</p>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Source: {act.module}</span>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-xs font-mono font-bold text-moonlight bg-moonlight/5 px-2 py-1 rounded-md">
                        {new Date(act.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {new Date(act.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 italic pl-6">Belum ada aktivitas terekam.</p>
            )}
          </div>
        </div>

      ) : (

        /* --- KNOWLEDGE BASE VIEW --- */
        <div className="space-y-4">
          {pendingCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between">
              <span className="text-sm font-bold text-amber-700 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Ada {pendingCount} issue yang belum terselesaikan
              </span>
            </div>
          )}

          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari buku pintar..." 
              className="w-full pl-12 pr-4 py-3.5 rounded-[1.5rem] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-moonlight/20 bg-white text-sm font-medium shadow-sm transition-all"
            />
          </div>

          <div className="space-y-3">
            {filteredMaintenance.length > 0 ? (
              filteredMaintenance.map((log) => {
                const isResolved = log.status === 'resolved'
                const isExpanded = expandedId === log.id

                return (
                  <div key={log.id} className={`bg-white rounded-2xl shadow-sm border transition-all ${isResolved ? 'border-slate-100' : 'border-amber-200 bg-amber-50/20'}`}>
                    <div 
                      className="p-4 md:p-5 cursor-pointer flex flex-col md:flex-row gap-4 justify-between"
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded-md">
                            {new Date(log.created_at).toLocaleDateString('id-ID', { day:'numeric', month:'short' })}
                          </span>
                          {!isResolved && <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md uppercase tracking-wider">Pending</span>}
                        </div>
                        <h3 className={`text-sm font-bold text-slate-800 ${isExpanded ? '' : 'line-clamp-2'}`}>{log.issue_description}</h3>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleMaintenanceStatus(log.id, log.status); }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isResolved ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 bg-slate-100 hover:bg-slate-200'}`}
                        >
                          {isResolved ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                          {isResolved ? 'Resolved' : 'Mark Done'}
                        </button>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-5 pt-2 border-t border-slate-50 md:px-5">
                        <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Resolusi / Solusi:</h4>
                        {log.resolution ? (
                          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{log.resolution}</p>
                        ) : (
                          <p className="text-sm text-slate-400 italic">Belum ada catatan solusi.</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="text-center py-6 text-sm italic text-slate-400">Log tidak ditemukan.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}