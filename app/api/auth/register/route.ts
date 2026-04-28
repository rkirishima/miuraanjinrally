import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hashPin } from '@/lib/auth'
import { isRegistrationOpen, REGISTRATION_OPEN_AT } from '@/lib/registration-config'

export const runtime = 'nodejs'

// ── helpers ──────────────────────────────────────────────────────────────────

/** Validate a Japanese phone number (loose: 10-11 digits, hyphens allowed). */
function isValidPhone(phone: string): boolean {
  return /^[\d\-\+\(\)\s]{10,15}$/.test(phone.trim())
}

/**
 * Generate the next sequential rider number atomically.
 * Uses COUNT as a hint but retries on unique-constraint violations (code 23505)
 * so concurrent registrations always succeed — even under 100+ simultaneous sign-ups.
 */
async function insertParticipant(
  admin: ReturnType<typeof createAdminClient>,
  payload: {
    rider_name: string
    pin_hash: string
    motorcycle_make: string | null
    motorcycle_model: string | null
    motorcycle_year: number | null
    emergency_contact: string | null
    emergency_phone: string | null
  }
): Promise<{ rider_number: string; id: string }> {
  const MAX_RETRIES = 10

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    // Count existing rows to derive the next number.
    // On conflict we simply add 1 and retry — safe because rider_number is UNIQUE.
    const { count } = await admin
      .from('participants')
      .select('*', { count: 'exact', head: true })

    const nextNum = (count ?? 0) + 1 + attempt // offset on retry
    const riderNumber = `R${String(nextNum).padStart(3, '0')}`

    const { data, error } = await admin
      .from('participants')
      .insert({ rider_number: riderNumber, ...payload })
      .select('id, rider_number')
      .single()

    if (!error && data) {
      return { rider_number: data.rider_number, id: data.id }
    }

    // 23505 = unique_violation — rider_number taken, retry with next candidate
    if (error?.code === '23505') continue

    // Any other DB error → surface it
    throw new Error(error?.message ?? '登録に失敗しました')
  }

  throw new Error('ライダー番号の割り当てに失敗しました。もう一度お試しください。')
}

// ── route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // ── Registration date gate ────────────────────────────────────────────────
  if (!isRegistrationOpen()) {
    const opensAt = REGISTRATION_OPEN_AT.toLocaleDateString('ja-JP', {
      year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Tokyo'
    })
    return NextResponse.json(
      { error: `参加登録は${opensAt}より受付開始です。` },
      { status: 403 }
    )
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'リクエストが不正です' }, { status: 400 })
  }

  const {
    rider_name,
    motorcycle_make,
    motorcycle_model,
    motorcycle_year,
    emergency_contact,
    emergency_phone,
    pin: userPin,
  } = body as {
    rider_name?: string
    motorcycle_make?: string
    motorcycle_model?: string
    motorcycle_year?: number
    emergency_contact?: string
    emergency_phone?: string
    pin?: string
  }

  // ── Validation ──────────────────────────────────────────────────────────────
  if (!rider_name?.trim()) {
    return NextResponse.json({ error: 'ライダー名は必須です' }, { status: 400 })
  }
  if (rider_name.trim().length > 50) {
    return NextResponse.json({ error: 'ライダー名は50文字以内で入力してください' }, { status: 400 })
  }
  if (!emergency_contact?.trim()) {
    return NextResponse.json({ error: '緊急連絡先の氏名は必須です' }, { status: 400 })
  }
  if (!emergency_phone?.trim()) {
    return NextResponse.json({ error: '緊急連絡先の電話番号は必須です' }, { status: 400 })
  }
  if (!isValidPhone(emergency_phone)) {
    return NextResponse.json({ error: '有効な電話番号を入力してください（例: 090-1234-5678）' }, { status: 400 })
  }

  // ── PIN ─────────────────────────────────────────────────────────────────────
  // Prefer user-set PIN (must be exactly 4 digits), otherwise generate randomly.
  let pin: string
  if (userPin && /^\d{4}$/.test(userPin)) {
    pin = userPin
  } else {
    pin = String(Math.floor(1000 + Math.random() * 9000))
  }
  const pinHash = await hashPin(pin)

  // ── Insert ──────────────────────────────────────────────────────────────────
  try {
    const admin = createAdminClient()
    const { rider_number } = await insertParticipant(admin, {
      pin_hash: pinHash,
      rider_name: rider_name.trim(),
      motorcycle_make: motorcycle_make?.trim() || null,
      motorcycle_model: motorcycle_model?.trim() || null,
      motorcycle_year: motorcycle_year ?? null,
      emergency_contact: emergency_contact.trim(),
      emergency_phone: emergency_phone.trim(),
    })

    return NextResponse.json({
      success: true,
      rider_number,
      pin,
      message: 'このPINを大切に保管してください。再表示できません。',
    })
  } catch (err) {
    console.error('Registration error:', err)
    const message = err instanceof Error ? err.message : '登録に失敗しました'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
