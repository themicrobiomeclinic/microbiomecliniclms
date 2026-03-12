'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'
import type { Chapter, Module } from '@/lib/types'
import { 
  ArrowLeft, ArrowRight, Clock, CheckCircle2,
  BookOpen, Download, Lightbulb, Stethoscope, BookMarked
} from 'lucide-react'
import clsx from 'clsx'
import QuizComponent from '@/components/quiz/QuizComponent'

export default function ChapterPage() {
  const params = useParams()
  const { user } = useAuth()
  const supabase = createClient()
  
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [module, setModule] = useState<Module | null>(null)
  const [allChapters, setAllChapters] = useState<Chapter[]>([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [loading, setLoading] = useState(true)

  const moduleSlug = params?.moduleSlug as string
  const chapterSlug = params?.chapterSlug as string

  useEffect(() => {
    async function fetchChapter() {
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

      if (chaptersData) setAllChapters(chaptersData)

      const current = chaptersData?.find(c => c.slug === chapterSlug)
      setChapter(current || null)

      if (current && user) {
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('completed_at')
          .eq('user_id', user.id)
          .eq('chapter_id', current.id)
          .single()

        setIsCompleted(!!progressData?.completed_at)

        // FIX: Only set started_at if no existing record — avoids overwriting completed_at
        if (!progressData) {
          await supabase
            .from('user_progress')
            .insert({
              user_id: user.id,
              chapter_id: current.id,
              started_at: new Date().toISOString(),
            })
        }
      }

      setLoading(false)
    }
    fetchChapter()
  }, [moduleSlug, chapterSlug, user, supabase])

  // FIX: upsert now includes started_at so the conflict resolution works correctly
  const markComplete = useCallback(async () => {
    if (!chapter || !user) return
    
    const now = new Date().toISOString()

    const { error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: user.id,
        chapter_id: chapter.id,
        started_at: now,
        completed_at: now,
      }, {
        onConflict: 'user_id,chapter_id',
        ignoreDuplicates: false,
      })

    if (error) {
      console.error('markComplete error:', error)
      return
    }

    setIsCompleted(true)
  }, [chapter, user, supabase])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-sage-200 rounded w-1/4" />
          <div className="h-8 bg-sage-200 rounded w-3/4" />
          <div className="h-4 bg-sage-200 rounded w-1/2" />
          <div className="mt-8 space-y-3">
            <div className="h-4 bg-sage-100 rounded" />
            <div className="h-4 bg-sage-100 rounded" />
            <div className="h-4 bg-sage-100 rounded w-5/6" />
          </div>
        </div>
      </div>
    )
  }

  if (!chapter || !module) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <h2 className="font-display text-2xl font-semibold text-slate-900 mb-2">Chapter not found</h2>
        <p className="text-sage-600 mb-4">This chapter may not be published yet.</p>
        <Link href="/dashboard" className="text-tmc-600 hover:text-tmc-700">
          ← Back to dashboard
        </Link>
      </div>
    )
  }

  const currentIndex = allChapters.findIndex(c => c.id === chapter.id)
  const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null
  const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-sage-500 mb-6">
        <Link href="/dashboard" className="hover:text-sage-700 transition-colors">Dashboard</Link>
        <span>/</span>
        <Link href={`/dashboard/modules/${module.slug}`} className="hover:text-sage-700 transition-colors">
          Module {module.module_number}
        </Link>
        <span>/</span>
        <span className="text-slate-700">Ch. {chapter.chapter_number}</span>
      </div>

      {/* Chapter header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-tmc-600">
            Module {module.module_number} · Chapter {chapter.chapter_number}
          </span>
          {isCompleted && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-tmc-600 bg-tmc-50 px-2 py-0.5 rounded-full">
              <CheckCircle2 size={12} />
              Completed
            </span>
          )}
        </div>
        <h1 className="font-display text-3xl font-semibold text-slate-900 mb-2">
          {chapter.title}
        </h1>
        {chapter.subtitle && (
          <p className="text-lg text-sage-600">{chapter.subtitle}</p>
        )}
        <div className="flex items-center gap-4 mt-3 text-sm text-sage-500">
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {chapter.estimated_reading_minutes} min read
          </span>
        </div>
      </div>

      {/* Main content card */}
      <article className="bg-white rounded-2xl border border-sage-200 shadow-sm overflow-hidden">
        {/* Chapter content */}
        <div className="p-8 lg:p-10">
          {chapter.content_html ? (
            <div 
              className="chapter-content"
              dangerouslySetInnerHTML={{ __html: chapter.content_html }}
            />
          ) : (
            <div className="text-center py-16 text-sage-400">
              <BookOpen size={40} className="mx-auto mb-4 opacity-50" />
              <p className="font-display text-lg">Content coming soon</p>
              <p className="text-sm mt-1">This chapter is being prepared by Dr Froomes.</p>
            </div>
          )}
        </div>

        {/* Clinical Application */}
        {chapter.clinical_application && (
          <div className="border-t border-sage-100 p-8 lg:p-10">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Stethoscope size={18} className="text-blue-600" />
                <h3 className="font-display font-semibold text-blue-900">Clinical Application</h3>
              </div>
              <div className="text-blue-800 leading-relaxed">{chapter.clinical_application}</div>
            </div>
          </div>
        )}

        {/* Key Takeaways */}
        {chapter.key_takeaways && chapter.key_takeaways.length > 0 && (
          <div className="border-t border-sage-100 p-8 lg:p-10">
            <div className="bg-tmc-50 border border-tmc-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={18} className="text-tmc-600" />
                <h3 className="font-display font-semibold text-tmc-900">Key Takeaways</h3>
              </div>
              <ul className="space-y-2">
                {chapter.key_takeaways.map((takeaway, i) => (
                  <li key={i} className="flex items-start gap-2 text-tmc-800">
                    <span className="text-tmc-500 mt-0.5 flex-shrink-0">•</span>
                    <span className="leading-relaxed">{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {chapter.quiz_data && <QuizComponent quizData={chapter.quiz_data} />}

        {/* Downloadable Resources */}
        {chapter.downloadable_resources && chapter.downloadable_resources.length > 0 && (
          <div className="border-t border-sage-100 p-8 lg:p-10">
            <h3 className="font-display font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Download size={18} className="text-sage-500" />
              Downloadable Resources
            </h3>
            <div className="space-y-2">
              {chapter.downloadable_resources.map((resource, i) => (
                <a
                  key={i}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-sage-50 border border-sage-200 rounded-lg px-4 py-3 hover:bg-sage-100 transition-colors group"
                >
                  <Download size={16} className="text-sage-400 group-hover:text-tmc-500" />
                  <div>
                    <div className="text-sm font-medium text-slate-700">{resource.title}</div>
                    <div className="text-xs text-sage-500 uppercase">{resource.type}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* References */}
        {chapter.references && chapter.references.length > 0 && (
          <div className="border-t border-sage-100 p-8 lg:p-10">
            <h3 className="font-display font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <BookMarked size={18} className="text-sage-500" />
              References
            </h3>
            <ol className="space-y-2 text-sm text-sage-600">
              {chapter.references.map((ref, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-sage-400 flex-shrink-0">{i + 1}.</span>
                  <span>
                    {ref.title}
                    {ref.journal && <span className="italic"> — {ref.journal}</span>}
                    {ref.year && <span> ({ref.year})</span>}
                    {ref.url && (
                      <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-tmc-600 hover:text-tmc-700 ml-1">
                        [Link]
                      </a>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </article>

      {/* Mark Complete button */}
      <div className="mt-6 flex justify-center">
        {isCompleted ? (
          <div className="flex items-center gap-2 text-tmc-600 bg-tmc-50 border border-tmc-200 rounded-xl px-6 py-3">
            <CheckCircle2 size={20} />
            <span className="font-medium">Chapter completed</span>
          </div>
        ) : (
          <button
            onClick={markComplete}
            className="flex items-center gap-2 bg-tmc-600 hover:bg-tmc-700 text-white font-medium rounded-xl px-6 py-3 transition-all shadow-sm hover:shadow-md"
          >
            <CheckCircle2 size={20} />
            Mark as complete
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-8 flex items-stretch gap-4">
        {prevChapter ? (
          <Link
            href={`/dashboard/modules/${module.slug}/${prevChapter.slug}`}
            className="flex-1 flex items-center gap-3 bg-white border border-sage-200 rounded-xl p-4 hover:border-sage-300 hover:shadow-sm transition-all group"
          >
            <ArrowLeft size={18} className="text-sage-400 group-hover:text-tmc-500 transition-colors flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-xs text-sage-500">Previous</div>
              <div className="text-sm font-medium text-slate-700 truncate">{prevChapter.title}</div>
            </div>
          </Link>
        ) : (
          <div className="flex-1" />
        )}

        {nextChapter ? (
          <Link
            href={`/dashboard/modules/${module.slug}/${nextChapter.slug}`}
            className="flex-1 flex items-center justify-end gap-3 bg-white border border-sage-200 rounded-xl p-4 hover:border-sage-300 hover:shadow-sm transition-all group text-right"
          >
            <div className="min-w-0">
              <div className="text-xs text-sage-500">Next</div>
              <div className="text-sm font-medium text-slate-700 truncate">{nextChapter.title}</div>
            </div>
            <ArrowRight size={18} className="text-sage-400 group-hover:text-tmc-500 transition-colors flex-shrink-0" />
          </Link>
        ) : (
          <Link
            href={`/dashboard/modules/${module.slug}`}
            className="flex-1 flex items-center justify-end gap-3 bg-tmc-50 border border-tmc-200 rounded-xl p-4 hover:bg-tmc-100 transition-all group text-right"
          >
            <div>
              <div className="text-xs text-tmc-600">End of module</div>
              <div className="text-sm font-medium text-tmc-700">Back to module overview</div>
            </div>
            <ArrowRight size={18} className="text-tmc-400 flex-shrink-0" />
          </Link>
        )}
      </div>
    </div>
  )
}
