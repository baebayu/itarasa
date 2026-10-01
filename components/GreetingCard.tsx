'use client'
import { useState, useEffect } from 'react'

export default function GreetingCard() {
  const [time, setTime] = useState<Date | null>(null)

  useEffect(() => {
    setTime(new Date())
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Menahan render UI sampai client siap untuk mencegah hydration error
  if (!time) {
    return (
      <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 min-h-[116px] animate-pulse mb-8"></div>
    )
  }

  const hour = time.getHours()
  let greeting = 'Selamat Malam'
  if (hour >= 5 && hour < 11) greeting = 'Selamat Pagi'
  else if (hour >= 11 && hour < 15) greeting = 'Selamat Siang'
  else if (hour >= 15 && hour < 18) greeting = 'Selamat Sore'

  const dateStr = time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const timeStr = time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
      {/* Aksen background tipis */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-moonlight/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
      
      <div className="relative z-10">
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          {greeting}, <span className="text-moonlight">Bayu Agus Nurrudin</span>
        </h2>
        <p className="text-slate-500 font-medium mt-1">IT Support & Infrastructure</p>
      </div>
      
      <div className="relative z-10 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 text-left md:text-right flex flex-col md:items-end w-fit">
        <span className="text-sm font-bold text-slate-800">{dateStr}</span>
        <span className="text-xs font-bold text-moonlight mt-0.5 font-mono">{timeStr} WIB</span>
      </div>
    </div>
  )
}