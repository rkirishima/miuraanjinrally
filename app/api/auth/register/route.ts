import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hashPin } from '@/lib/auth'
import { isRegistrationOpen, REGISTRATION_OPEN_AT } from '@/lib/registration-config'
import { Resend } from 'resend'

export const runtime = 'nodejs'

const resend = new Resend(process.env.RESEND_API_KEY)

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
    email: string | null
    pin_hash: string
    motorcycle_make: string | null
    motorcycle_model: string | null
    motorcycle_year: number | null
    emergency_contact: string | null
    emergency_phone: string | null
    planned_day: string | null
  }
): Promise<{ rider_number: string; id: string }> {
  const MAX_RETRIES = 10

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    // Count only R### riders (excludes system accounts like ADMIN, T000).
    // On conflict we simply add 1 and retry — safe because rider_number is UNIQUE.
    const { count } = await admin
      .from('participants')
      .select('*', { count: 'exact', head: true })
      .like('rider_number', 'R%')

    const nextNum = (count ?? 0) + 1 + attempt // offset on retry
    const riderNumber = `R${String(nextNum).padStart(3, '0')}`

    const { data, error } = await admin
      .from('participants')
      .insert({ rider_number: riderNumber, ...payload } as never)
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

/** Send registration confirmation email via Resend. Fire-and-forget (never throws). */
async function sendConfirmationEmail(to: string, riderName: string, riderNumber: string, pin: string) {
  const plannedDayNote = ''
  try {
    await resend.emails.send({
      from: 'MIURA ANJIN RALLY 2026 <info@felicity.cafe>',
      to,
      subject: `【按針ラリー】参加登録完了 — ${riderNumber}`,
      html: `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>参加登録完了</title>
</head>
<body style="margin:0;padding:0;background:#f5f3ed;font-family:'Helvetica Neue',Arial,'Hiragino Kaku Gothic ProN','Hiragino Sans',Meiryo,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ed;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="background:#2a2925;padding:40px 36px 32px;text-align:center;">
              <div style="font-size:10px;letter-spacing:0.3em;color:rgba(245,243,237,0.6);text-transform:uppercase;margin-bottom:14px;">
                Miura Anjin Rally 2026
              </div>
              <div style="font-size:28px;font-weight:700;color:#f5f3ed;line-height:1.2;letter-spacing:0.02em;">
                登録完了
              </div>
              <div style="font-size:13px;color:rgba(245,243,237,0.7);margin-top:8px;font-style:italic;">
                Enrolment Confirmed
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 36px 32px;">

              <p style="font-size:15px;color:#2a2925;line-height:1.8;margin:0 0 24px;">
                ${riderName} 様<br>
                三浦按針ラリー 2026 へのご参加登録、誠にありがとうございます。
              </p>

              <!-- Rider number box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ed;border-radius:12px;margin-bottom:16px;">
                <tr>
                  <td style="padding:24px;text-align:center;">
                    <div style="font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#6b6860;margin-bottom:10px;">
                      Rider Number
                    </div>
                    <div style="font-size:42px;font-weight:700;color:#2a2925;letter-spacing:0.08em;line-height:1;">
                      ${riderNumber}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- PIN box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ed;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px;text-align:center;">
                    <div style="font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#6b6860;margin-bottom:10px;">
                      4-Digit PIN
                    </div>
                    <div style="font-size:42px;font-weight:700;color:#5a8ba3;letter-spacing:0.2em;line-height:1;">
                      ${pin}
                    </div>
                    <div style="font-size:11px;color:#6b6860;margin-top:12px;line-height:1.6;">
                      ログイン時に必要です。大切に保管してください。<br>
                      このメール以外では再表示されません。
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Event info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(42,41,37,0.1);padding-top:24px;margin-bottom:24px;">
                <tr>
                  <td>
                    <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6b6860;margin-bottom:16px;">
                      Event Info
                    </div>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:13px;color:#6b6860;padding:6px 0;width:80px;">開催日</td>
                        <td style="font-size:13px;color:#2a2925;padding:6px 0;font-weight:600;">2026年6月20日（土）・21日（日）</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#6b6860;padding:6px 0;">集合地</td>
                        <td style="font-size:13px;color:#2a2925;padding:6px 0;font-weight:600;">FELICITY（葉山）</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#6b6860;padding:6px 0;">形式</td>
                        <td style="font-size:13px;color:#2a2925;padding:6px 0;font-weight:600;">GPSスタンプラリー</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="font-size:13px;color:#6b6860;line-height:1.8;margin:0 0 24px;">
                当日はこのアプリからライダー番号とPINでログインして参加します。<br>
                詳細は後日お知らせします。
              </p>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://anjinrally.com" style="display:inline-block;background:#2a2925;color:#f5f3ed;text-decoration:none;font-size:14px;font-weight:600;padding:14px 32px;border-radius:10px;letter-spacing:0.04em;">
                      anjinrally.com →
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f5f3ed;padding:20px 36px;text-align:center;border-top:1px solid rgba(42,41,37,0.08);">
              <div style="font-size:11px;color:#6b6860;line-height:1.6;">
                MIURA ANJIN RALLY 2026<br>
                主催: FELICITY × Royal Enfield<br>
                <a href="https://anjinrally.com" style="color:#5a8ba3;text-decoration:none;">anjinrally.com</a>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    })
  } catch (err) {
    // Email failure should never block registration
    console.error('Failed to send confirmation email:', err)
  }
  void plannedDayNote
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
    email,
    motorcycle_make,
    motorcycle_model,
    motorcycle_year,
    emergency_contact,
    emergency_phone,
    planned_day,
    pin: userPin,
  } = body as {
    rider_name?: string
    email?: string
    motorcycle_make?: string
    motorcycle_model?: string
    motorcycle_year?: number
    emergency_contact?: string
    emergency_phone?: string
    planned_day?: string
    pin?: string
  }

  // ── Capacity check ──────────────────────────────────────────────────────────
  const MAX_PARTICIPANTS = 150
  const admin = createAdminClient()
  const { count: currentCount } = await admin
    .from('participants')
    .select('*', { count: 'exact', head: true })
  if ((currentCount ?? 0) >= MAX_PARTICIPANTS) {
    return NextResponse.json(
      { error: '定員（150名）に達したため、現在エントリーを締め切っています。' },
      { status: 409 }
    )
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
    const { rider_number } = await insertParticipant(admin, {
      pin_hash: pinHash,
      rider_name: rider_name.trim(),
      email: email?.trim() || null,
      motorcycle_make: motorcycle_make?.trim() || null,
      motorcycle_model: motorcycle_model?.trim() || null,
      motorcycle_year: motorcycle_year ?? null,
      emergency_contact: emergency_contact.trim(),
      emergency_phone: emergency_phone.trim(),
      planned_day: planned_day ?? null,
    })

    // ── Send confirmation email (non-blocking) ────────────────────────────────
    if (email?.trim()) {
      void sendConfirmationEmail(email.trim(), rider_name.trim(), rider_number, pin)
    }

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
