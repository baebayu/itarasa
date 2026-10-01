'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CheckSquare, Wrench, FolderKanban, Plus, Book } from 'lucide-react'

export default function Navbar() {
  const pathname = usePathname()
  const navItems = [
    { name: 'Home', path: '/', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Logs', path: '/logs', icon: Wrench },
    { name: 'Report', path: '/report', icon: Book },
  ]

  const IconHome = navItems[0].icon
  const IconProjects = navItems[1].icon
  const IconTasks = navItems[2].icon
  const IconLogs = navItems[3].icon
  const IconReport = navItems[4].icon

  return (
    <>
      <div className="md:hidden fixed bottom-6 left-6 right-6 bg-white rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] flex justify-between items-center px-6 py-4 z-50">
        <Link href={navItems[0].path} className={`${pathname === navItems[0].path ? 'text-[#8B1C31]' : 'text-slate-400'}`}>
          <IconHome className="w-6 h-6" strokeWidth={2.5} />
        </Link>
        <Link href={navItems[1].path} className={`${pathname === navItems[1].path ? 'text-[#8B1C31]' : 'text-slate-400'}`}>
          <IconProjects className="w-6 h-6" strokeWidth={2.5} />
        </Link>
        
        <Link href="/add" className="bg-[#8B1C31] text-white p-4 rounded-full shadow-lg shadow-[#8B1C31]/30 -mt-10 border-4 border-slate-50 transition-transform active:scale-95">
          <Plus className="w-7 h-7" strokeWidth={3} />
        </Link>
        <Link href={navItems[2].path} className={`${pathname === navItems[2].path ? 'text-[#8B1C31]' : 'text-slate-400'}`}>
          <IconTasks className="w-6 h-6" strokeWidth={2.5} />
        </Link>
        <Link href={navItems[3].path} className={`${pathname === navItems[3].path ? 'text-[#8B1C31]' : 'text-slate-400'}`}>
          <IconLogs className="w-6 h-6" strokeWidth={2.5} />
        </Link>
        <Link href={navItems[4].path} className={`${pathname === navItems[4].path ? 'text-[#8B1C31]' : 'text-slate-400'}`}>
          <IconReport className="w-6 h-6" strokeWidth={2.5} />
        </Link>
      </div>

      <div className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-slate-100 pt-8 pb-4 z-40">
        <div className="flex items-center px-8 mb-10">
          <div className="w-10 h-10 bg-[#8B1C31] rounded-2xl flex items-center justify-center mr-4 shadow-sm shadow-[#8B1C31]/20">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <span className="text-2xl font-bold text-slate-800 tracking-tight">Arasa IT</span>
        </div>
        <nav className="flex-1 px-5 space-y-5">
          {navItems.map((item) => {
            const isActive = pathname === item.path
            const ItemIcon = item.icon
            return (
              <Link key={item.name} href={item.path} className={`flex items-center px-5 py-4 rounded-2xl transition-all duration-200 ${isActive ? 'bg-[#8B1C31] text-white shadow-md shadow-[#8B1C31]/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
                <ItemIcon className={`w-5 h-5 mr-4 ${isActive ? 'text-white' : 'text-slate-400'}`} strokeWidth={2.5} />
                <span className="font-semibold text-sm">{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}