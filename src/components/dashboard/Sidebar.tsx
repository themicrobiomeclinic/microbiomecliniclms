'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Module } from '@/lib/types'
import { 
  BookOpen, ChevronDown, ChevronRight, Menu, X,
  GraduationCap, LayoutDashboard
} from 'lucide-react'
import clsx from 'clsx'

export function Sidebar() {
  const [modules, setModules] = useState<Module[]>([])
  const [expandedModule, setExpandedModule] = useState<number | null>(null)
  const [chapters, setChapters] = useState<Record<number, any[]>>({})
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    async function fetchModules() {
      const { data } = await supabase
        .from('modules')
        .select('*')
        .eq('is_published', true)
        .order('module_number')
      if (data) setModules(data)
    }
    fetchModules()
  }, [supabase])

  const loadChapters = async (moduleId: number) => {
    if (chapters[moduleId]) {
      setExpandedModule(expandedModule === moduleId ? null : moduleId)
      return
    }

    const { data } = await supabase
      .from('chapters')
      .select('id, slug, title, chapter_number')
      .eq('module_id', moduleId)
      .eq('is_published', true)
      .order('chapter_number')
    
    if (data) {
      setChapters(prev => ({ ...prev, [moduleId]: data }))
    }
    setExpandedModule(expandedModule === moduleId ? null : moduleId)
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-sage-200/80">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-tmc-600 rounded-lg flex items-center justify-center">
            <GraduationCap size={20} className="text-white" />
          </div>
          <div>
            <div className="font-display font-semibold text-slate-900 text-sm leading-tight">
              The Microbiome Clinic
            </div>
            <div className="text-2xs text-sage-500 font-medium tracking-wide uppercase">
              Education
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {/* Dashboard link */}
        <Link
          href="/dashboard"
          className={clsx(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
            pathname === '/dashboard'
              ? 'bg-tmc-50 text-tmc-700'
              : 'text-sage-700 hover:bg-sage-100 hover:text-slate-800'
          )}
        >
          <LayoutDashboard size={18} />
          Course Overview
        </Link>

        {/* Module divider */}
        <div className="pt-4 pb-2 px-3">
          <span className="text-2xs font-semibold uppercase tracking-wider text-sage-400">
            Modules
          </span>
        </div>

        {/* Module list */}
        {modules.map((mod) => (
          <div key={mod.id}>
            <button
              onClick={() => loadChapters(mod.id)}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left',
                expandedModule === mod.id
                  ? 'bg-sage-100 text-slate-800'
                  : 'text-sage-700 hover:bg-sage-100/60 hover:text-slate-800'
              )}
            >
              <span className="text-base flex-shrink-0 w-6 text-center">{mod.icon}</span>
              <span className="flex-1 font-medium leading-snug truncate">
                <span className="text-sage-400 text-xs mr-1">{mod.module_number}.</span>
                {mod.title?.split('—')[0]?.trim()}
              </span>
              {expandedModule === mod.id ? (
                <ChevronDown size={14} className="text-sage-400 flex-shrink-0" />
              ) : (
                <ChevronRight size={14} className="text-sage-400 flex-shrink-0" />
              )}
            </button>

            {/* Chapter list */}
            {expandedModule === mod.id && chapters[mod.id] && (
              <div className="ml-9 mt-1 space-y-0.5 pb-1">
                {chapters[mod.id].map((ch) => (
                  <Link
                    key={ch.id}
                    href={`/dashboard/modules/${mod.slug}/${ch.slug}`}
                    className={clsx(
                      'block px-3 py-1.5 rounded-md text-xs transition-all leading-snug',
                      pathname?.includes(ch.slug)
                        ? 'bg-tmc-50 text-tmc-700 font-medium'
                        : 'text-sage-600 hover:bg-sage-50 hover:text-slate-700'
                    )}
                  >
                    {ch.chapter_number}. {ch.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sage-200/80">
        <Link
          href="https://themicrobiomeclinic.com.au"
          target="_blank"
          className="text-xs text-sage-400 hover:text-sage-600 transition-colors"
        >
          ← themicrobiomeclinic.com.au
        </Link>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-sage-200/80 flex-col flex-shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 bg-white shadow-md rounded-lg p-2 border border-sage-200"
      >
        <Menu size={20} className="text-slate-700" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 bg-white h-full shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-sage-400 hover:text-sage-600"
            >
              <X size={20} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
