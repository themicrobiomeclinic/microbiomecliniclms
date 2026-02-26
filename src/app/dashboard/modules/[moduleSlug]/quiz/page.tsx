'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'
import type { Quiz, QuizQuestion, QuizOption } from '@/lib/types'
import { 
  ArrowLeft, ArrowRight, CheckCircle2, Circle, XCircle, 
  RotateCcw, Trophy, FileQuestion
} from 'lucide-react'
import clsx from 'clsx'

type AnswerState = Record<number, string[]> // questionId -> selected option ids

export default function QuizPage() {
  const params = useParams()
  const { user } = useAuth()
  const supabase = createClient()
  const moduleSlug = params?.moduleSlug as string

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<AnswerState>({})
  const [submitted, setSubmitted] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0, percentage: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchQuiz() {
      setLoading(true)

      const { data: moduleData } = await supabase
        .from('modules')
        .select('id, module_number, title, slug')
        .eq('slug', moduleSlug)
        .single()

      if (!moduleData) { setLoading(false); return }

      const { data: quizData } = await supabase
        .from('quizzes')
        .select('*')
        .eq('module_id', moduleData.id)
        .eq('is_published', true)
        .single()

      if (quizData) {
        setQuiz(quizData)

        const { data: questionsData } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('quiz_id', quizData.id)
          .order('order_index')

        if (questionsData) setQuestions(questionsData)
      }

      setLoading(false)
    }
    fetchQuiz()
  }, [moduleSlug, supabase])

  const currentQuestion = questions[currentIndex]

  const selectOption = (questionId: number, optionId: string, isMulti: boolean) => {
    if (submitted) return

    setAnswers(prev => {
      const current = prev[questionId] || []
      if (isMulti) {
        // Toggle for multi-select
        const updated = current.includes(optionId)
          ? current.filter(id => id !== optionId)
          : [...current, optionId]
        return { ...prev, [questionId]: updated }
      } else {
        return { ...prev, [questionId]: [optionId] }
      }
    })
  }

  const calculateScore = () => {
    let correct = 0
    questions.forEach(q => {
      const selected = answers[q.id] || []
      const correctOptions = q.options.filter(o => o.is_correct).map(o => o.id)
      
      const isCorrect = 
        selected.length === correctOptions.length &&
        selected.every(id => correctOptions.includes(id))
      
      if (isCorrect) correct++
    })
    
    return {
      correct,
      total: questions.length,
      percentage: Math.round((correct / questions.length) * 100),
    }
  }

  const handleSubmit = async () => {
    const result = calculateScore()
    setScore(result)
    setSubmitted(true)
    setShowResults(true)

    // Save attempt to Supabase
    if (user && quiz) {
      await supabase.from('quiz_attempts').insert({
        user_id: user.id,
        quiz_id: quiz.id,
        score: result.percentage,
        total_questions: result.total,
        correct_answers: result.correct,
        answers: answers,
      })
    }
  }

  const resetQuiz = () => {
    setAnswers({})
    setSubmitted(false)
    setShowResults(false)
    setCurrentIndex(0)
    setScore({ correct: 0, total: 0, percentage: 0 })
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-sage-200 rounded w-1/3" />
          <div className="h-40 bg-sage-100 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-center">
        <FileQuestion size={40} className="mx-auto mb-4 text-sage-300" />
        <h2 className="font-display text-2xl font-semibold text-slate-900 mb-2">Quiz not available yet</h2>
        <p className="text-sage-600 mb-4">The quiz for this module is being prepared.</p>
        <Link href={`/dashboard/modules/${moduleSlug}`} className="text-tmc-600 hover:text-tmc-700">
          ← Back to module
        </Link>
      </div>
    )
  }

  // Results screen
  if (showResults) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <Link href={`/dashboard/modules/${moduleSlug}`} className="flex items-center gap-1 text-sm text-sage-500 hover:text-sage-700 mb-6">
          <ArrowLeft size={14} />
          Back to module
        </Link>

        {/* Score card */}
        <div className="bg-white rounded-2xl border border-sage-200 shadow-sm p-8 text-center mb-8">
          <div className={clsx(
            'w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center',
            score.percentage >= 70 ? 'bg-tmc-100' : 'bg-amber-100'
          )}>
            <Trophy size={36} className={score.percentage >= 70 ? 'text-tmc-600' : 'text-amber-600'} />
          </div>
          
          <h2 className="font-display text-2xl font-semibold text-slate-900 mb-1">
            {score.percentage >= 70 ? 'Well done!' : 'Keep learning!'}
          </h2>
          <p className="text-sage-600 mb-4">
            You scored {score.correct} out of {score.total} ({score.percentage}%)
          </p>

          <div className="w-48 mx-auto progress-bar mb-6">
            <div 
              className={clsx(
                'h-full rounded-full transition-all duration-1000',
                score.percentage >= 70 ? 'bg-tmc-500' : 'bg-amber-500'
              )}
              style={{ width: `${score.percentage}%` }}
            />
          </div>

          <p className="text-sm text-sage-500 mb-6">
            {score.percentage >= 70 
              ? "You've demonstrated a solid understanding of this module's content."
              : "Consider reviewing the chapter material and trying again. There's no penalty for retaking."
            }
          </p>

          <button
            onClick={resetQuiz}
            className="inline-flex items-center gap-2 text-tmc-600 hover:text-tmc-700 font-medium"
          >
            <RotateCcw size={16} />
            Retake quiz
          </button>
        </div>

        {/* Question review */}
        <h3 className="font-display text-lg font-semibold text-slate-800 mb-4">Review your answers</h3>
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const selected = answers[q.id] || []
            const correctOptions = q.options.filter(o => o.is_correct).map(o => o.id)
            const isCorrect = 
              selected.length === correctOptions.length &&
              selected.every(id => correctOptions.includes(id))

            return (
              <div key={q.id} className={clsx(
                'bg-white border rounded-xl p-5',
                isCorrect ? 'border-tmc-200' : 'border-red-200'
              )}>
                <div className="flex items-start gap-3 mb-3">
                  {isCorrect ? (
                    <CheckCircle2 size={20} className="text-tmc-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <div className="text-xs text-sage-400 mb-1">Question {idx + 1}</div>
                    <div className="font-medium text-slate-800">{q.question_text}</div>
                  </div>
                </div>
                
                <div className="ml-8 space-y-1.5">
                  {q.options.map(opt => {
                    const wasSelected = selected.includes(opt.id)
                    const isOptCorrect = opt.is_correct

                    return (
                      <div key={opt.id} className={clsx(
                        'flex items-center gap-2 text-sm px-3 py-2 rounded-lg',
                        isOptCorrect && 'bg-tmc-50 text-tmc-800 font-medium',
                        wasSelected && !isOptCorrect && 'bg-red-50 text-red-700 line-through',
                        !wasSelected && !isOptCorrect && 'text-sage-500'
                      )}>
                        {isOptCorrect ? (
                          <CheckCircle2 size={14} className="text-tmc-500 flex-shrink-0" />
                        ) : wasSelected ? (
                          <XCircle size={14} className="text-red-400 flex-shrink-0" />
                        ) : (
                          <Circle size={14} className="text-sage-300 flex-shrink-0" />
                        )}
                        {opt.text}
                      </div>
                    )
                  })}
                </div>

                {q.explanation && (
                  <div className="ml-8 mt-3 text-sm text-sage-600 bg-sage-50 rounded-lg px-3 py-2">
                    <span className="font-medium text-sage-700">Explanation:</span> {q.explanation}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Quiz taking screen
  const answeredCount = Object.keys(answers).length
  const allAnswered = answeredCount === questions.length

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href={`/dashboard/modules/${moduleSlug}`} className="flex items-center gap-1 text-sm text-sage-500 hover:text-sage-700">
          <ArrowLeft size={14} />
          Back to module
        </Link>
        <span className="text-sm text-sage-500">
          Question {currentIndex + 1} of {questions.length}
        </span>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 mb-8">
        {questions.map((q, idx) => (
          <button
            key={q.id}
            onClick={() => setCurrentIndex(idx)}
            className={clsx(
              'h-2 rounded-full transition-all flex-1',
              idx === currentIndex ? 'bg-tmc-500' :
              answers[q.id] ? 'bg-tmc-300' : 'bg-sage-200'
            )}
          />
        ))}
      </div>

      {/* Question card */}
      {currentQuestion && (
        <div className="bg-white rounded-2xl border border-sage-200 shadow-sm p-8">
          <div className="mb-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-sage-400 mb-2 block">
              {currentQuestion.question_type === 'multi_select' ? 'Select all that apply' :
               currentQuestion.question_type === 'true_false' ? 'True or False' :
               'Choose one'}
            </span>
            <h2 className="font-display text-xl font-semibold text-slate-900">
              {currentQuestion.question_text}
            </h2>
          </div>

          <div className="space-y-2.5">
            {currentQuestion.options.map(opt => {
              const isSelected = (answers[currentQuestion.id] || []).includes(opt.id)
              const isMulti = currentQuestion.question_type === 'multi_select'

              return (
                <button
                  key={opt.id}
                  onClick={() => selectOption(currentQuestion.id, opt.id, isMulti)}
                  className={clsx(
                    'w-full text-left px-5 py-3.5 rounded-xl border-2 transition-all',
                    isSelected
                      ? 'border-tmc-500 bg-tmc-50 text-tmc-800'
                      : 'border-sage-200 hover:border-sage-300 text-slate-700'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      'w-5 h-5 flex items-center justify-center flex-shrink-0',
                      isMulti ? 'rounded' : 'rounded-full',
                      isSelected 
                        ? 'bg-tmc-500 border-tmc-500'
                        : 'border-2 border-sage-300'
                    )}>
                      {isSelected && (
                        <CheckCircle2 size={14} className="text-white" />
                      )}
                    </div>
                    <span className="font-medium">{opt.text}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="flex items-center gap-1 text-sm text-sage-500 hover:text-sage-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeft size={16} />
          Previous
        </button>

        {currentIndex < questions.length - 1 ? (
          <button
            onClick={() => setCurrentIndex(currentIndex + 1)}
            className="flex items-center gap-1 bg-tmc-600 hover:bg-tmc-700 text-white font-medium px-5 py-2.5 rounded-lg transition-all text-sm"
          >
            Next
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className="flex items-center gap-2 bg-tmc-600 hover:bg-tmc-700 text-white font-medium px-6 py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Submit quiz
            <CheckCircle2 size={16} />
          </button>
        )}
      </div>

      {!allAnswered && currentIndex === questions.length - 1 && (
        <p className="text-center text-sm text-sage-500 mt-3">
          Answer all {questions.length} questions to submit ({answeredCount}/{questions.length} answered)
        </p>
      )}
    </div>
  )
}
