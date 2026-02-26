'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { TopBar } from '@/components/dashboard/TopBar'
import { Loader2 } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!loading && profile && !profile.has_course_access) {
      router.push('/no-access')
    }
  }, [profile, loading, router])

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

  if (!user || !profile?.has_course_access) {
    return null
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
