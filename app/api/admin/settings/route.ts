import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminSession } from '@/lib/auth'

export async function GET() {
  if (!await isAdminSession()) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 })
  }
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('checkpoints')
    .select('id, name, order_index, radius_meters')
    .order('order_index')
  return NextResponse.json({ checkpoints: data ?? [] })
}

export async function PATCH(request: NextRequest) {
  if (!await isAdminSession()) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 })
  }
  const { checkpoint_id, radius_meters } = await request.json()
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('checkpoints')
    .update({ radius_meters })
    .eq('id', checkpoint_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
