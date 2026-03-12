'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Module } from '@/lib/types'
import { 
  ChevronDown, ChevronRight, Menu, X,
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

  // Auto-expand the module that contains the current chapter
  useEffect(() => {
    if (!pathname) return
    const match = pathname.match(/\/dashboard\/modules\/([^/]+)/)
    if (match) {
      const slug = match[1]
      const mod = modules.find(m => m.slug === slug)
      if (mod && expandedModule !== mod.id) {
        loadChapters(mod.id)
      }
    }
  }, [pathname, modules])

  const loadChapters = async (moduleId: number) => {
    // Toggle collapse if already loaded and expanded
    if (chapters[moduleId] && expandedModule === moduleId) {
      setExpandedModule(null)
      return
    }

    // Fetch if not yet loaded
    if (!chapters[moduleId]) {
      const { data } = await supabase
        .from('chapters')
        .select('id, slug, title, chapter_number')
        .eq('module_id', moduleId)
        .eq('is_published', true)
        .order('chapter_number')
      
      if (data) {
        setChapters(prev => ({ ...prev, [moduleId]: data }))
      }
    }

    setExpandedModule(moduleId)
  }

  // FIX: exact slug match — prevents substrings lighting up multiple chapters
  const isActiveChapter = (chSlug: string) => {
    return pathname === `/dashboard/modules/${chSlug}` || 
           pathname?.endsWith(`/${chSlug}`)
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
            {/* 
              FIX: Split into two interaction zones:
              - Text/icon area → navigates to module overview page
              - Chevron button → toggles chapter dropdown only
            */}
            <div className={clsx(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left',
              expandedModule === mod.id
                ? 'bg-sage-100 text-slate-800'
                : 'text-sage-700 hover:bg-sage-100/60 hover:text-slate-800'
            )}>
              {/* Clickable text area → module overview */}
              <Link
                href={`/dashboard/modules/${mod.slug}`}
                className="flex items-center gap-3 flex-1 min-w-0"
                onClick={() => {
                  // Also expand chapters when navigating to module
                  if (expandedModule !== mod.id) loadChapters(mod.id)
                }}
              >
                <span className="text-base flex-shrink-0 w-6 text-center">{mod.icon}</span>
                <span className="flex-1 font-medium leading-snug truncate">
                  <span className="text-sage-400 text-xs mr-1">{mod.module_number}.</span>
                  {mod.title?.split('—')[0]?.trim()}
                </span>
              </Link>

              {/* Chevron button → toggle dropdown only, no navigation */}
              <button
                onClick={(e) => {
                  e.preventDefault()
                  loadChapters(mod.id)
                }}
                className="flex-shrink-0 p-1 rounded hover:bg-sage-200 transition-colors"
                aria-label="Toggle chapters"
              >
                {expandedModule === mod.id ? (
                  <ChevronDown size={14} className="text-sage-400" />
                ) : (
                  <ChevronRight size={14} className="text-sage-400" />
                )}
              </button>
            </div>

            {/* Chapter list */}
            {expandedModule === mod.id && chapters[mod.id] && (
              <div className="ml-9 mt-1 space-y-0.5 pb-1">
                {chapters[mod.id].map((ch) => (
                  <Link
                    key={ch.id}
                    href={`/dashboard/modules/${mod.slug}/${ch.slug}`}
                    className={clsx(
                      'block px-3 py-1.5 rounded-md text-xs transition-all leading-snug',
                      // FIX: exact match on full path segment, not substring
                      pathname === `/dashboard/modules/${mod.slug}/${ch.slug}`
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
