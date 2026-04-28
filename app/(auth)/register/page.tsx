'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import { CompassIcon, PaperGrain } from '@/components/anjin'
import { REGISTRATION_OPEN_AT } from '@/lib/registration-config'

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:       '#f5f3ed',
  surf:     '#faf9f5',
  card:     '#ffffff',
  ink:      '#2a2925',
  ink2:     '#6b6860',
  sea:      '#5a8ba3',
  sea2:     '#a8c5d6',
  moss:     '#7da892',
  cinnabar: '#a85a3a',
  rule:     'rgba(42,41,37,0.10)',
} as const

type FormData = {
  riderName: string
  bikeMake: string
  bikeModel: string
  bikeYear: string
  emergencyName: string
  emergencyPhone: string
  emergencyRelation: string
  agreeTerms: boolean
}

// ─── Shared field component ───────────────────────────────────────────────────
function Field({
  labelJP,
  labelEN,
  children,
}: {
  labelJP: string
  labelEN: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontFamily: '"Shippori Mincho", serif',
            fontSize: 13,
            fontWeight: 600,
            color: T.ink,
          }}
        >
          {labelJP}
        </span>
        <span
          style={{
            fontSize: 9,
            letterSpacing: '1.8em',
            textTransform: 'uppercase' as const,
            color: T.ink2,
            fontWeight: 600,
          }}
        >
          {labelEN}
        </span>
      </div>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  background: T.card,
  border: `1px solid ${T.rule}`,
  borderRadius: 10,
  fontSize: 15,
  color: T.ink,
  outline: 'none',
  boxSizing: 'border-box',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
  appearance: 'none' as const,
}

