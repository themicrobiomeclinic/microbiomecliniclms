'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'
import type { Module } from '@/lib/types'
import { BookOpen, Clock, CheckCircle2, ArrowRight } from 'lucide-react'
import clsx from 'clsx'

// Narrative arc stages
const stages = [
  { label: 'The Problem', modules: [1], color: 'text-red-600', bg: 'bg-red-50' },
  { label: 'The Science', modules: [2], color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'The Evidence', modules: [3], color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'The Diagnosis', modules: [4], color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'The Solution', modules: [5], color: 'text-tmc-600', bg: 'bg-tmc-50' },
  { label: 'The Practice', modules: [6, 7], color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { label: 'The Bigger Picture', modules: [8], color: 'text-orange-600', bg: 'bg-orange-50' },
  { label: 'The Partnership', modules: [9], color: 'text-tmc-600', bg: 'bg-tmc-50' },
]

function getStage(moduleNumber: number) {
  return stages.find(s => s.modules.includes(moduleNumber))
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const [modules, setModules] = useState<Module[]>([])
  const [progress, setProgress] = useState<Record<number, { completed: number; total: number }>>({})
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      // Fetch modules
      const { data: modulesData } = await supabase
        .from('modules')
        .select('*')
        .eq('is_published', true)
        .order('module_number')
      
      if (modulesData) setModules(modulesData)

      // Fetch user progress
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('chapter_id, completed_at, chapters(module_id)')
        .not('completed_at', 'is', null)

      if (progressData) {
        const progressMap: Record<number, { completed: number; total: number }> = {}
        modulesData?.forEach(mod => {
          progressMap[mod.id] = { completed: 0, total: mod.chapter_count }
        })
        progressData.forEach((p: any) => {
          const moduleId = p.chapters?.module_id
          if (moduleId && progressMap[moduleId]) {
            progressMap[moduleId].completed++
          }
        })
        setProgress(progressMap)
      }
    }
    fetchData()
  }, [supabase])

  const totalChapters = modules.reduce((sum, m) => sum + m.chapter_count, 0)
  const completedChapters = Object.values(progress).reduce((sum, p) => sum + p.completed, 0)
  const overallPercentage = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-slate-900 mb-2">
          {profile?.full_name ? `Welcome back, Dr ${profile.full_name.split(' ').pop()}` : 'Course Dashboard'}
        </h1>
        <p className="text-sage-600">
          Microbiome Medicine for General Practice — by Dr Paul Froomes
        </p>
      </div>

      {/* Overall progress */}
      <div className="bg-white rounded-2xl border border-sage-200 p-6 mb-8 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-tmc-100 rounded-xl flex items-center justify-center">
              <BookOpen size={20} className="text-tmc-600" />
            </div>
            <div>
              <div className="font-medium text-slate-800">Overall Progress</div>
              <div className="text-sm text-sage-500">
                {completedChapters} of {totalChapters} chapters completed
              </div>
            </div>
          </div>
          <div className="text-2xl font-display font-semibold text-tmc-600">
            {overallPercentage}%
          </div>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${overallPercentage}%` }} />
        </div>
      </div>

      {/* Module grid */}
      <div className="space-y-4">
        {modules.map((mod, index) => {
          const stage = getStage(mod.module_number)
          const modProgress = progress[mod.id]
          const percentage = modProgress 
            ? Math.round((modProgress.completed / modProgress.total) * 100) 
            : 0
          const isComplete = percentage === 100

          return (
            <Link
              key={mod.id}
              href={`/dashboard/modules/${mod.slug}`}
              className={clsx(
                'block bg-white rounded-xl border border-sage-200 p-5 transition-all hover:shadow-md hover:border-sage-300 group',
                isComplete && 'border-tmc-200 bg-tmc-50/30'
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start gap-4">
                {/* Module icon */}
                <div className={clsx(
                  'w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0',
                  isComplete ? 'bg-tmc-100' : 'bg-sage-100'
                )}>
                  {isComplete ? (
                    <CheckCircle2 size={24} className="text-tmc-500" />
                  ) : (
                    mod.icon
                  )}
                </div>

                {/* Module info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {stage && (
                      <span className={clsx('text-2xs font-semibold uppercase tracking-wider', stage.color)}>
                        {stage.label}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-display text-lg font-semibold text-slate-900 mb-1 group-hover:text-tmc-700 transition-colors">
                    <span className="text-sage-400 mr-1">Module {mod.module_number}:</span>
                    {mod.title?.split('—').pop()?.trim() || mod.title}
                  </h3>
                  
                  <p className="text-sm text-sage-600 mb-3">
                    {mod.subtitle}
                  </p>

                  {/* Meta row */}
                  <div className="flex items-center gap-4 text-xs text-sage-500">
                    <span className="flex items-center gap-1">
                      <BookOpen size={12} />
                      {mod.chapter_count} chapters
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {mod.estimated_reading_minutes} min
                    </span>
                    {mod.has_quiz && (
                      <span className="bg-sage-100 text-sage-600 px-2 py-0.5 rounded-full">
                        Quiz
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress / Arrow */}
                <div className="flex-shrink-0 flex flex-col items-end gap-2">
                  {modProgress && modProgress.completed > 0 ? (
                    <div className="text-right">
                      <div className="text-sm font-semibold text-tmc-600">{percentage}%</div>
                      <div className="w-20 h-1.5 bg-sage-200 rounded-full overflow-hidden mt-1">
                        <div 
                          className="h-full bg-tmc-500 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <ArrowRight size={18} className="text-sage-300 group-hover:text-tmc-500 group-hover:translate-x-1 transition-all" />
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Practitioner mindset footer */}
      <div className="mt-10 text-center text-sm text-sage-400 italic font-display">
        "From understanding the problem to becoming part of the solution"
      </div>
    </div>
  )
}
