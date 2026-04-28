import Link from 'next/link'
import { MapPin, Lock, CheckCircle2, Circle, ChevronRight, Navigation } from 'lucide-react'
import { cn, formatDistance, type CheckpointStatus } from '@/lib/utils'

export interface CheckpointCardProps {
  id: number
  number: number
  nameJa: string
  name: string
  area: string
  status: CheckpointStatus
  distanceMeters?: number | null
  hint?: string
  className?: string
}

export function CheckpointCard({
  id,
  number,
  nameJa,
  name,
  area,
  status,
  distanceMeters,
  hint,
  className,
}: CheckpointCardProps) {
  const isInteractive = status !== 'locked'

  const containerClasses = cn(
    'relative rounded-rally border-2 p-4 transition-all duration-150',
    status === 'completed' && 'bg-rally-green-lighter border-rally-green',
    status === 'unlocked' && 'bg-rally-blue-light border-rally-blue-dark shadow-rally',
    status === 'locked' && 'bg-rally-beige-light border-rally-beige-dark/40 opacity-70',
    isInteractive && 'active:scale-[0.98] hover:shadow-rally cursor-pointer',
    className
  )

  const content = (
    <>
      {/* Completed indicator strip */}
      {status === 'completed' && (
        <div className="absolute top-0 left-0 bottom-0 w-1 bg-rally-green rounded-l-rally" />
      )}
      {status === 'unlocked' && (
        <div className="absolute top-0 left-0 bottom-0 w-1 bg-rally-blue-dark rounded-l-rally" />
      )}

      <div className="flex items-center gap-3">
        {/* Number badge */}
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 transition-colors',
            status === 'completed' && 'bg-rally-green text-white',
            status === 'unlocked' && 'bg-rally-blue-dark text-white',
            status === 'locked' && 'bg-rally-beige-dark/50 text-rally-gray'
          )}
        >
          {status === 'completed' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            number
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              'font-bold text-sm truncate',
              status === 'locked' ? 'text-rally-gray' : 'text-rally-gray-dark'
            )}
          >
            {nameJa}
          </h3>
          <p className="text-rally-gray text-xs mt-0.5 truncate">{name}</p>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-rally-gray flex-shrink-0" />
              <span className="text-rally-gray text-xs truncate">{area}</span>
            </div>
            {distanceMeters != null && status !== 'completed' && (
              <div className="flex items-center gap-1">
                <Navigation className="w-3 h-3 text-rally-blue-dark flex-shrink-0" />
                <span className="text-rally-blue-dark text-xs font-medium">
                  {formatDistance(distanceMeters)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {status === 'completed' ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-rally-green" />
              <span className="text-xs font-bold text-rally-green">完了</span>
            </>
          ) : status === 'unlocked' ? (
            <>
              <Circle className="w-5 h-5 text-rally-blue-dark" />
              <ChevronRight className="w-4 h-4 text-rally-blue-dark" />
            </>
          ) : (
            <Lock className="w-4 h-4 text-rally-gray" />
          )}
        </div>
      </div>

      {/* Hint for unlocked */}
      {status === 'unlocked' && hint && (
        <div className="mt-3 pt-3 border-t border-rally-blue/40">
          <p className="text-xs text-rally-blue-dark font-medium">{hint}</p>
        </div>
      )}
    </>
  )

  if (isInteractive) {
    return (
      <Link href={`/checkpoint/${id}`} className={containerClasses}>
        {content}
      </Link>
    )
  }

  return <div className={containerClasses}>{content}</div>
}
