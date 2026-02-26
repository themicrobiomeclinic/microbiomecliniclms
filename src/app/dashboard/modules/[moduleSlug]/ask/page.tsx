'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'
import type { Module, QuestionSubmission } from '@/lib/types'
import { ArrowLeft, Send, CheckCircle2, MessageSquare, Loader2 } from 'lucide-react'

export default function AskPage() {
  const params = useParams()
  const { user } = useAuth()
  const supabase = createClient()
  const moduleSlug = params?.moduleSlug as string

  const [module, setModule] = useState<Module | null>(null)
  const [question, setQuestion] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [pastQuestions, setPastQuestions] = useState<QuestionSubmission[]>([])

  useEffect(() => {
    async function fetch() {
      const { data: moduleData } = await supabase
        .from('modules')
        .select('*')
        .eq('slug', moduleSlug)
        .single()

      if (moduleData) {
        setModule(moduleData)

        if (user) {
          const { data: questions } = await supabase
            .from('question_submissions')
            .select('*')
            .eq('user_id', user.id)
            .eq('module_id', moduleData.id)
            .order('created_at', { ascending: false })

          if (questions) setPastQuestions(questions)
        }
      }
    }
    fetch()
  }, [moduleSlug, user, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim() || !user || !module) return

    setSubmitting(true)

    const { data, error } = await supabase.from('question_submissions').insert({
      user_id: user.id,
      module_id: module.id,
      question_text: question.trim(),
    }).select().single()

    if (!error && data) {
      setPastQuestions(prev => [data, ...prev])
      setQuestion('')
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
    }

    setSubmitting(false)
  }

  if (!module) return null

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <Link href={`/dashboard/modules/${moduleSlug}`} className="flex items-center gap-1 text-sm text-sage-500 hover:text-sage-700 mb-6">
        <ArrowLeft size={14} />
        Back to Module {module.module_number}
      </Link>

      <div className="bg-white rounded-2xl border border-sage-200 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-sage-100 rounded-lg flex items-center justify-center">
            <MessageSquare size={20} className="text-sage-500" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-slate-900">Ask Dr Froomes</h1>
            <p className="text-sm text-sage-500">
              Module {module.module_number}: {module.title?.split('—').pop()?.trim()}
            </p>
          </div>
        </div>

        <p className="text-sage-600 mb-6 leading-relaxed">
          Have a clinical question about this module's content? Submit it below. 
          Questions are compiled monthly and answered by Dr Froomes in the Q&A digest.
        </p>

        <form onSubmit={handleSubmit}>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your clinical question here..."
            rows={4}
            className="w-full px-4 py-3 border border-sage-200 rounded-xl bg-sage-50 text-slate-800 placeholder-sage-400 focus:outline-none focus:ring-2 focus:ring-tmc-500/40 focus:border-tmc-500 transition-all resize-none"
          />

          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-sage-400">
              {question.length}/1000 characters
            </span>
            
            {submitted ? (
              <div className="flex items-center gap-2 text-tmc-600 font-medium text-sm">
                <CheckCircle2 size={16} />
                Question submitted!
              </div>
            ) : (
              <button
                type="submit"
                disabled={!question.trim() || submitting}
                className="flex items-center gap-2 bg-tmc-600 hover:bg-tmc-700 text-white font-medium px-5 py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    Submit question
                    <Send size={14} />
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Past questions */}
      {pastQuestions.length > 0 && (
        <div className="mt-8">
          <h3 className="font-display text-lg font-semibold text-slate-800 mb-3">
            Your previous questions
          </h3>
          <div className="space-y-3">
            {pastQuestions.map(q => (
              <div key={q.id} className="bg-white border border-sage-200 rounded-xl p-4">
                <p className="text-slate-700">{q.question_text}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-sage-400">
                  <span>{new Date(q.created_at).toLocaleDateString()}</span>
                  <span className={
                    q.status === 'answered' ? 'text-tmc-600 font-medium' :
                    q.status === 'pending' ? 'text-amber-600' : 'text-sage-400'
                  }>
                    {q.status === 'answered' ? '✓ Answered' : 
                     q.status === 'pending' ? '⏳ Pending' : 'Archived'}
                  </span>
                </div>
                {q.admin_response && (
                  <div className="mt-3 bg-tmc-50 border border-tmc-200 rounded-lg p-3">
                    <div className="text-xs font-semibold text-tmc-700 mb-1">Dr Froomes:</div>
                    <p className="text-sm text-tmc-800">{q.admin_response}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
