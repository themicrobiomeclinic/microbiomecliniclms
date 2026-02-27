'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Loader2, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/login`,
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-sage-50 p-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-sage-200 p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-12 h-12 bg-tmc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail size={24} className="text-tmc-600" />
              </div>
              <h2 className="font-display text-2xl font-semibold text-slate-900 mb-2">Check your email</h2>
              <p className="text-sage-600 mb-6">We sent a password reset link to <strong>{email}</strong></p>
              <Link href="/auth/login" className="text-tmc-600 hover:text-tmc-700 text-sm font-medium">
                ← Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="font-display text-2xl font-semibold text-slate-900">Reset password</h2>
                <p className="text-sage-600 mt-1">Enter your email and we'll send you a reset link</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
                )}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                  <input
                    id="email" type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 border border-sage-200 rounded-lg bg-sage-50 text-slate-800 placeholder-sage-400 focus:outline-none focus:ring-2 focus:ring-tmc-500/40 focus:border-tmc-500 transition-all"
                    placeholder="you@practice.com.au"
                  />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-tmc-600 hover:bg-tmc-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all disabled:opacity-50">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : 'Send reset link'}
                </button>
              </form>
              <p className="text-center text-sm text-sage-500 mt-4">
                <Link href="/auth/login" className="text-tmc-600 hover:text-tmc-700">← Back to sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
