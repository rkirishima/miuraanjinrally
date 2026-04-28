import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await isAdminSession()
    if (!isAdmin) throw new Error('Not admin')
    const admin = createAdminClient()

    const { data: participants } = await admin
      .from('participants')
      .select(`
        id, rider_number, rider_name, motorcycle_make, motorcycle_model,
        started_at, finished_at, created_at,
        checkpoint_completions(checkpoint_id, completed_at)
      `)
      .order('created_at')

    return NextResponse.json({ participants: participants || [] })
  } catch {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 })
  }
}
