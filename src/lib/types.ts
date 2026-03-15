// ============================================================
// Database Types — matches Supabase schema
// ============================================================

export interface Profile {
  id: string
  email: string
  full_name: string | null
  practice_name: string | null
  ahpra_number: string | null
  state: string | null
  has_course_access: boolean
  shopify_order_id: string | null
  created_at: string
  updated_at: string
}

export interface Module {
  id: number
  slug: string
  title: string
  subtitle: string | null
  purpose: string | null
  practitioner_mindset: string | null
  module_number: number
  has_quiz: boolean
  has_question_form: boolean
  chapter_count: number
  estimated_reading_minutes: number | null
  icon: string | null
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface Chapter {
  id: number
  module_id: number
  slug: string
  title: string
  subtitle: string | null
  chapter_number: number
  content_html: string | null
  content_markdown: string | null
  key_takeaways: string[] | null
  clinical_application: string | null
  references: Reference[] | null
  downloadable_resources: Resource[] | null
  estimated_reading_minutes: number
  has_inline_quiz: boolean
  quiz_data: any | null
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface Reference {
  title: string
  url?: string
  journal?: string
  year?: number
}

export interface Resource {
  title: string
  filename: string
  url: string
  type: 'pdf' | 'checklist' | 'handout' | 'guide'
}

export interface Quiz {
  id: number
  module_id: number
  title: string
  description: string | null
  passing_score: number
  is_published: boolean
  created_at: string
}

export interface QuizQuestion {
  id: number
  quiz_id: number
  chapter_id: number | null
  question_type: 'multiple_choice' | 'true_false' | 'multi_select'
  question_text: string
  options: QuizOption[]
  explanation: string | null
  order_index: number
}

export interface QuizOption {
  id: string
  text: string
  is_correct: boolean
}

export interface UserProgress {
  id: number
  user_id: string
  chapter_id: number
  started_at: string
  completed_at: string | null
  time_spent_seconds: number
}

export interface QuizAttempt {
  id: number
  user_id: string
  quiz_id: number
  score: number
  total_questions: number
  correct_answers: number
  answers: Record<string, string>
  completed_at: string
}

export interface QuestionSubmission {
  id: number
  user_id: string
  module_id: number
  question_text: string
  status: 'pending' | 'answered' | 'archived'
  admin_response: string | null
  responded_at: string | null
  created_at: string
}

// ============================================================
// Composite Types — for UI
// ============================================================

export interface ModuleWithProgress extends Module {
  chapters: Chapter[]
  completed_chapters: number
  total_chapters: number
  completion_percentage: number
}

export interface ChapterWithNav extends Chapter {
  module: Module
  prev_chapter: { slug: string; title: string; module_slug: string } | null
  next_chapter: { slug: string; title: string; module_slug: string } | null
  is_completed: boolean
}

export interface ChapterSummary {
  id: number
  module_id: number
  slug: string
  title: string
  subtitle?: string | null
  chapter_number: number
  estimated_minutes?: number
  estimated_reading_minutes?: number
  summary?: string | null
  has_inline_quiz?: boolean
}
