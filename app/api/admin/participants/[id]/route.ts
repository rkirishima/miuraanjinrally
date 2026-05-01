import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Admin auth check via cookie
  const isAdmin = request.cookies.get('anjin_admin')?.value === 'true'
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params
  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 })
  }

  // Prevent deleting system accounts
  const admin = createAdminClient()
  const { data: participant } = await admin
    .from('participants')
    .select('rider_number')
    .eq('id', id)
    .single()

  if (participant?.rider_number === 'ADMIN' || participant?.rider_number === 'T000') {
    return NextResponse.json({ error: 'システムアカウントは削除できません' }, { status: 403 })
  }

  // Delete related records first (cascade may not be set up)
  await admin.from('checkpoint_completions').delete().eq('participant_id', id)
  await admin.from('quiz_attempts').delete().eq('participant_id', id)

  const { error } = await admin.from('participants').delete().eq('id', id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
