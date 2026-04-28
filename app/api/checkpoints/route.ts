import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildCheckpointsWithStatus } from '@/lib/checkpoints'

export const runtime = 'nodejs'

/**
 * GET /api/checkpoints
 *
 * Returns all active checkpoints with per-participant completion status.
 * Optionally accepts ?lat=&lon= query params to include distances.
 */
export async function GET(request: NextRequest) {
  // Require a valid session
  let participant: Awaited<ReturnType<typeof requireSession>>
  try {
    participant = await requireSession()
  } catch {
    return NextResponse.json(
      { success: false, error: 'ログインが必要です' },
      { status: 401 }
    )
  }

  // Optional GPS coordinates from query string
  const { searchParams } = new URL(request.url)
  const latParam = searchParams.get('lat')
  const lonParam = searchParams.get('lon')
  const currentLat = latParam ? parseFloat(latParam) : undefined
  const currentLon = lonParam ? parseFloat(lonParam) : undefined

  const adminClient = createAdminClient()

  // Fetch all active checkpoints
  const { data: checkpoints, error: cpError } = await adminClient
    .from('checkpoints')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true })

  if (cpError) {
    console.error('[GET /api/checkpoints] checkpoints fetch error:', cpError)
    return NextResponse.json(
      { success: false, error: 'チェックポイントの取得に失敗しました' },
      { status: 500 }
    )
  }

  // Fetch this participant's completions
  const { data: completions, error: compError } = await adminClient
    .from('checkpoint_completions')
    .select('*')
    .eq('participant_id', participant.id)

  if (compError) {
    console.error('[GET /api/checkpoints] completions fetch error:', compError)
    return NextResponse.json(
      { success: false, error: '進捗の取得に失敗しました' },
      { status: 500 }
    )
  }

  const checkpointsWithStatus = buildCheckpointsWithStatus(
    checkpoints ?? [],
    completions ?? [],
    currentLat,
    currentLon
  )

  const completedCount = (completions ?? []).filter((c) => c.completed_at != null).length

  return NextResponse.json({
    success: true,
    checkpoints: checkpointsWithStatus,
    completedCount,
    totalCount: (checkpoints ?? []).length,
  })
}
