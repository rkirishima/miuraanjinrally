import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

export function zeroPad(n: number, width = 3): string {
  return String(n).padStart(width, '0')
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function percentOf(value: number, total: number): number {
  if (total === 0) return 0
  return clamp(Math.round((value / total) * 100), 0, 100)
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export type CheckpointStatus = 'locked' | 'unlocked' | 'completed'

export function getCheckpointStatusLabel(status: CheckpointStatus): string {
  switch (status) {
    case 'locked':
      return 'ロック中'
    case 'unlocked':
      return '未訪問'
    case 'completed':
      return '完了'
  }
}
