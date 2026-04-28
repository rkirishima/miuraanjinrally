'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { CompassIcon, PaperGrain, Halftone } from '@/components/anjin'

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

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isNewRegistration = searchParams.get('registered') === 'true'

  // Read registration info from sessionStorage (never from URL)
  const [registeredRider, setRegisteredRider] = useState<string | null>(null)
  const [registeredPin,   setRegisteredPin]   = useState<string | null>(null)

  const [riderNumber, setRiderNumber] = useState('')
  const [pin,         setPin]         = useState(['', '', '', ''])

  // Pull registration info from sessionStorage and clear it immediately
  useEffect(() => {
    if (!isNewRegistration) return
    const storedRider = sessionStorage.getItem('anjin_new_rider')
    const storedPin   = sessionStorage.getItem('anjin_new_pin')
    if (storedRider) { setRegisteredRider(storedRider); setRiderNumber(storedRider) }
    if (storedPin)   { setRegisteredPin(storedPin) }
    sessionStorage.removeItem('anjin_new_rider')
    sessionStorage.removeItem('anjin_new_pin')
  }, [isNewRegistration])
  const [isLoading,   setIsLoading]   = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const pinValue = pin.join('')
    if (pinValue.length !== 4) {
      setError('4桁のPINを入力してください')
      return
    }
    if (!riderNumber) {
      setError('ライダー番号を入力してください')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rider_number: riderNumber.trim(), pin: pinValue }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'ログインに失敗しました')
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました。番号またはPINを確認してください。')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100svh',
        background: T.bg,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Paper grain texture over the entire page */}
      <PaperGrain opacity={0.12} />

      {/* ── Top zone ── */}
      <div
        style={{
          paddingTop: 80,
          paddingBottom: 36,
          textAlign: 'center',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <CompassIcon size={56} color={T.ink} strokeWidth={1.2} />
        <div
          style={{
            fontFamily: '"Shippori Mincho", serif',
            fontSize: 18,
            fontWeight: 600,
            color: T.ink,
            letterSpacing: '0.06em',
            marginTop: 14,
          }}
        >
          三浦按針ラリー
        </div>
        <div
          style={{
            fontFamily: 'var(--font-cormorant, "Cormorant Garamond", serif)',
            fontStyle: 'italic',
            fontSize: 12,
            color: T.ink2,
            letterSpacing: '0.1em',
            marginTop: 4,
          }}
        >
          The Miura Anjin Rally · 2026
        </div>
      </div>

      {/* ── Content zone ── */}
      <div
        style={{
          flex: 1,
          padding: '20px 24px 28px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* New-registration success banner */}
        {isNewRegistration && registeredRider && registeredPin && (
          <div
            style={{
              background: `${T.moss}18`,
              border: `1.5px solid ${T.moss}`,
              borderRadius: 12,
              padding: '14px 16px',
              marginBottom: 20,
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <CheckCircle2 style={{ width: 18, height: 18, color: T.moss, flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontFamily: '"Shippori Mincho", serif', fontWeight: 700, fontSize: 13, color: T.ink }}>
                登録完了！
              </div>
              <div style={{ fontSize: 12, color: T.ink2, marginTop: 4, lineHeight: 1.6 }}>
                ライダー番号：<strong style={{ color: T.ink }}>{registeredRider}</strong>
                　PIN：<strong style={{ color: T.ink }}>{registeredPin}</strong>
              </div>
              <div style={{ fontSize: 11, color: T.cinnabar, fontWeight: 700, marginTop: 6 }}>
                ⚠ このPINをメモしてください。再表示できません。
              </div>
            </div>
          </div>
        )}

        {/* ── Card ── */}
        <div
          style={{
            background: T.card,
            border: `1px solid ${T.rule}`,
            borderRadius: 18,
            padding: '28px 22px',
            boxShadow: '0 4px 24px rgba(42,41,37,0.07)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Halftone texture inside card */}
          <Halftone color={T.ink} opacity={0.04} />

          {/* Content above texture */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Eyebrow */}
            <div
              style={{
                fontSize: 10,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: T.ink2,
                fontWeight: 600,
              }}
            >
              ログイン　·　Sign in
            </div>

            {/* Heading */}
            <div
              style={{
                fontFamily: '"Shippori Mincho", serif',
                fontSize: 24,
                fontWeight: 600,
                color: T.ink,
                marginTop: 12,
              }}
            >
              当日へ、ようこそ。
            </div>

            <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
              {/* ── Rider number field ── */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                  <label
                    htmlFor="rider-number"
                    style={{ fontFamily: '"Shippori Mincho", serif', fontSize: 13, fontWeight: 600, color: T.ink }}
                  >
                    ライダー番号
                  </label>
                  <span
                    style={{ fontSize: 9, letterSpacing: '1.8em', textTransform: 'uppercase', color: T.ink2, fontWeight: 600 }}
                  >
                    RIDER NUMBER
                  </span>
                </div>
                <input
                  id="rider-number"
                  type="text"
                  inputMode="text"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  value={riderNumber}
                  onChange={(e) => setRiderNumber(e.target.value.toUpperCase())}
                  placeholder="042"
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: T.surf,
                    border: `1px solid ${T.rule}`,
                    borderRadius: 10,
                    fontSize: 22,
                    fontFamily: '"JetBrains Mono", monospace',
                    textAlign: 'center',
                    letterSpacing: '8px',
                    color: T.ink,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  required
                />
              </div>

              {/* ── PIN field ── */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                  <label
                    style={{ fontFamily: '"Shippori Mincho", serif', fontSize: 13, fontWeight: 600, color: T.ink }}
                  >
                    暗証番号
                  </label>
                  <span
                    style={{ fontSize: 9, letterSpacing: '1.8em', textTransform: 'uppercase', color: T.ink2, fontWeight: 600 }}
                  >
                    PIN
                  </span>
                </div>

                {/* 4-cell PIN grid */}
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
                        fontSize: 30,
                        fontWeight: 600,
                        background: T.surf,
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
                {/* SR-only live region */}
                <div className="sr-only" aria-live="polite">
                  {pin.filter(Boolean).length}桁入力済み
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div
                  style={{
                    color: '#c0392b',
                    fontSize: 13,
                    marginBottom: 16,
                    lineHeight: 1.5,
                  }}
                >
                  {error}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading || pin.join('').length !== 4 || !riderNumber}
                style={{
                  width: '100%',
                  background: T.ink,
                  color: T.bg,
                  padding: '18px',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 600,
                  border: 'none',
                  cursor: isLoading || pin.join('').length !== 4 || !riderNumber ? 'not-allowed' : 'pointer',
                  opacity: isLoading || pin.join('').length !== 4 || !riderNumber ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  transition: 'opacity 0.15s',
                  letterSpacing: '0.02em',
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
                    ログイン中…
                  </>
                ) : (
                  <>
                    <CompassIcon size={16} color={T.bg} strokeWidth={1.6} />
                    出発　·　Roll out
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Link below card */}
        <div style={{ textAlign: 'center', marginTop: 22 }}>
          <span style={{ fontSize: 13, color: T.ink2, fontFamily: '"Shippori Mincho", serif' }}>
            まだ登録していませんか？
          </span>
          {'　'}
          <Link
            href="/register"
            style={{
              color: T.sea,
              fontWeight: 600,
              fontSize: 13,
              textDecoration: 'none',
              fontFamily: '"Shippori Mincho", serif',
            }}
          >
            参加登録 →
          </Link>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100svh', background: '#f5f3ed' }} />}>
      <LoginForm />
    </Suspense>
  )
}
