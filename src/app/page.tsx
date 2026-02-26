'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { Loader2 } from 'lucide-react'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      router.push(user ? '/dashboard' : '/auth/login')
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen bg-sage-50 flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-tmc-500" />
    </div>
  )
}
