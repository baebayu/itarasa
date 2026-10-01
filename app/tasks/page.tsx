'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle2, Circle, Calendar, Plus, X, FolderKanban, Loader2, Clock, Search, LayoutList } from 'lucide-react'

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // UI State
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [selectedDate, setSelectedDate] = useState<string | null>(null) // State buat klik tanggal kalender
  
  // Form State
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [priority, setPriority] = useState('medium')
  const [category, setCategory] = useState('ad_hoc')
  const [projectId, setProjectId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [recurrence, setRecurrence] = useState('none')

  const engineRun = useRef(false)

  // Helper Date (Normalisasi ke Local YYYY-MM-DD biar nggak bentrok UTC)
  const getLocalYYYYMMDD = (dateObj: Date) => {
    return dateObj.getFullYear() + '-' + String(dateObj.getMonth() + 1).padStart(2, '0') + '-' + String(dateObj.getDate()).padStart(2, '0')
  }
  const todayRaw = new Date()
  const todayStr = getLocalYYYYMMDD(todayRaw)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: pData } = await supabase.from('projects').select('id, name').order('name')
    if (pData) setProjects(pData)

    const { data: tData } = await supabase
      .from('tasks')
      .select(`*, projects(name)`)
      .order('due_date', { ascending: true })
      .order('created_at', { ascending: false })
    
    if (tData) {
      setTasks(tData)
      if (!engineRun.current) {
        engineRun.current = true
        runSmartEngine(tData)
      }
    }
    setLoading(false)
  }

  const runSmartEngine = async (existingTasks: any[]) => {
    const dayOfWeek = todayRaw.getDay()
    if (dayOfWeek === 0) return // Minggu Libur

    const recurringTemplates = existingTasks.filter(t => t.recurrence_type !== 'none' && t.last_generated_date !== todayStr)
    if (recurringTemplates.length === 0) return

    let newTasksToInsert: any[] = []
    let templatesToUpdate: string[] = []

    recurringTemplates.forEach(rt => {
      let shouldSpawn = false
      if (rt.recurrence_type === 'daily') {
        shouldSpawn = true
        if (dayOfWeek === 5 && rt.priority !== 'high') shouldSpawn = false // Jumat Lite
      }

      if (shouldSpawn) {
        newTasksToInsert.push({
          title: rt.title, description: rt.description, priority: rt.priority, category: rt.category,
          project_id: rt.project_id, status: 'pending', due_date: new Date().toISOString(), recurrence_type: 'none'
        })
        templatesToUpdate.push(rt.id)
      } else {
        templatesToUpdate.push(rt.id)
      }
    })

    if (newTasksToInsert.length > 0) await supabase.from('tasks').insert(newTasksToInsert)
    if (templatesToUpdate.length > 0) await supabase.from('tasks').update({ last_generated_date: todayStr }).in('id', templatesToUpdate)
    if (newTasksToInsert.length > 0 || templatesToUpdate.length > 0) fetchData()
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    let finalDueDate = dueDate ? new Date(dueDate) : new Date()
    if (!dueDate) {
      if (priority === 'high') finalDueDate.setDate(finalDueDate.getDate() + 1)
      else if (priority === 'medium') finalDueDate.setDate(finalDueDate.getDate() + 3)
      else finalDueDate.setDate(finalDueDate.getDate() + 7)
    }

    const payload = {
      title, description: desc, priority, category,
      project_id: projectId || null, status: 'pending',
      due_date: finalDueDate.toISOString(), recurrence_type: recurrence
    }

    const { error } = await supabase.from('tasks').insert([payload])
    if (!error) {
      setTitle(''); setDesc(''); setProjectId(''); setDueDate(''); setRecurrence('none')
      setShowForm(false); fetchData()
    }
    setIsSubmitting(false)
  }

  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === 'done' ? 'pending' : 'done'
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t))
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', id)
    if (error) fetchData()
  }

  // --- LOGIC: Virtual Task Engine untuk Kalender ---
  const getTasksForDate = (targetDateStr: string, targetDateObj: Date) => {
    // 1. Task asli yang ada di DB untuk tanggal ini
    const realTasks = tasks.filter(t => t.due_date && getLocalYYYYMMDD(new Date(t.due_date)) === targetDateStr && t.recurrence_type === 'none')
    
    // 2. Task bayangan (Proyeksi rutinitas buat masa depan)
    let virtualTasks: any[] = []
    const dayOfWeek = targetDateObj.getDay()

    if (targetDateStr > todayStr && dayOfWeek !== 0) {
      let templates = tasks.filter(t => t.recurrence_type === 'daily')
      if (dayOfWeek === 5) templates = templates.filter(t => t.priority === 'high') // Jumat Lite
      
      virtualTasks = templates.map(t => ({
        ...t,
        id: `virtual-${t.id}-${targetDateStr}`,
        due_date: targetDateObj.toISOString(),
        isVirtual: true,
        status: 'pending'
      }))
    }
    return [...realTasks, ...virtualTasks]
  }

  // --- LIST VIEW GROUPING (Rollover Hari Ini) ---
  const activeTasks = tasks.filter(t => t.status !== 'done' && t.recurrence_type === 'none' && t.title.toLowerCase().includes(searchQuery.toLowerCase()))
  const completedTasks = tasks.filter(t => t.status === 'done' && t.title.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 10)

  const groupedTasks = activeTasks.reduce((acc, task) => {
    const taskDateObj = new Date(task.due_date || todayRaw)
    const taskDateStr = getLocalYYYYMMDD(taskDateObj)
    const isRolloverOrToday = taskDateStr <= todayStr
    
    const groupKey = isRolloverOrToday ? 'Hari Ini' : taskDateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })
    if (!acc[groupKey]) acc[groupKey] = []
    acc[groupKey].push(task)
    return acc
  }, {} as Record<string, any[]>)

  const getPriorityBadge = (p: string) => {
    if (p === 'high') return <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-red-100 text-red-700 uppercase">Kritis</span>
    if (p === 'low') return <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-500 uppercase">Opsional</span>
    return <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-blue-50 text-blue-700 uppercase">Reguler</span>
  }

  // --- REUSABLE COMPONENT: Task Card ---
  const TaskCard = ({ task }: { task: any }) => {
    const isVirtual = task.isVirtual
    const isRollover = !isVirtual && task.due_date && getLocalYYYYMMDD(new Date(task.due_date)) < todayStr

    return (
      <div className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${isVirtual ? 'border-dashed border-slate-200 bg-slate-50/50 opacity-80' : isRollover ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100 bg-white hover:border-moonlight/30 shadow-sm'}`}>
        <button disabled={isVirtual} onClick={() => toggleStatus(task.id, task.status)} className={`mt-1 flex-shrink-0 transition-colors ${task.status === 'done' ? 'text-emerald-500' : isVirtual ? 'text-slate-200' : 'text-slate-300 hover:text-moonlight'}`}>
          {task.status === 'done' ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <p className={`text-sm font-bold truncate ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.title}</p>
          </div>
          {task.description && <p className="text-xs text-slate-500 mb-2 line-clamp-1">{task.description}</p>}
          
          <div className="flex flex-wrap gap-2 items-center mt-2">
            {getPriorityBadge(task.priority)}
            {isVirtual && <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-purple-100 text-purple-700 uppercase">Projected</span>}
            {isRollover && <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-amber-100 text-amber-700 uppercase">Tunggakan</span>}
          </div>
        </div>
      </div>
    )
  }

  // --- CALENDAR VIEW BUILDER ---
  const renderCalendar = () => {
    const year = todayRaw.getFullYear()
    const month = todayRaw.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDay = new Date(year, month, 1).getDay()
    
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    const blanks = Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }, (_, i) => i)

    return (
      <div className="animate-in fade-in duration-300">
        <div className="bg-white rounded-[2rem] p-5 md:p-6 shadow-sm border border-slate-100">
          <div className="text-center font-extrabold text-lg text-slate-800 mb-6">{todayRaw.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</div>
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 mb-3">
            <div>Sn</div><div>Sl</div><div>Rb</div><div>Km</div><div>Jm</div><div>Sb</div><div>Mg</div>
          </div>
          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {blanks.map(b => <div key={`blank-${b}`} className="p-2"></div>)}
            {days.map(day => {
              const currentD = new Date(year, month, day)
              const dateStr = getLocalYYYYMMDD(currentD)
              const tasksOnThisDay = getTasksForDate(dateStr, currentD)
              const isToday = dateStr === todayStr
              const isSelected = selectedDate === dateStr

              return (
                <div 
                  key={day} 
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer 
                    ${isSelected ? 'border-moonlight bg-moonlight text-white shadow-md' : 
                      isToday ? 'border-moonlight bg-moonlight/10 text-moonlight' : 
                      'border-slate-50 bg-slate-50 text-slate-600 hover:border-moonlight/30'} 
                  `}
                >
                  <span className={`font-bold text-sm mb-1 ${isSelected ? 'text-white' : ''}`}>{day}</span>
                  {tasksOnThisDay.length > 0 && (
                    <span className={`w-4 h-4 md:w-5 md:h-5 flex items-center justify-center rounded-full text-[9px] font-bold ${isSelected ? 'bg-white text-moonlight' : 'bg-slate-800 text-white'}`}>
                      {tasksOnThisDay.length}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Panel Detail Hari yang Diklik */}
        {selectedDate && (
          <div className="mt-6 bg-slate-50 border border-slate-100 rounded-[2rem] p-5 md:p-6 shadow-inner animate-in slide-in-from-top-4">
            <h3 className="text-sm font-extrabold text-slate-800 mb-4 flex items-center justify-between">
              <span className="flex items-center"><Calendar className="w-4 h-4 mr-2 text-moonlight"/> Jadwal: {new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
              <button onClick={() => setSelectedDate(null)} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4"/></button>
            </h3>
            <div className="space-y-3">
              {getTasksForDate(selectedDate, new Date(selectedDate)).length > 0 ? (
                getTasksForDate(selectedDate, new Date(selectedDate)).map(task => <TaskCard key={task.id} task={task} />)
              ) : (
                <div className="text-center py-6 text-sm italic text-slate-400">Kosong, nggak ada agenda di hari ini.</div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="pb-32 space-y-6 md:pb-8">
      
      {/* Header & View Toggle */}
      <div className="flex justify-between items-end mb-4 px-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Smart Tasks</h1>
          <p className="text-slate-500 text-sm mt-1">To-Do & Automasi harian</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setViewMode(viewMode === 'list' ? 'calendar' : 'list'); setSelectedDate(null); }} className="bg-white text-slate-600 p-3 rounded-2xl shadow-sm border border-slate-100 hover:text-moonlight transition-all">
            {viewMode === 'list' ? <Calendar className="w-5 h-5" /> : <LayoutList className="w-5 h-5" />}
          </button>
          <button onClick={() => setShowForm(!showForm)} className="bg-moonlight text-white p-3 rounded-2xl shadow-sm hover:bg-[#6c1525] active:scale-95 transition-all">
            {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input 
          type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari task..." 
          className="w-full pl-12 pr-4 py-3.5 rounded-[1.5rem] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-moonlight/20 bg-white text-sm font-medium shadow-sm transition-all"
        />
      </div>

      {showForm && (
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-moonlight/20 mb-6 animate-in slide-in-from-top-4">
          <h2 className="text-lg font-bold text-slate-800 mb-4">New Task</h2>
          <form onSubmit={handleAddTask} className="space-y-4">
            <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul Task..." className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-moonlight/20 text-sm font-semibold" />
            <div className="grid grid-cols-2 gap-4">
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="col-span-2 w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 bg-white">
                <option value="">-- Tidak Terikat Project --</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 bg-white">
                <option value="high">Kritis (+1 Hari)</option>
                <option value="medium">Reguler (+3 Hari)</option>
                <option value="low">Opsional (+7 Hari)</option>
              </select>
              <select value={recurrence} onChange={(e) => setRecurrence(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 bg-white">
                <option value="none">Sekali Selesai</option>
                <option value="daily">Rutin Tiap Hari (Auto)</option>
              </select>
            </div>
            <button disabled={isSubmitting} type="submit" className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 hover:bg-slate-800 disabled:opacity-70 text-sm">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tugaskan'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-slate-400 text-sm animate-pulse">Menyusun prioritas kalender...</div>
      ) : viewMode === 'calendar' ? (
        renderCalendar()
      ) : (
        <div className="space-y-6">
          {Object.keys(groupedTasks).length > 0 ? (
            Object.keys(groupedTasks).map(groupDate => (
              <div key={groupDate} className="relative">
                <h2 className="text-sm font-extrabold text-slate-800 mb-4 sticky top-0 bg-[#f8fafc] py-2 z-10 flex items-center gap-2">
                  <Clock className={`w-4 h-4 ${groupDate === 'Hari Ini' ? 'text-moonlight' : 'text-slate-400'}`} />
                  {groupDate}
                </h2>
                <div className="space-y-3">
                  {groupedTasks[groupDate].map((task: any) => <TaskCard key={task.id} task={task} />)}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs italic text-slate-400 text-center py-4">Tidak ada task aktif.</p>
          )}

          {completedTasks.length > 0 && (
            <div className="pt-8 opacity-60">
              <h2 className="text-sm font-extrabold text-slate-400 mb-4 uppercase tracking-wider text-center">Selesai (History)</h2>
              <div className="space-y-3">
                {completedTasks.map(task => <TaskCard key={task.id} task={task} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}