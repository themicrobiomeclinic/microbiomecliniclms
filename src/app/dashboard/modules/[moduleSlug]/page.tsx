'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'
import type { Module, Chapter } from '@/lib/types'
import { 
  Clock, CheckCircle2, Circle, BookOpen, ArrowRight,
  MessageSquare, FileQuestion, ArrowLeft
} from 'lucide-react'
import clsx from 'clsx'

export default function ModulePage() {
  const params = useParams()
  const { user } = useAuth()
  const supabase = createClient()
  const moduleSlug = params?.moduleSlug as string

  const [module, setModule] = useState<Module | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [completedChapterIds, setCompletedChapterIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchModule() {
      setLoading(true)

      const { data: moduleData } = await supabase
        .from('modules')
        .select('*')
        .eq('slug', moduleSlug)
        .single()

      if (!moduleData) { setLoading(false); return }
      setModule(moduleData)

      const { data: chaptersData } = await supabase
        .from('chapters')
        .select('*')
        .eq('module_id', moduleData.id)
        .eq('is_published', true)
        .order('chapter_number')

      if (chaptersData) setChapters(chaptersData)

      // Get progress
      if (user && chaptersData) {
        const chapterIds = chaptersData.map(c => c.id)
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('chapter_id')
          .eq('user_id', user.id)
          .in('chapter_id', chapterIds)
          .not('completed_at', 'is', null)

        if (progressData) {
          setCompletedChapterIds(new Set(progressData.map(p => p.chapter_id)))
        }
      }

      setLoading(false)
    }
    fetchModule()
  }, [moduleSlug, user, supabase])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-sage-200 rounded w-1/4" />
          <div className="h-8 bg-sage-200 rounded w-3/4" />
          <div className="mt-8 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-sage-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!module) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <h2 className="font-display text-2xl font-semibold text-slate-900 mb-2">Module not found</h2>
        <Link href="/dashboard" className="text-tmc-600 hover:text-tmc-700">← Back to dashboard</Link>
      </div>
    )
  }

  const completedCount = completedChapterIds.size
  const percentage = chapters.length > 0 ? Math.round((completedCount / chapters.length) * 100) : 0

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-sage-500 mb-6">
        <Link href="/dashboard" className="hover:text-sage-700 transition-colors flex items-center gap-1">
          <ArrowLeft size={14} />
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-slate-700">Module {module.module_number}</span>
      </div>

      {/* Module header */}
      <div className="bg-white rounded-2xl border border-sage-200 shadow-sm p-8 mb-8">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 bg-sage-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
            {module.icon}
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-tmc-600 mb-1">
              Module {module.module_number}
            </div>
            <h1 className="font-display text-2xl font-semibold text-slate-900 mb-2">
              {module.title}
            </h1>
            {module.purpose && (
              <p className="text-sage-600 leading-relaxed">{module.purpose}</p>
            )}
          </div>
        </div>

        {/* Practitioner mindset */}
        {module.practitioner_mindset && (
          <div className="bg-sage-50 border border-sage-200 rounded-xl px-5 py-4 mt-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-sage-500 mb-1">
              By the end of this module, you'll be thinking:
            </div>
            <p className="font-display italic text-slate-700">
              "{module.practitioner_mindset}"
            </p>
          </div>
        )}

        {/* Progress bar */}
        <div className="mt-5 flex items-center gap-3">
          <div className="flex-1 progress-bar">
            <div className="progress-bar-fill" style={{ width: `${percentage}%` }} />
          </div>
          <span className="text-sm font-medium text-sage-600">
            {completedCount}/{chapters.length} chapters
          </span>
        </div>
      </div>

      {/* Chapter list */}
      <div className="space-y-2">
        <h2 className="font-display text-lg font-semibold text-slate-800 mb-3">Chapters</h2>
        
        {chapters.map((ch, index) => {
          const isComplete = completedChapterIds.has(ch.id)
          
          return (
            <Link
              key={ch.id}
              href={`/dashboard/modules/${module.slug}/${ch.slug}`}
              className={clsx(
                'flex items-center gap-4 bg-white border rounded-xl px-5 py-4 transition-all hover:shadow-sm group',
                isComplete 
                  ? 'border-tmc-200 bg-tmc-50/20' 
                  : 'border-sage-200 hover:border-sage-300'
              )}
            >
              {/* Status icon */}
              <div className="flex-shrink-0">
                {isComplete ? (
                  <CheckCircle2 size={22} className="text-tmc-500" />
                ) : (
                  <Circle size={22} className="text-sage-300" />
                )}
              </div>

              {/* Chapter info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-sage-400 font-medium">Ch. {ch.chapter_number}</span>
                  {ch.has_inline_quiz && (
                    <span className="text-2xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                      Quiz
                    </span>
                  )}
                </div>
                <h3 className="font-medium text-slate-800 group-hover:text-tmc-700 transition-colors truncate">
                  {ch.title}
                </h3>
                {ch.subtitle && (
                  <p className="text-sm text-sage-500 truncate">{ch.subtitle}</p>
                )}
              </div>

              {/* Meta */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-sage-400 flex items-center gap-1">
                  <Clock size={12} />
                  {ch.estimated_reading_minutes}m
                </span>
                <ArrowRight size={16} className="text-sage-300 group-hover:text-tmc-500 group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          )
        })}
      </div>

      {/* Module quiz link */}
      {module.has_quiz && (
        <div className="mt-6">
          <Link
            href={`/dashboard/modules/${module.slug}/quiz`}
            className="flex items-center gap-4 bg-gradient-to-r from-tmc-50 to-sage-50 border border-tmc-200 rounded-xl px-5 py-4 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 bg-tmc-100 rounded-lg flex items-center justify-center">
              <FileQuestion size={20} className="text-tmc-600" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-tmc-800">End-of-Module Quiz</div>
              <div className="text-sm text-tmc-600">Test your understanding of Module {module.module_number}</div>
            </div>
            <ArrowRight size={18} className="text-tmc-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      )}

      {/* Question submission */}
      {module.has_question_form && (
        <div className="mt-4">
          <Link
            href={`/dashboard/modules/${module.slug}/ask`}
            className="flex items-center gap-4 bg-white border border-sage-200 rounded-xl px-5 py-4 hover:shadow-sm hover:border-sage-300 transition-all group"
          >
            <div className="w-10 h-10 bg-sage-100 rounded-lg flex items-center justify-center">
              <MessageSquare size={20} className="text-sage-500" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-slate-700">Ask Dr Froomes</div>
              <div className="text-sm text-sage-500">Submit a question about this module</div>
            </div>
            <ArrowRight size={18} className="text-sage-300 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      )}
    </div>
  )
}
