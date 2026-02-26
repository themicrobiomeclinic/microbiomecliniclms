'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { LogOut, User } from 'lucide-react'

export function TopBar() {
  const { profile, signOut } = useAuth()

  return (
    <header className="h-14 bg-white border-b border-sage-200/80 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-sm font-medium text-sage-500">
          Microbiome Medicine for General Practice
        </h2>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-sage-600">
          <div className="w-7 h-7 bg-sage-100 rounded-full flex items-center justify-center">
            <User size={14} className="text-sage-500" />
          </div>
          <span className="hidden sm:inline">{profile?.full_name || profile?.email}</span>
        </div>
        <button
          onClick={signOut}
          className="text-sage-400 hover:text-sage-600 transition-colors"
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}
