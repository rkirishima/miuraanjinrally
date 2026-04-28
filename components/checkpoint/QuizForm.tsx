'use client'

import { useState } from 'react'
import { HelpCircle, AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface QuizFormProps {
  question: string
  answer: string
  hint?: string
  onSuccess: () => void
  className?: string
}

type QuizState = 'idle' | 'error' | 'success'

export function QuizForm({ question, answer, hint, onSuccess, className }: QuizFormProps) {
  const [userAnswer, setUserAnswer] = useState('')
  const [state, setState] = useState<QuizState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '')

  const checkAnswer = (input: string): boolean => {
    const userNorm = normalize(input)
    const correctNorm = normalize(answer)

    // Exact match
    if (userNorm === correctNorm) return true

    // Contains match (either direction)
    if (userNorm.length >= 2 && correctNorm.includes(userNorm)) return true
    if (correctNorm.length >= 2 && userNorm.includes(correctNorm)) return true

    return false
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!userAnswer.trim() || isAnimating) return

    const newAttempts = attempts + 1
    setAttempts(newAttempts)

    if (checkAnswer(userAnswer)) {
      setIsAnimating(true)
      setState('success')
      setTimeout(() => {
        onSuccess()
      }, 1200)
    } else {
      setState('error')
      if (hint && newAttempts >= 2) {
        setShowHint(true)
        setErrorMessage('もう一度挑戦してみましょう！ヒントを確認してください。')
      } else if (newAttempts === 1) {
        setErrorMessage('不正解です。もう一度考えてみましょう！')
      } else {
        setErrorMessage(`惜しい！もう少しです。（${newAttempts}回目）`)
      }
    }
  }

  return (
    <div className={cn('bg-white rounded-rally-lg border-2 border-rally-blue-dark p-5 shadow-rally', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-rally-blue-dark/10 flex items-center justify-center flex-shrink-0">
          <HelpCircle className="w-4 h-4 text-rally-blue-dark" />
        </div>
        <h3 className="font-black text-rally-gray-dark tracking-wide text-sm">
          チェックポイント クイズ
        </h3>
      </div>

      {/* Question */}
      <div className="bg-rally-blue-light rounded-rally p-4 mb-5">
        <p className="text-sm text-rally-gray-dark font-semibold leading-relaxed">{question}</p>
      </div>

      {/* Success state */}
      {state === 'success' ? (
        <div className="flex flex-col items-center py-4 gap-3">
          <div className="w-14 h-14 rounded-full bg-rally-green-lighter flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-rally-green" />
          </div>
          <div className="text-center">
            <p className="font-black text-rally-gray-dark text-base">正解！</p>
            <p className="text-rally-gray text-xs mt-1">次のステップへ進みます...</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input */}
          <div>
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => {
                setUserAnswer(e.target.value)
                if (state === 'error') setState('idle')
              }}
              placeholder="答えを入力してください..."
              disabled={false}
              className={cn(
                'w-full bg-rally-beige border-2 rounded-rally px-4 py-3 text-rally-gray-dark font-medium placeholder:text-rally-gray/40 focus:outline-none transition-colors text-sm',
                state === 'error'
                  ? 'border-red-400 bg-red-50'
                  : 'border-rally-beige-dark focus:border-rally-blue-dark'
              )}
            />
          </div>

          {/* Error message */}
          {state === 'error' && errorMessage && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-rally px-3 py-2.5">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-xs leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {/* Hint */}
          {showHint && hint && (
            <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-rally px-3 py-2.5">
              <Lightbulb className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-800 text-xs font-bold mb-0.5">ヒント</p>
                <p className="text-yellow-700 text-xs leading-relaxed">{hint}</p>
              </div>
            </div>
          )}

          {/* Hint toggle (show after 1 wrong attempt) */}
          {!showHint && hint && attempts >= 1 && (
            <button
              type="button"
              onClick={() => setShowHint(true)}
              className="flex items-center gap-1.5 text-xs text-rally-gray hover:text-rally-blue-dark transition-colors"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              ヒントを見る
            </button>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!userAnswer.trim()}
            className={cn(
              'w-full font-bold py-3.5 px-6 rounded-rally text-sm tracking-wide transition-all duration-150',
              'active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
              'bg-rally-blue-dark text-white hover:bg-rally-blue-dark/90 shadow-rally'
            )}
          >
            回答する
          </button>

          {/* Attempt counter */}
          {attempts > 0 && (
            <p className="text-center text-xs text-rally-gray">
              {attempts}回挑戦しました
            </p>
          )}
        </form>
      )}
    </div>
  )
}