export default function RegisterPage() {
  const router = useRouter()
  const [step,      setStep]      = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [pin,       setPin]       = useState(['', '', '', ''])
  const [countdown, setCountdown] = useState('')
  const [regOpen,   setRegOpen]   = useState(() => Date.now() >= REGISTRATION_OPEN_AT.getTime())

  useEffect(() => {
    if (regOpen) return
    const tick = () => {
      const ms = REGISTRATION_OPEN_AT.getTime() - Date.now()
      if (ms <= 0) { setRegOpen(true); return }
      const d = Math.floor(ms / 86400000)
      const h = Math.floor((ms % 86400000) / 3600000)
      const m = Math.floor((ms % 3600000) / 60000)
      const s = Math.floor((ms % 60000) / 1000)
      setCountdown(`${d}日 ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [regOpen])
  const [form,      setForm]      = useState<FormData>({
    riderName:         '',
    bikeMake:          '',
    bikeModel:         '',
    bikeYear:          '',
    emergencyName:     '',
    emergencyPhone:    '',
    emergencyRelation: '',
    agreeTerms:        false,
  })

  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  const update = (field: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newPin = [...pin]
    newPin[index] = value.slice(-1)
    setPin(newPin)
    if (value && index < 3) {
      pinRefs[index + 1].current?.focus()
    }
  }

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs[index - 1].current?.focus()
    }
  }

  const validateStep = (): boolean => {
    if (step === 1) {
      if (!form.riderName.trim()) {
        setError('ライダー名を入力してください')
        return false
      }
      if (form.riderName.trim().length > 50) {
        setError('ライダー名は50文字以内で入力してください')
        return false
      }
      if (!form.bikeMake.trim() || !form.bikeModel.trim()) {
        setError('バイクのメーカーとモデルを入力してください')
        return false
      }
    }
    if (step === 2) {
      if (!form.emergencyName.trim() || !form.emergencyPhone.trim()) {
        setError('緊急連絡先の名前と電話番号を入力してください')
        return false
      }
      if (!/^[\d\-\+\(\)\s]{10,15}$/.test(form.emergencyPhone.trim())) {
        setError('有効な電話番号を入力してください（例: 090-1234-5678）')
        return false
      }
      const pinStr = pin.join('')
      if (pinStr.length > 0 && pinStr.length < 4) {
        setError('PINは4桁すべて入力してください（空欄の場合は自動発行）')
        return false
      }
    }
    return true
  }

  const handleNext = () => {
    if (validateStep()) {
      setStep((s) => s + 1)
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.agreeTerms) {
      setError('利用規約に同意してください')
      return
    }

    setIsLoading(true)
    try {
      const pinStr = pin.join('')
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rider_name:        form.riderName.trim(),
          motorcycle_make:   form.bikeMake.trim(),
          motorcycle_model:  form.bikeModel.trim(),
          motorcycle_year:   form.bikeYear ? parseInt(form.bikeYear) : null,
          emergency_contact: form.emergencyName.trim(),
          emergency_phone:   form.emergencyPhone.trim(),
          // Send user-chosen PIN if complete; server falls back to random if omitted
          pin:               pinStr.length === 4 ? pinStr : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '登録に失敗しました')
      // Store PIN in sessionStorage (never in URL — not in history/logs/referrer)
      sessionStorage.setItem('anjin_new_pin', data.pin)
      sessionStorage.setItem('anjin_new_rider', data.rider_number)
      router.push('/login?registered=true')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '登録に失敗しました。もう一度お試しください。')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100svh',
        background: T.bg,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Dark header ── */}
      <div
        style={{
          background: T.ink,
          color: T.bg,
          padding: '70px 24px 24px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative large compass */}
        <div
          style={{
            position: 'absolute',
            right: -40,
            top: 30,
            pointerEvents: 'none',
          }}
        >
          <CompassIcon size={160} color={T.bg} strokeWidth={0.8} />
        </div>
        {/* Faint grain on header */}
        <PaperGrain opacity={0.08} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Back link */}
          <Link
            href="/login"
            style={{
              position: 'absolute',
              top: -48,
              left: 0,
              color: `${T.bg}99`,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 13,
              textDecoration: 'none',
            }}
          >
            <ChevronLeft style={{ width: 16, height: 16 }} />
          </Link>

          {/* Eyebrow */}
          <div
            style={{
              fontSize: 10,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: `${T.bg}99`,
              fontWeight: 600,
            }}
          >
            参加登録　·　Enrolment
          </div>

          {/* Heading */}
          <div
            style={{
              fontFamily: '"Shippori Mincho", serif',
              fontSize: 34,
              fontWeight: 700,
              color: T.bg,
              marginTop: 12,
              lineHeight: 1.15,
              whiteSpace: 'pre-line',
            }}
          >
            {'名簿に\n署名を。'}
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontFamily: 'var(--font-cormorant, "Cormorant Garamond", serif)',
              fontStyle: 'italic',
              fontSize: 14,
              color: T.bg,
              opacity: 0.75,
              marginTop: 10,
            }}
          >
            Sign the rider&apos;s ledger.
          </div>

          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20 }}>
            {[1, 2, 3].map((s) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    background: s < step ? T.moss : s === step ? T.sea : `${T.bg}18`,
                    color: s <= step ? T.bg : `${T.bg}60`,
                    transition: 'background 0.2s',
                    flexShrink: 0,
                  }}
                >
                  {s < step ? <CheckCircle2 style={{ width: 14, height: 14 }} /> : s}
                </div>
                {s < 3 && (
                  <div
                    style={{
                      width: 28,
                      height: 1.5,
                      background: s < step ? T.moss : `${T.bg}18`,
                      transition: 'background 0.2s',
                    }}
                  />
                )}
              </div>
            ))}
            <span style={{ fontSize: 11, color: `${T.bg}60`, marginLeft: 6 }}>{step} / 3</span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div
        style={{
          flex: 1,
          padding: '28px 22px 40px',
          position: 'relative',
        }}
      >
        <PaperGrain opacity={0.10} />

        <div style={{ position: 'relative', zIndex: 1 }}>

          {/* ── Registration not yet open ── */}
          {!regOpen && (
            <div style={{ textAlign: 'center', paddingTop: 20 }}>
              <div style={{ fontFamily: '"Shippori Mincho", serif', fontSize: 13, color: T.ink2, marginBottom: 28, lineHeight: 1.8 }}>
                参加登録は<strong style={{ color: T.ink }}>5月1日 0:00</strong>より<br />早い者勝ちで受付開始です。
              </div>
              <div style={{
                background: T.card,
                border: `1px solid ${T.rule}`,
                borderRadius: 16,
                padding: '28px 20px',
                marginBottom: 28,
              }}>
                <div style={{ fontSize: 10, letterSpacing: '0.22em', color: T.ink2, textTransform: 'uppercase', marginBottom: 12 }}>
                  Registration opens in
                </div>
                <div style={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontSize: 38,
                  fontWeight: 600,
                  color: T.ink,
                  letterSpacing: '0.04em',
                  lineHeight: 1,
                }}>
                  {countdown}
                </div>
                <div style={{ fontSize: 10, letterSpacing: '0.14em', color: T.ink2, marginTop: 10 }}>
                  2026.05.01 · 00:00 JST
                </div>
              </div>
              <div style={{ fontFamily: '"Shippori Mincho", serif', fontSize: 12, color: T.ink2, lineHeight: 1.8 }}>
                このページをブックマークしておいてください。<br />
                開幕と同時に登録できます。
              </div>
              <div style={{ marginTop: 28 }}>
                <Link href="/login" style={{ color: T.sea, fontSize: 13, textDecoration: 'none', fontFamily: '"Shippori Mincho", serif' }}>
                  すでに登録済みの方はこちら →
                </Link>
              </div>
            </div>
          )}

          {/* ── Registration form (only shown when open) ── */}
          {regOpen && <>

          {/* Error message */}
          {error && (
            <div
              style={{
                color: '#c0392b',
                fontSize: 13,
                marginBottom: 18,
                lineHeight: 1.5,
              }}
            >
              {error}
            </div>
          )}

          {/* ── STEP 1: Rider & bike info ── */}
          {step === 1 && (
            <div>
              <Field labelJP="氏名" labelEN="FULL NAME">
                <input
                  type="text"
                  value={form.riderName}
                  onChange={(e) => update('riderName', e.target.value)}
                  placeholder="山田 太郎"
                  style={inputStyle}
                  required
                />
              </Field>

              <Field labelJP="モデル" labelEN="MODEL">
                <input
                  type="text"
                  value={form.bikeModel}
                  onChange={(e) => update('bikeModel', e.target.value)}
                  placeholder="Interceptor 650"
                  style={inputStyle}
                  required
                />
              </Field>

              <Field labelJP="バイクメーカー" labelEN="MAKE">
                <input
                  type="text"
                  value={form.bikeMake}
                  onChange={(e) => update('bikeMake', e.target.value)}
                  placeholder="Royal Enfield"
                  style={inputStyle}
                  required
                />
              </Field>

              <Field labelJP="年式" labelEN="YEAR">
                <input
                  type="number"
                  value={form.bikeYear}
                  onChange={(e) => update('bikeYear', e.target.value)}
                  placeholder="2023"
                  style={inputStyle}
                  min="1950"
                  max="2026"
                />
              </Field>

              <button
                type="button"
                onClick={handleNext}
                style={{
                  width: '100%',
                  background: T.ink,
                  color: T.bg,
                  padding: '18px',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 8,
                }}
              >
                次へ
                <ChevronRight style={{ width: 16, height: 16 }} />
              </button>
            </div>
          )}

          {/* ── STEP 2: Emergency contact ── */}
          {step === 2 && (
            <div>
              <Field labelJP="氏名" labelEN="FULL NAME">
                <input
                  type="text"
                  value={form.emergencyName}
                  onChange={(e) => update('emergencyName', e.target.value)}
                  placeholder="山田 花子"
                  style={inputStyle}
                  required
                />
              </Field>

              <Field labelJP="電話番号" labelEN="PHONE">
                <input
                  type="tel"
                  inputMode="tel"
                  value={form.emergencyPhone}
                  onChange={(e) => update('emergencyPhone', e.target.value)}
                  placeholder="090-1234-5678"
                  style={inputStyle}
                  required
                />
              </Field>

              <Field labelJP="続柄" labelEN="RELATION">
                <select
                  value={form.emergencyRelation}
                  onChange={(e) => update('emergencyRelation', e.target.value)}
                  style={selectStyle}
                >
                  <option value="">選択してください</option>
                  <option value="family">家族</option>
                  <option value="spouse">配偶者</option>
                  <option value="friend">友人</option>
                  <option value="other">その他</option>
                </select>
              </Field>

              {/* PIN block */}
              <div
                style={{
                  marginTop: 32,
                  padding: 20,
                  background: T.surf,
                  borderRadius: 12,
                  border: `1px solid ${T.rule}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: 14,
                  }}
                >
                  <span
                    style={{
                      fontFamily: '"Shippori Mincho", serif',
                      fontSize: 13,
                      fontWeight: 600,
                      color: T.ink,
                    }}
                  >
                    4桁の暗証番号（任意）
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      letterSpacing: '1.8em',
                      textTransform: 'uppercase',
                      color: T.ink2,
                      fontWeight: 600,
                    }}
                  >
                    4-DIGIT PIN
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {pin.map((digit, index) => (
                    <input
                      key={index}
                      ref={pinRefs[index]}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handlePinChange(index, e.target.value)}
                      onKeyDown={(e) => handlePinKeyDown(index, e)}
                      style={{
                        aspectRatio: '1',
                        textAlign: 'center',
                        fontFamily: 'var(--font-cormorant, "Cormorant Garamond", serif)',
                        fontSize: 28,
                        fontWeight: 600,
                        background: T.card,
                        border: `1.5px solid ${digit ? T.sea : T.rule}`,
                        borderRadius: 10,
                        color: T.ink,
                        outline: 'none',
                        transition: 'border-color 0.15s',
                        width: '100%',
                      }}
                    />
                  ))}
                </div>

                <div
                  style={{
                    fontFamily: '"Shippori Mincho", serif',
                    fontSize: 11,
                    color: T.ink2,
                    marginTop: 10,
                  }}
                >
                  自分で決める場合はここに入力。空欄の場合は自動発行されます。
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(null) }}
                  style={{
                    flex: 1,
                    background: `${T.ink}12`,
                    color: T.ink,
                    padding: '18px',
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <ChevronLeft style={{ width: 16, height: 16 }} />
                  戻る
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  style={{
                    flex: 2,
                    background: T.ink,
                    color: T.bg,
                    padding: '18px',
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  次へ
                  <ChevronRight style={{ width: 16, height: 16 }} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Terms & submit ── */}
          {step === 3 && (
            <form onSubmit={handleSubmit}>
              {/* Terms scroll box */}
              <div
                style={{
                  background: T.surf,
                  border: `1px solid ${T.rule}`,
                  borderRadius: 12,
                  padding: 16,
                  maxHeight: 200,
                  overflowY: 'auto',
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    fontFamily: '"Shippori Mincho", serif',
                    fontSize: 12,
                    color: T.ink2,
                    lineHeight: 1.8,
                  }}
                >
                  <p style={{ fontWeight: 700, color: T.ink, marginBottom: 8 }}>参加規約</p>
                  <p>1. 本イベントへの参加は任意であり、参加者は自己の責任において行動するものとします。</p>
                  <p>2. 参加者は交通法規を遵守し、安全運転に努めるものとします。</p>
                  <p>3. 参加者はヘルメット着用を義務とします。</p>
                  <p>4. イベント中に撮影した写真はイベントのSNSやウェブサイトに掲載される場合があります。</p>
                  <p>5. 参加者の個人情報はイベント運営のみに使用し、第三者への提供は行いません。</p>
                  <p>6. 天候・その他の事情によりイベント内容が変更される場合があります。</p>
                  <p>7. 参加者は本規約に同意した上で参加するものとします。</p>
                </div>
              </div>

              {/* Agree checkbox */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  cursor: 'pointer',
                  marginBottom: 28,
                }}
              >
                <div style={{ position: 'relative', marginTop: 2 }}>
                  <input
                    type="checkbox"
                    checked={form.agreeTerms}
                    onChange={(e) => update('agreeTerms', e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 5,
                      border: `2px solid ${form.agreeTerms ? T.sea : T.rule}`,
                      background: form.agreeTerms ? T.sea : T.card,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    {form.agreeTerms && (
                      <svg viewBox="0 0 12 12" width="12" height="12" fill="none">
                        <path
                          d="M2 6l3 3 5-5"
                          stroke={T.bg}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <span
                  style={{
                    fontFamily: '"Shippori Mincho", serif',
                    fontSize: 13,
                    color: T.ink,
                    lineHeight: 1.6,
                  }}
                >
                  上記の利用規約を読み、同意します
                </span>
              </label>

              {/* Error */}
              {error && (
                <div style={{ color: '#c0392b', fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
                  {error}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading || !form.agreeTerms}
                style={{
                  width: '100%',
                  background: T.ink,
                  color: T.bg,
                  padding: '18px',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 600,
                  border: 'none',
                  cursor: isLoading || !form.agreeTerms ? 'not-allowed' : 'pointer',
                  opacity: isLoading || !form.agreeTerms ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginBottom: 12,
                  transition: 'opacity 0.15s',
                }}
              >
                {isLoading ? (
                  <>
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        border: `2px solid ${T.bg}30`,
                        borderTopColor: T.bg,
                        borderRadius: '50%',
                        animation: 'spin 0.7s linear infinite',
                      }}
                    />
                    登録中…
                  </>
                ) : (
                  '登録完了'
                )}
              </button>

              {/* Fine-print note */}
              <div
                style={{
                  fontFamily: '"Shippori Mincho", serif',
                  fontSize: 11,
                  color: T.ink2,
                  textAlign: 'center',
                  lineHeight: 1.6,
                  marginTop: 12,
                }}
              >
                登録することで参加規約に同意したものとみなされます。
                <br />
                個人情報はイベント運営のみに使用します。
              </div>

              {/* Back button row */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => { setStep(2); setError(null) }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: T.ink2,
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontFamily: '"Shippori Mincho", serif',
                  }}
                >
                  <ChevronLeft style={{ width: 14, height: 14 }} />
                  戻る
                </button>
              </div>
            </form>
          )}

          {/* Login link (shown on all steps) */}
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <span style={{ fontFamily: '"Shippori Mincho", serif', fontSize: 12, color: T.ink2 }}>
              すでに登録済みの方は
            </span>
            {'　'}
            <Link
              href="/login"
              style={{
                color: T.sea,
                fontWeight: 600,
                fontSize: 12,
                textDecoration: 'none',
                fontFamily: '"Shippori Mincho", serif',
              }}
            >
              ログイン →
            </Link>
          </div>
          </> /* end regOpen */}

        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
