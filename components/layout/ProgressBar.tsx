'use client'

import { CheckCircle2, Circle, Lock } from 'lucide-react'
import { cn, percentOf } from '@/lib/utils'

export type CheckpointProgress = {
  id: number
  number: number
  nameJa: string
  status: 'locked' | 'unlocked' | 'completed'
}

export interface ProgressBarProps {
  checkpoints: CheckpointProgress[]
  variant?: 'default' | 'compact' | 'minimal'
  showLabels?: boolean
  className?: string
}

export function ProgressBar({
  checkpoints,
  variant = 'default',
  showLabels = true,
  className,
}: ProgressBarProps) {
  const total = checkpoints.length
  const completed = checkpoints.filter((c) => c.status === 'completed').length
  const progress = percentOf(completed, total)

  if (variant === 'minimal') {
    return (
      <div className={cn('space-y-1.5', className)}>
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-rally-gray-dark">
            {completed} / {total} 完了
          </span>
          <span className="text-rally-gray">{progress}%</span>
        </div>
        <div className="h-2 bg-rally-beige-dark/40 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-rally-blue-dark to-rally-green rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={cn('bg-rally-beige-light rounded-rally p-4 border border-rally-beige-dark/30', className)}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-rally-gray-dark">{completed}</span>
            <span className="text-rally-gray text-sm font-medium">/ {total}</span>
          </div>
          <span className="text-sm font-bold text-rally-blue-dark">{progress}%</span>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-1">
          {checkpoints.map((cp, idx) => (
            <div key={cp.id} className="flex items-center flex-1">
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all',
                  cp.status === 'completed' && 'bg-rally-green text-white',
                  cp.status === 'unlocked' && 'bg-rally-blue-dark text-white',
                  cp.status === 'locked' && 'bg-rally-beige-dark/50 text-rally-gray'
                )}
              >
                {cp.status === 'completed' ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : cp.status === 'unlocked' ? (
                  cp.number
                ) : (
                  <Lock className="w-2.5 h-2.5" />
                )}
              </div>
              {idx < checkpoints.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-0.5 transition-all duration-500',
                    idx < completed ? 'bg-rally-green' : 'bg-rally-beige-dark/40'
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Default variant: full display
  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-black text-rally-gray-dark">{completed}</span>
          <span className="text-rally-gray font-medium">/ {total} チェックポイント</span>
        </div>
        <div
          className={cn(
            'px-3 py-1 rounded-full text-xs font-bold',
            completed === total
              ? 'bg-rally-green-lighter text-rally-green'
              : 'bg-rally-blue-light text-rally-blue-dark'
          )}
        >
          {completed === total ? '完了！' : `${progress}%`}
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-3 bg-rally-beige-dark/40 rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-rally-blue-dark via-rally-blue to-rally-green rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Checkpoint steps */}
      <div className="relative">
        {/* Connecting line */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-rally-beige-dark/40" />
        <div
          className="absolute top-4 left-4 h-0.5 bg-rally-green transition-all duration-700"
          style={{
            width:
              completed === 0
                ? '0%'
                : `${((completed - 0.5) / (total - 1)) * (100 - (4 / 100) * 2)}%`,
          }}
        />

        <div className="relative flex justify-between">
          {checkpoints.map((cp) => (
            <div key={cp.id} className="flex flex-col items-center gap-1.5">
              {/* Circle */}
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all duration-300 relative z-10',
                  cp.status === 'completed' &&
                    'bg-rally-green border-rally-green text-white shadow-sm',
                  cp.status === 'unlocked' &&
                    'bg-rally-blue-dark border-rally-blue-dark text-white shadow-sm',
                  cp.status === 'locked' &&
                    'bg-rally-beige-light border-rally-beige-dark text-rally-gray'
                )}
              >
                {cp.status === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : cp.status === 'unlocked' ? (
                  <Circle className="w-4 h-4 fill-white" />
                ) : (
                  <Lock className="w-3 h-3" />
                )}
              </div>

              {/* Label */}
              {showLabels && (
                <div className="text-center max-w-[52px]">
                  <p
                    className={cn(
                      'text-[10px] font-bold leading-tight',
                      cp.status === 'completed'
                        ? 'text-rally-green'
                        : cp.status === 'unlocked'
                        ? 'text-rally-blue-dark'
                        : 'text-rally-gray/60'
                    )}
                  >
                    {cp.nameJa}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
