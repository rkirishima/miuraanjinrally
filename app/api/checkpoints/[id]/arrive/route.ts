import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCheckpointStatus, isWithinRadius } from '@/lib/checkpoints'

export const runtime = 'nodejs'

interface RouteParams {
  params: { id: string }
}

/**
 * POST /api/checkpoints/[id]/arrive
 *
 * Records GPS arrival at a checkpoint.
 * Creates (or updates) the checkpoint_completions row with arrived_at.
 * Body: { lat?: number, lon?: number }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  let participant: Awaited<ReturnType<typeof requireSession>>
  try {
    participant = await requireSession()
  } catch {
    return NextResponse.json({ success: false, error: 'ログインが必要です' }, { status: 401 })
  }

  const checkpointId = parseInt(params.id, 10)
  if (isNaN(checkpointId)) {
    return NextResponse.json({ success: false, error: 'IDが不正です' }, { status: 400 })
  }

  let body: { lat?: number; lon?: number } = {}
  try { body = await request.json() } catch { /* ignore parse errors */ }

  // GPS coordinates are required for rally integrity
  if (typeof body.lat !== 'number' || typeof body.lon !== 'number') {
    return NextResponse.json(
      { success: false, error: 'GPS座標を取得できませんでした。位置情報の許可を確認してください。' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  // Fetch checkpoint
  const { data: checkpoint, error: cpError } = await admin
    .from('checkpoints').select('*').eq('id', checkpointId).single()

  if (cpError || !checkpoint) {
    return NextResponse.json({ success: false, error: 'チェックポイントが見つかりません' }, { status: 404 })
  }

  // Validate GPS proximity
  if (!isWithinRadius(body.lat, body.lon, checkpoint)) {
    return NextResponse.json(
      { success: false, error: 'チェックポイントの範囲外です。もう少し近づいてください。' },
      { status: 403 }
    )
  }

  // Fetch all participant completions & checkpoints to compute status
  const { data: allCompletions } = await admin
    .from('checkpoint_completions').select('*').eq('participant_id', participant.id)
  const { data: allCheckpoints } = await admin
    .from('checkpoints').select('*').eq('is_active', true)

  const status = getCheckpointStatus(checkpoint, allCompletions ?? [], allCheckpoints ?? [])

  if (status === 'locked') {
    return NextResponse.json(
      { success: false, error: 'このチェックポイントはまだ解放されていません' },
      { status: 403 }
    )
  }
  if (status === 'completed') {
    return NextResponse.json({ success: true, already_completed: true })
  }

  const existingCompletion = (allCompletions ?? []).find(c => c.checkpoint_id === checkpointId)

  if (existingCompletion) {
    // Already have a row — just return success (arrived_at already set)
    return NextResponse.json({ success: true, arrival_recorded: false })
  }

  // Record arrival — also mark participant started_at if first checkpoint
  const now = new Date().toISOString()

  const { error: insertError } = await admin.from('checkpoint_completions').insert({
    participant_id: participant.id,
    checkpoint_id: checkpointId,
    arrived_at: now,
    gps_lat: body.lat ?? null,
    gps_lon: body.lon ?? null,
  })

  if (insertError) {
    console.error('[arrive] insert error:', insertError)
    return NextResponse.json({ success: false, error: '到着記録に失敗しました' }, { status: 500 })
  }

  // If first checkpoint, set participant's started_at
  if (checkpoint.order_index === 1 && !participant.started_at) {
    await admin.from('participants')
      .update({ started_at: now })
      .eq('id', participant.id)
  }

  return NextResponse.json({ success: true, arrival_recorded: true })
}
