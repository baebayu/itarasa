'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { FolderKanban, Plus, Clock, CheckCircle2, PlayCircle, Loader2, X, ChevronDown, ChevronUp, Code2, ListTodo, PenTool } from 'lucide-react'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // State UI
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // State Form New Project
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newPriority, setNewPriority] = useState('medium')

  // State Form Log per Project
  const [newLogContent, setNewLogContent] = useState('')
  const [isSavingLog, setIsSavingLog] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('projects')
      .select(`
        *,
        project_logs (*)
      `)
      .order('created_at', { ascending: false })
    
    if (data) {
      const sortedData = data.map(p => ({
        ...p,
        project_logs: p.project_logs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      }))
      setProjects(sortedData)
    }
    setLoading(false)
  }

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const { data, error } = await supabase
      .from('projects')
      .insert([{ 
        name: newTitle, 
        description: newDesc, 
        status: 'planning', 
        progress: 0, 
        version: '1.0.0',
        priority: newPriority 
      }])
      .select('*, project_logs(*)')

    if (!error && data) {
      setProjects([data[0], ...projects])
      setNewTitle('')
      setNewDesc('')
      setNewPriority('medium')
      setShowForm(false)
    }
    setIsSubmitting(false)
  }

  const updateProjectField = async (id: string, field: string, value: any) => {
    setProjects(projects.map(p => p.id === id ? { ...p, [field]: value } : p))
    const { error } = await supabase.from('projects').update({ [field]: value }).eq('id', id)
    if (error) fetchProjects()
  }

  const handleAddLog = async (projectId: string, logType: string) => {
    if (!newLogContent.trim()) return
    setIsSavingLog(true)

    const { data, error } = await supabase
      .from('project_logs')
      .insert([{ project_id: projectId, content: newLogContent, type: logType }])
      .select()

    if (!error && data) {
      setProjects(projects.map(p => {
        if (p.id === projectId) {
          return { ...p, project_logs: [data[0], ...p.project_logs] }
        }
        return p
      }))
      setNewLogContent('')
    }
    setIsSavingLog(false)
  }

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'planning': return { icon: PenTool, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Planning' }
      case 'developing': return { icon: Code2, color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'Developing' }
      case 'active': return { icon: PlayCircle, color: 'text-moonlight', bg: 'bg-moonlight/10', label: 'Active' }
      case 'completed': return { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Completed' }
      case 'on_hold': return { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', label: 'On Hold' }
      default: return { icon: FolderKanban, color: 'text-slate-600', bg: 'bg-slate-50', label: 'Unknown' }
    }
  }

  const getPriorityConfig = (priority: string) => {
    switch(priority) {
      case 'high': return { bg: 'bg-red-100', color: 'text-red-700', label: 'Kritis' }
      case 'medium': return { bg: 'bg-blue-50', color: 'text-blue-700', label: 'Reguler' }
      case 'low': return { bg: 'bg-slate-100', color: 'text-slate-500', label: 'Opsional' }
      default: return { bg: 'bg-blue-50', color: 'text-blue-700', label: 'Reguler' }
    }
  }

  return (
    <div className="pb-32 space-y-6 md:pb-8">
      <div className="flex justify-between items-end mb-8 px-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Projects</h1>
          <p className="text-slate-500 text-sm mt-1">Lacak progress dan changelog sistem</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-moonlight text-white p-3 rounded-2xl shadow-sm hover:bg-[#6c1525] active:scale-95 transition-all"
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-moonlight/20 mb-6 animate-in slide-in-from-top-4 fade-in duration-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4">New Project</h2>
          <form onSubmit={handleAddProject} className="space-y-4">
            <input 
              required type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-moonlight/20 focus:border-moonlight transition-all text-sm font-semibold"
              placeholder="Nama Project (ex: Sistem HR v2.0)"
            />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <textarea 
                  value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-moonlight/20 focus:border-moonlight transition-all resize-none h-20 text-sm"
                  placeholder="Deskripsi singkat..."
                />
              </div>
              <div className="col-span-2">
                <select 
                  value={newPriority} onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-moonlight/20 bg-white text-sm font-semibold text-slate-700"
                >
                  <option value="high">Prioritas: Kritis (Urgent)</option>
                  <option value="medium">Prioritas: Reguler (Biasa)</option>
                  <option value="low">Prioritas: Opsional (Enggak urgent)</option>
                </select>
              </div>
            </div>

            <button 
              disabled={isSubmitting} type="submit" 
              className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-70 text-sm"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Mulai Project'}
            </button>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10 text-slate-400 text-sm animate-pulse">Memuat data projects...</div>
        ) : projects.length > 0 ? (
          projects.map((project) => {
            const config = getStatusConfig(project.status)
            const priorityConfig = getPriorityConfig(project.priority)
            const StatusIcon = config.icon
            const isExpanded = expandedId === project.id

            return (
              <div key={project.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden transition-all relative">
                
                {/* Header Card */}
                <div 
                  className="p-5 md:p-6 cursor-pointer hover:bg-slate-50 transition-colors flex flex-col justify-between gap-4"
                  onClick={() => setExpandedId(isExpanded ? null : project.id)}
                >
                  {/* Title & Priority Badge in Top Row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${config.bg} ${config.color} shrink-0`}>
                        <StatusIcon className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-extrabold text-slate-800 leading-tight">{project.name}</h3>
                    </div>
                    {/* Badge Priority Kanan Atas */}
                    <div className="shrink-0 pt-1">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${priorityConfig.bg} ${priorityConfig.color}`}>
                        {priorityConfig.label}
                      </span>
                    </div>
                  </div>
                  
                  {/* Progress Bar & Status Tag */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex-1 mr-6">
                      {project.status === 'developing' && (
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${project.progress || 0}%` }}></div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className={`text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider ${config.bg} ${config.color}`}>
                        {config.label}
                      </span>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Area */}
                {isExpanded && (
                  <div className="p-5 md:p-6 border-t border-slate-100 bg-slate-50/50 space-y-6">
                    
                    {/* Control Panel */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Update Status</label>
                        <select
                          value={project.status}
                          onChange={(e) => updateProjectField(project.id, 'status', e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-moonlight/20 bg-white text-sm font-semibold text-slate-700"
                        >
                          <option value="planning">Planning</option>
                          <option value="developing">Developing</option>
                          <option value="active">Active</option>
                          <option value="on_hold">On Hold</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Update Prioritas</label>
                        <select
                          value={project.priority || 'medium'}
                          onChange={(e) => updateProjectField(project.id, 'priority', e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-moonlight/20 bg-white text-sm font-semibold text-slate-700"
                        >
                          <option value="high">Kritis</option>
                          <option value="medium">Reguler</option>
                          <option value="low">Opsional</option>
                        </select>
                      </div>

                      {project.status === 'developing' && (
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-slate-500 mb-1">Progress ({project.progress}%)</label>
                          <input 
                            type="range" min="0" max="100" step="5"
                            value={project.progress}
                            onChange={(e) => updateProjectField(project.id, 'progress', parseInt(e.target.value))}
                            className="w-full mt-2 accent-indigo-600"
                          />
                        </div>
                      )}

                      {project.status === 'active' && (
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-slate-500 mb-1">Current Version</label>
                          <input 
                            type="text" value={project.version}
                            onBlur={(e) => updateProjectField(project.id, 'version', e.target.value)}
                            onChange={(e) => {
                              const newProjects = projects.map(p => p.id === project.id ? { ...p, version: e.target.value } : p)
                              setProjects(newProjects)
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-moonlight/20 bg-white text-sm font-bold text-moonlight"
                          />
                        </div>
                      )}
                    </div>

                    {/* Future Plan Textarea */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><ListTodo className="w-3.5 h-3.5"/> Future Plan & Update Next</label>
                      <textarea 
                        value={project.future_plan || ''}
                        onBlur={(e) => updateProjectField(project.id, 'future_plan', e.target.value)}
                        onChange={(e) => {
                          const newProjects = projects.map(p => p.id === project.id ? { ...p, future_plan: e.target.value } : p)
                          setProjects(newProjects)
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-moonlight/20 bg-white text-sm resize-none h-20"
                        placeholder="Rencana fitur ke depannya..."
                      />
                    </div>

                    {/* Project Logs */}
                    <div className="pt-4 border-t border-slate-200">
                      <label className="block text-xs font-bold text-slate-500 mb-3">
                        {project.status === 'active' ? 'Changelog / Release Notes' : 'Progress Logs'}
                      </label>
                      
                      <div className="flex gap-2 mb-4">
                        <input 
                          type="text" value={newLogContent} onChange={(e) => setNewLogContent(e.target.value)}
                          placeholder={project.status === 'active' ? "Catat fitur baru yang dirilis..." : "Apa yang lu kerjain hari ini?"}
                          className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-moonlight/20 bg-white text-sm"
                        />
                        <button 
                          disabled={isSavingLog || !newLogContent.trim()}
                          onClick={() => handleAddLog(project.id, project.status === 'active' ? 'changelog' : 'progress')}
                          className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-800 disabled:opacity-50"
                        >
                          Catat
                        </button>
                      </div>

                      {project.project_logs && project.project_logs.length > 0 ? (
                        <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-100 max-h-48 overflow-y-auto">
                          {project.project_logs.map((log: any) => (
                            <div key={log.id} className="flex gap-3 text-sm border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                              <span className="text-slate-400 text-xs font-mono mt-0.5 whitespace-nowrap">
                                {new Date(log.created_at).toLocaleDateString('id-ID', {day:'2-digit', month:'short'})}
                              </span>
                              <p className="text-slate-700 leading-snug">
                                {log.type === 'changelog' && <span className="font-bold text-moonlight mr-1">[Added]</span>}
                                {log.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs italic text-slate-400">Belum ada catatan log.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-slate-100 text-center flex flex-col items-center">
            <FolderKanban className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-slate-500 text-sm font-medium">Belum ada project yang terdaftar.</p>
          </div>
        )}
      </div>
    </div>
  )
}