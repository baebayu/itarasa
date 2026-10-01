import { supabase } from '@/lib/supabase'
import { Activity, ChevronRight, Wrench, AlertTriangle } from 'lucide-react'
import GreetingCard from '@/components/GreetingCard'

export const revalidate = 0

export default async function DashboardPage() {
  const [
    { data: tasks, error: tasksError },
    { data: logs, error: logsError },
    { data: projects, error: projectsError }
  ] = await Promise.all([
    supabase.from('tasks').select('*'),
    supabase.from('maintenance_logs').select('*'),
    supabase.from('projects').select('*')
  ])

  if (tasksError || logsError || projectsError) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-[2rem] border border-red-100">
        <h3 className="font-bold">Koneksi Database Gagal</h3>
      </div>
    )
  }

  const activeTasks = tasks?.filter(t => t.status === 'pending' || t.status === 'in_progress') || []
  const highPriority = activeTasks.filter(t => t.priority === 'high')
  const completedTasks = tasks?.filter(t => t.status === 'done') || []
  const recentLogs = logs?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 4) || []
  
  // Ambil maksimal 2 task urgent teratas
  const topUrgentTasks = highPriority.slice(0, 2)

  return (
    <div className="pb-32 space-y-6 md:pb-8">
      
      <GreetingCard />

      {/* Overview Card dengan Injeksi 2 Todo Urgent */}
      <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 mb-6 relative overflow-hidden">
        <div className="flex justify-between items-start mb-6">
          <span className="text-slate-500 font-medium text-sm">Overview</span>
          <Activity className="text-slate-400 w-5 h-5" />
        </div>
        
        <div className="flex flex-col gap-6">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl md:text-5xl font-extrabold text-slate-900">{activeTasks.length}</span>
            <span className="text-slate-400 text-sm font-medium">Active Tasks</span>
          </div>

          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-moonlight" />
                Most Urgent
              </span>
            </div>
            
            {topUrgentTasks.length > 0 ? (
              <div className="space-y-2.5">
                {topUrgentTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100 shadow-sm transition-all hover:border-moonlight/30">
                    <div className="flex-1 pr-3">
                      <p className="text-xs font-bold text-slate-800 line-clamp-1">{task.title}</p>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-moonlight flex-shrink-0 animate-pulse"></span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic bg-white p-3 rounded-xl border border-slate-100 text-center">
                Aman, nggak ada task urgent saat ini.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:gap-6 mb-6">
        <div className="bg-moonlight rounded-[2rem] p-6 shadow-md shadow-moonlight/20 flex flex-col justify-between aspect-square md:aspect-auto md:h-48">
          <span className="text-white/80 font-medium text-sm">High Priority</span>
          <div>
            <span className="text-3xl md:text-4xl font-extrabold text-white block mb-1">{highPriority.length}</span>
            <span className="text-white/60 text-xs font-medium">#urgent</span>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-between aspect-square md:aspect-auto md:h-48">
          <span className="text-slate-500 font-medium text-sm">Completed</span>
          <div>
            <span className="text-3xl md:text-4xl font-extrabold text-slate-900 block mb-1">{completedTasks.length}</span>
            <span className="text-slate-400 text-xs font-medium">This month</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center">
            Recent Logs
          </h2>
          <ChevronRight className="text-slate-400 w-5 h-5" />
        </div>
        
        {recentLogs.length > 0 ? (
          <div className="space-y-5">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex justify-between items-start pb-5 border-b border-slate-50 last:border-0 last:pb-0">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-slate-50 rounded-2xl">
                    <Wrench className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 mb-1">{log.issue_description}</p>
                    <p className="text-xs font-medium text-slate-500 line-clamp-1">{log.resolution || 'Pending resolution'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-400 italic text-center py-6">
            Belum ada log maintenance.
          </div>
        )}
      </div>
    </div>
  )
}