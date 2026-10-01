'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function AddPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'task' | 'log'>('task')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // State form Task
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [taskPriority, setTaskPriority] = useState('medium')
  const [taskCategory, setTaskCategory] = useState('ad_hoc')

  // State form Log
  const [logIssue, setLogIssue] = useState('')
  const [logResolution, setLogResolution] = useState('')

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const { error } = await supabase
      .from('tasks')
      .insert([
        { 
          title: taskTitle, 
          description: taskDesc, 
          priority: taskPriority, 
          category: taskCategory 
        }
      ])

    setIsSubmitting(false)
    if (!error) router.push('/tasks')
  }

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const { error } = await supabase
      .from('maintenance_logs')
      .insert([
        { 
          issue_description: logIssue, 
          resolution: logResolution,
          input_source: 'web'
        }
      ])

    setIsSubmitting(false)
    if (!error) router.push('/logs') // Pastikan lu bikin /logs nanti
  }

  return (
    <div className="pb-32 md:pb-8">
      <div className="flex items-center gap-4 mb-8 px-2">
        <Link href="/" className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-500 hover:text-moonlight transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Input Data</h1>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <button 
            onClick={() => setActiveTab('task')}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'task' ? 'text-moonlight border-b-2 border-moonlight bg-slate-50' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            New Task
          </button>
          <button 
            onClick={() => setActiveTab('log')}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'log' ? 'text-moonlight border-b-2 border-moonlight bg-slate-50' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            Maintenance Log
          </button>
        </div>

        <div className="p-6 md:p-8">
          {activeTab === 'task' ? (
            <form onSubmit={handleTaskSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Judul Task</label>
                <input 
                  required
                  type="text" 
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-moonlight/20 focus:border-moonlight transition-all"
                  placeholder="Contoh: Kabel LAN Kasir 3 putus"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Deskripsi (Opsional)</label>
                <textarea 
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-moonlight/20 focus:border-moonlight transition-all resize-none h-24"
                  placeholder="Detail masalah..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Prioritas</label>
                  <select 
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-moonlight/20 focus:border-moonlight bg-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Kategori</label>
                  <select 
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-moonlight/20 focus:border-moonlight bg-white"
                  >
                    <option value="ad_hoc">Ad-Hoc (Dadakan)</option>
                    <option value="routine">Routine</option>
                  </select>
                </div>
              </div>

              <button 
                disabled={isSubmitting}
                type="submit" 
                className="w-full mt-6 bg-moonlight text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 hover:bg-[#6c1525] active:scale-[0.98] transition-all disabled:opacity-70 disabled:active:scale-100"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {isSubmitting ? 'Menyimpan...' : 'Simpan Task'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Kendala / Masalah</label>
                <textarea 
                  required
                  value={logIssue}
                  onChange={(e) => setLogIssue(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-moonlight/20 focus:border-moonlight transition-all resize-none h-24"
                  placeholder="Contoh: Router lantai 2 mati..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Tindakan / Resolusi</label>
                <textarea 
                  value={logResolution}
                  onChange={(e) => setLogResolution(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-moonlight/20 focus:border-moonlight transition-all resize-none h-24"
                  placeholder="Contoh: Sudah direstart dan diganti kabel adapternya..."
                />
              </div>

              <button 
                disabled={isSubmitting}
                type="submit" 
                className="w-full mt-6 bg-slate-900 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-70 disabled:active:scale-100"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {isSubmitting ? 'Menyimpan...' : 'Simpan Log'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}