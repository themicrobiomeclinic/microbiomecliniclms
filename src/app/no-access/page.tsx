'use client'

import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import { Lock, ExternalLink, LogOut } from 'lucide-react'

export default function NoAccessPage() {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-sage-50 flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Lock size={28} className="text-amber-600" />
        </div>

        <h1 className="font-display text-2xl font-semibold text-slate-900 mb-2">
          Course access required
        </h1>
        
        <p className="text-sage-600 mb-6 leading-relaxed">
          You're signed in as <span className="font-medium text-slate-700">{profile?.email}</span>, 
          but this account doesn't have access to the course yet.
        </p>

        <div className="space-y-3">
          <a
            href="https://themicrobiomeclinic.com.au"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-tmc-600 hover:bg-tmc-700 text-white font-medium py-3 px-6 rounded-xl transition-all w-full shadow-sm"
          >
            Purchase the course
            <ExternalLink size={16} />
          </a>

          <button
            onClick={signOut}
            className="flex items-center justify-center gap-2 text-sage-600 hover:text-sage-800 font-medium py-3 px-6 rounded-xl transition-all w-full border border-sage-200 hover:bg-sage-100"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>

        <p className="text-xs text-sage-400 mt-6">
          Already purchased? It can take a few minutes for access to activate. 
          Try refreshing the page, or contact{' '}
          <a href="mailto:education@themicrobiomeclinic.com.au" className="text-tmc-600 hover:text-tmc-700">
            education@themicrobiomeclinic.com.au
          </a>
        </p>
      </div>
    </div>
  )
}
