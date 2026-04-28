import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireSession } from '@/lib/auth'

const POINTS_PER_CHECKPOINT = 100
const PENALTY_PER_WRONG     = 10

export async function GET() {
  try {
    await requireSession()
  } catch {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const [{ data: participants }, { data: attempts }] = await Promise.all([
    supabase
      .from('participants')
      .select(`
        id,
        rider_number,
        rider_name,
        motorcycle_make,
        motorcycle_model,
        started_at,
        finished_at,
        checkpoint_completions(checkpoint_id, completed_at)
      `)
      .not('started_at', 'is', null)
      .order('rider_number'),
    supabase
      .from('quiz_attempts')
      .select('participant_id, is_correct'),
  ])

  if (!participants) {
    return NextResponse.json({ leaderboard: [] })
  }

  // Count wrong answers per participant
  const wrongByParticipant: Record<string, number> = {}
  for (const a of attempts ?? []) {
    if (!a.is_correct) {
      wrongByParticipant[a.participant_id] = (wrongByParticipant[a.participant_id] ?? 0) + 1
    }
  }

  const leaderboard = participants
    .map(p => {
      const completedCount = (p.checkpoint_completions as Array<{ completed_at: string | null }>)
        .filter(c => c.completed_at).length
      const wrongCount = wrongByParticipant[p.id] ?? 0
      const score = completedCount * POINTS_PER_CHECKPOINT - wrongCount * PENALTY_PER_WRONG
      return {
        riderNumber:   p.rider_number,
        riderName:     p.rider_name,
        motorcycleMake: p.motorcycle_make,
        completedCount,
        wrongCount,
        score,
        finishedAt: p.finished_at,
        startedAt:  p.started_at,
      }
    })
    .sort((a, b) => {
      // Primary: score desc
      if (b.score !== a.score) return b.score - a.score
      // Secondary: finished first
      if (a.finishedAt && b.finishedAt)
        return new Date(a.finishedAt).getTime() - new Date(b.finishedAt).getTime()
      if (a.finishedAt) return -1
      if (b.finishedAt) return 1
      return 0
    })

  return NextResponse.json({ leaderboard })
}
