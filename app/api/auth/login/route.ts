import { NextRequest, NextResponse } from 'next/server'
import { loginWithPin, setSessionCookie } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  let body: { rider_number?: string; riderNumber?: string; pin?: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'リクエストが不正です' },
      { status: 400 }
    )
  }

  // Accept both snake_case (client) and camelCase (legacy) field names
  const riderNumber = body.rider_number ?? body.riderNumber
  const { pin } = body

  if (!riderNumber || typeof riderNumber !== 'string') {
    return NextResponse.json(
      { success: false, error: 'ライダー番号を入力してください' },
      { status: 400 }
    )
  }

  if (!pin || typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
    return NextResponse.json(
      { success: false, error: '4桁のPINを入力してください' },
      { status: 400 }
    )
  }

  try {
    const participant = await loginWithPin(riderNumber, pin)

    // Write the session cookie (+ admin cookie for middleware)
    setSessionCookie(participant.id, participant.is_admin ?? false)

    return NextResponse.json({ success: true, participant })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'ログインに失敗しました'
    return NextResponse.json({ success: false, error: message }, { status: 401 })
  }
}
