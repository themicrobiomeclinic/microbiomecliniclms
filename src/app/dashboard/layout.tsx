'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { TopBar } from '@/components/dashboard/TopBar'
import { Loader2 } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-sage-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-tmc-500 mx-auto mb-4" />
          <p className="text-sage-600">Loading your course...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sage-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
