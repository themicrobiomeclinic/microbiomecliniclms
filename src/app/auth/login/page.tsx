'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import Link from 'next/link'
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signIn(email, password)
    
    if (error) {
      setError(error.message === 'Invalid login credentials' 
        ? 'Invalid email or password. Please try again.'
        : error.message
      )
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-925 relative overflow-hidden items-center justify-center p-12">
        {/* Subtle background texture */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }} />
        </div>
        
        {/* Decorative gradient orbs */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-tmc-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-sage-600/15 rounded-full blur-3xl" />
        
        <div className="relative z-10 max-w-lg">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-sage-300 mb-8">
              <span className="w-2 h-2 bg-tmc-400 rounded-full" />
              Clinical Education Platform
            </div>
            <h1 className="font-display text-4xl font-semibold text-white leading-tight mb-4">
              Microbiome Medicine<br />
              <span className="text-tmc-400">for General Practice</span>
            </h1>
            <p className="text-sage-400 text-lg leading-relaxed">
              A comprehensive clinical education course by Dr Paul Froomes.
              9 modules, 56+ chapters of evidence-based microbiome medicine.
            </p>
          </div>
          
          <div className="space-y-4 text-sm text-sage-500">
            <div className="flex items-start gap-3">
              <span className="text-tmc-400 mt-0.5">✓</span>
              <span>Evidence-based treatment protocols backed by published research</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-tmc-400 mt-0.5">✓</span>
              <span>Practical consultation guides designed for 15-minute appointments</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-tmc-400 mt-0.5">✓</span>
              <span>Real case studies from 30 years of clinical gastroenterology</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-sage-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <h1 className="font-display text-2xl font-semibold text-slate-900">
              The Microbiome Clinic
            </h1>
            <p className="text-sage-600 text-sm mt-1">Clinical Education Platform</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-sage-200 p-8">
            <div className="mb-6">
              <h2 className="font-display text-2xl font-semibold text-slate-900">
                Welcome back
              </h2>
              <p className="text-sage-600 mt-1">
                Sign in to continue your learning
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-sage-200 rounded-lg bg-sage-50 text-slate-800 placeholder-sage-400 focus:outline-none focus:ring-2 focus:ring-tmc-500/40 focus:border-tmc-500 transition-all"
                  placeholder="you@practice.com.au"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <Link href="/auth/forgot-password" className="text-sm text-tmc-600 hover:text-tmc-700">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-sage-200 rounded-lg bg-sage-50 text-slate-800 placeholder-sage-400 focus:outline-none focus:ring-2 focus:ring-tmc-500/40 focus:border-tmc-500 transition-all pr-10"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sage-400 hover:text-sage-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-tmc-600 hover:bg-tmc-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-sage-500 mt-6">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-tmc-600 hover:text-tmc-700 font-medium">
              Purchase the course
            </Link>
          </p>

          <p className="text-center text-xs text-sage-400 mt-4">
            <Link href="https://themicrobiomeclinic.com.au" className="hover:text-sage-600">
              ← Back to The Microbiome Clinic
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
