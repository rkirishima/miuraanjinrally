import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const sessionParticipant = await requireSession()
    const participantId = sessionParticipant.id
    const admin = createAdminClient()

    const [{ data: participant }, { data: completions }] = await Promise.all([
      admin.from('participants').select('id, rider_number, rider_name, motorcycle_make, motorcycle_model, is_admin, started_at, finished_at').eq('id', participantId).single(),
      admin.from('checkpoint_completions').select('*').eq('participant_id', participantId)
    ])

    return NextResponse.json({ participant, completions: completions || [] })
  } catch {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }
}
