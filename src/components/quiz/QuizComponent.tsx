'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, RotateCcw, Trophy, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

export interface QuizQuestion {
  id: number
  type: 'multiple_choice' | 'true_false' | 'multi_select'
  question: string
  options: string[]
  correct: number | number[]
  explanation: string
}

export interface QuizData {
  title?: string
  questions: QuizQuestion[]
}

interface Props {
  quizData: QuizData
}

export default function QuizComponent({ quizData }: Props) {
  const { questions, title } = quizData
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | number[] | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [answers, setAnswers] = useState<(number | number[] | null)[]>(Array(questions.length).fill(null))
  const [finished, setFinished] = useState(false)

  const q = questions[current]
  const isMultiSelect = q.type === 'multi_select'

  const isCorrect = (ans: number | number[] | null): boolean => {
    if (ans === null) return false
    if (Array.isArray(q.correct)) {
      if (!Array.isArray(ans)) return false
      return ans.length === q.correct.length && [...ans].sort().join() === [...q.correct].sort().join()
    }
    return ans === q.correct
  }

  const score = answers.filter((a, i) => isCorrect(a)).length

  function handleSelect(idx: number) {
    if (submitted) return
    if (isMultiSelect) {
      const prev = Array.isArray(selected) ? selected : []
      setSelected(prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx])
    } else {
      setSelected(idx)
    }
  }

  function handleSubmit() {
    if (selected === null || (Array.isArray(selected) && selected.length === 0)) return
    const updated = [...answers]
    updated[current] = selected
    setAnswers(updated)
    setSubmitted(true)
  }

  function handleNext() {
    if (current < questions.length - 1) {
      setCurrent(current + 1)
      setSelected(null)
      setSubmitted(false)
    } else {
      setFinished(true)
    }
  }

  function handleRestart() {
    setCurrent(0)
    setSelected(null)
    setSubmitted(false)
    setAnswers(Array(questions.length).fill(null))
    setFinished(false)
  }

  function optionClass(idx: number) {
    const isSelected = Array.isArray(selected) ? selected.includes(idx) : selected === idx
    if (!submitted) {
      return clsx('w-full text-left px-4 py-3 rounded-xl border text-sm transition-all',
        isSelected ? 'border-tmc-500 bg-tmc-50 text-tmc-900 font-medium' : 'border-sage-200 bg-white text-slate-700 hover:border-sage-300 hover:bg-sage-50')
    }
    const correctIndices = Array.isArray(q.correct) ? q.correct : [q.correct]
    const isCorrectOption = correctIndices.includes(idx)
    if (isCorrectOption) return 'w-full text-left px-4 py-3 rounded-xl border text-sm border-emerald-400 bg-emerald-50 text-emerald-900 font-medium'
    if (isSelected && !isCorrectOption) return 'w-full text-left px-4 py-3 rounded-xl border text-sm border-red-300 bg-red-50 text-red-800'
    return 'w-full text-left px-4 py-3 rounded-xl border text-sm border-sage-200 bg-white text-slate-400'
  }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100)
    const pass = pct >= 70
    return (
      <div className="border-t border-sage-100 p-8 lg:p-10">
        <div className="bg-white border border-sage-200 rounded-2xl p-8 text-center shadow-sm">
          <div className={clsx('inline-flex items-center justify-center w-16 h-16 rounded-full mb-4', pass ? 'bg-emerald-100' : 'bg-amber-100')}>
            <Trophy size={28} className={pass ? 'text-emerald-600' : 'text-amber-600'} />
          </div>
          <h3 className="font-display text-2xl font-semibold text-slate-900 mb-1">{pass ? 'Well done!' : 'Good effort'}</h3>
          <p className="text-sage-600 mb-6">You scored <strong className="text-slate-800">{score} out of {questions.length}</strong> ({pct}%)</p>
          <div className="text-left space-y-3 mb-6">
            {questions.map((q, i) => (
              <div key={i} className={clsx('flex items-start gap-3 p-3 rounded-xl border text-sm', isCorrect(answers[i]) ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50')}>
                {isCorrect(answers[i]) ? <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" /> : <XCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />}
                <div>
                  <p className={clsx('font-medium', isCorrect(answers[i]) ? 'text-emerald-900' : 'text-red-800')}>Q{i + 1}: {q.question}</p>
                  {!isCorrect(answers[i]) && <p className="text-red-600 text-xs mt-1">{q.explanation}</p>}
                </div>
              </div>
            ))}
          </div>
          <button onClick={handleRestart} className="inline-flex items-center gap-2 text-sm text-sage-600 hover:text-tmc-600 transition-colors">
            <RotateCcw size={14} />Retake quiz
          </button>
        </div>
      </div>
    )
  }

  const correct = isCorrect(submitted ? answers[current] : null)

  return (
    <div className="border-t border-sage-100 p-8 lg:p-10">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display font-semibold text-slate-800 text-lg">{title ?? 'Knowledge Check'}</h3>
        <span className="text-xs font-medium text-sage-500 bg-sage-100 px-3 py-1 rounded-full">{current + 1} / {questions.length}</span>
      </div>
      <div className="w-full h-1.5 bg-sage-100 rounded-full mb-6">
        <div className="h-1.5 bg-tmc-500 rounded-full transition-all duration-300" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
      </div>
      <p className="text-slate-800 font-medium mb-4 leading-relaxed">{q.question}</p>
      {isMultiSelect && !submitted && <p className="text-xs text-sage-500 mb-3">Select all that apply</p>}
      <div className="space-y-2 mb-5">
        {q.options.map((opt, idx) => (
          <button key={idx} onClick={() => handleSelect(idx)} className={optionClass(idx)} disabled={submitted}>
            <span className="flex items-center gap-3">
              <span className={clsx('flex-shrink-0 w-6 h-6 rounded-full border text-xs font-bold flex items-center justify-center transition-colors',
                (Array.isArray(selected) ? selected.includes(idx) : selected === idx) && !submitted ? 'border-tmc-500 bg-tmc-500 text-white' : 'border-sage-300 text-sage-400')}>
                {String.fromCharCode(65 + idx)}
              </span>
              {opt}
            </span>
          </button>
        ))}
      </div>
      {submitted && (
        <div className={clsx('flex items-start gap-3 p-4 rounded-xl border text-sm mb-5', correct ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800')}>
          {correct ? <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" /> : <XCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />}
          <div>
            <p className="font-semibold mb-0.5">{correct ? 'Correct!' : 'Not quite'}</p>
            <p className="leading-relaxed">{q.explanation}</p>
          </div>
        </div>
      )}
      {!submitted ? (
        <button onClick={handleSubmit} disabled={selected === null || (Array.isArray(selected) && selected.length === 0)}
          className="w-full bg-tmc-600 hover:bg-tmc-700 disabled:bg-sage-200 disabled:text-sage-400 disabled:cursor-not-allowed text-white font-medium rounded-xl px-6 py-3 transition-all text-sm">
          Submit Answer
        </button>
      ) : (
        <button onClick={handleNext} className="w-full flex items-center justify-center gap-2 bg-tmc-600 hover:bg-tmc-700 text-white font-medium rounded-xl px-6 py-3 transition-all text-sm">
          {current < questions.length - 1 ? <><span>Next Question</span><ChevronRight size={16} /></> : <><span>See Results</span><Trophy size={16} /></>}
        </button>
      )}
    </div>
  )
}
