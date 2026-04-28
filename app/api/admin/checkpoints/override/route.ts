import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  if (!await isAdminSession()) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 })
  }

  const { rider_number, checkpoint_order } = await request.json()
  if (!rider_number || !checkpoint_order) {
    return NextResponse.json({ error: 'パラメーターが不足しています' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Find participant
  const { data: participant } = await supabase
    .from('participants')
    .select('id')
    .eq('rider_number', String(rider_number).trim())
    .single()

  if (!participant) {
    return NextResponse.json({ error: 'ライダーが見つかりません' }, { status: 404 })
  }

  // Find checkpoint by order
  const { data: checkpoint } = await supabase
    .from('checkpoints')
    .select('id')
    .eq('order_index', checkpoint_order)
    .single()

  if (!checkpoint) {
    return NextResponse.json({ error: 'チェックポイントが見つかりません' }, { status: 404 })
  }

  const now = new Date().toISOString()

  // Upsert completion
  const { error } = await supabase
    .from('checkpoint_completions')
    .upsert({
      participant_id: participant.id,
      checkpoint_id: checkpoint.id,
      arrived_at: now,
      quiz_passed_at: now,
      completed_at: now,
      photo_uploaded_at: now,
    }, { onConflict: 'participant_id,checkpoint_id' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update finished_at if all 6 completed
  const { count } = await supabase
    .from('checkpoint_completions')
    .select('*', { count: 'exact', head: true })
    .eq('participant_id', participant.id)
    .not('completed_at', 'is', null)

  if (count === 6) {
    await supabase
      .from('participants')
      .update({ finished_at: now })
      .eq('id', participant.id)
  }

  return NextResponse.json({ success: true })
}
