import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'IT Support Dashboard - Arasa Store',
  description: 'Internal IT Service Management for Arasa Store',
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.className} antialiased bg-slate-50 text-slate-900`}>
        <Navbar />
        <main className="pb-24 md:pb-8 md:pl-72 min-h-screen">
          <div className="max-w-7xl mx-auto p-4 md:p-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  )
}