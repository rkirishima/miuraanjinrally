'use client'

import { useState, useEffect, useRef } from 'react'
import { REGISTRATION_OPEN_AT } from '@/lib/registration-config'
import Link from 'next/link'
import Image from 'next/image'
import {
  CompassIcon,
  Hanko,
  PaperGrain,
  Halftone,
  WoodblockWave,
  CompassRose,
  Eyebrow,
  EmergencyFooter,
} from '@/components/anjin'

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg: '#f5f3ed',
  surf: '#faf9f5',
  card: '#ffffff',
  ink: '#2a2925',
  ink2: '#6b6860',
  sea: '#5a8ba3',
  sea2: '#a8c5d6',
  moss: '#7da892',
  mossBg: '#e8f0e8',
  cinnabar: '#a85a3a',
  rule: 'rgba(42,41,37,0.10)',
}

// ─── Countdown Timer ──────────────────────────────────────────────────────────
const EVENT_DATE = new Date('2026-06-20T08:00:00+09:00')

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
    started: boolean
  } | null>(null)

  useEffect(() => {
    function calc() {
      const now = new Date()
      const diff = EVENT_DATE.getTime() - now.getTime()
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, started: true })
        return
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      setTimeLeft({ days, hours, minutes, seconds, started: false })
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [])

  if (!timeLeft) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 20 }}>
        {['--', '--', '--', '--'].map((v, i) => (
          <div
            key={i}
            style={{
              background: 'rgba(244,236,219,0.08)',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(244,236,219,0.16)',
              borderRadius: 6,
              padding: '10px 4px',
              textAlign: 'center',
            }}
          >
            <div className="font-display" style={{ fontSize: 32, color: '#f4ecdb', lineHeight: 1 }}>{v}</div>
            <div style={{ fontSize: 9, color: 'rgba(244,236,219,0.5)', marginTop: 4 }}>…</div>
          </div>
        ))}
      </div>
    )
  }

  if (timeLeft.started) {
    return (
      <div
        style={{
          marginTop: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          background: 'rgba(244,236,219,0.08)',
          border: '1px solid rgba(244,236,219,0.16)',
          borderRadius: 6,
          padding: '14px 20px',
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: T.moss,
            display: 'inline-block',
            animation: 'pulse 1.5s infinite',
          }}
        />
        <span className="font-jp" style={{ fontSize: 20, color: '#f4ecdb', fontWeight: 700 }}>
          開催中！
        </span>
      </div>
    )
  }

  const units = [
    { value: timeLeft.days,    jpLabel: '日',  enLabel: 'DAYS' },
    { value: timeLeft.hours,   jpLabel: '時',  enLabel: 'HRS'  },
    { value: timeLeft.minutes, jpLabel: '分',  enLabel: 'MIN'  },
    { value: timeLeft.seconds, jpLabel: '秒',  enLabel: 'SEC'  },
  ]

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
        {units.map(({ value, jpLabel, enLabel }) => (
          <div
            key={enLabel}
            style={{
              background: 'rgba(244,236,219,0.08)',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(244,236,219,0.16)',
              borderRadius: 6,
              padding: '10px 4px',
              textAlign: 'center',
            }}
          >
            <div
              className="font-display"
              style={{ fontSize: 32, color: '#f4ecdb', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}
            >
              {String(value).padStart(2, '0')}
            </div>
            <div style={{ fontSize: 9, color: 'rgba(244,236,219,0.55)', marginTop: 4, letterSpacing: '0.12em' }}>
              {jpLabel} / {enLabel}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  // ── Registration countdown ────────────────────────────────────────────────
  const [regOpen,   setRegOpen]   = useState(() => Date.now() >= REGISTRATION_OPEN_AT.getTime())
  const [countdown, setCountdown] = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (regOpen) return
    const tick = () => {
      const ms = REGISTRATION_OPEN_AT.getTime() - Date.now()
      if (ms <= 0) { setRegOpen(true); if (timerRef.current) clearInterval(timerRef.current); return }
      const d = Math.floor(ms / 86400000)
      const h = Math.floor((ms % 86400000) / 3600000)
      const m = Math.floor((ms % 3600000) / 60000)
      const s = Math.floor((ms % 60000) / 1000)
      setCountdown(`${d}日 ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`)
    }
    tick()
    timerRef.current = setInterval(tick, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [regOpen])

  // 壱=START(公開), 弐-五=シークレット, 六=GOAL(公開)
  const checkpoints = [
    { kanji: '壱', jp: 'FELICITY', en: 'START · 葉山', secret: false, isStart: true },
    { kanji: '弐', jp: 'シークレット', en: 'SECRET', secret: true },
    { kanji: '参', jp: 'シークレット', en: 'SECRET', secret: true },
    { kanji: '四', jp: 'シークレット', en: 'SECRET', secret: true },
    { kanji: '五', jp: 'シークレット', en: 'SECRET', secret: true },
    { kanji: '六', jp: '亀岡八幡宮', en: 'GOAL · 逗子', secret: false, isGoal: true },
  ]

  const steps: { num: string; jp: string; en: string; sub: string; link?: { text: string; href: string } }[] = [
    { num: '一', jp: '事前登録', en: 'Register your rider number & install the app on your phone', sub: '当日までにウェブ登録＆アプリをインストール' },
    { num: '二', jp: 'FELICITY発', en: 'Self-paced start from FELICITY in Hayama — any time you like', sub: '葉山のFELICITYを好きな時間にスタート', link: { text: 'FELICITY · MAP →', href: 'https://www.google.com/maps/search/FELICITY+葉山+ロイヤルエンフィールド' } },
    { num: '三', jp: 'クイズ制覇', en: 'Arrive at each checkpoint → answer the quiz → next stop unlocked', sub: '各地点に到着 → クイズ正解 → スタンプ押印 → 次の場所が開示' },
    { num: '四', jp: 'ゴール', en: 'Reach 亀岡八幡宮 — collect your free drink & cookie', sub: '亀岡八幡宮でフリードリンク＆クッキーをどうぞ 🍪' },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: '三浦按針ラリー2026',
    alternateName: 'MIURA ANJIN RALLY 2026',
    description:
      '三浦半島を舞台にした、歴史と冒険のバイクラリー。FELICITY × Royal Enfieldが贈るGPSスタンプラリー。6つのチェックポイントを制覇せよ。',
    startDate: '2026-06-20T08:00:00+09:00',
    endDate: '2026-06-21T18:00:00+09:00',
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: 'FELICITY',
      address: {
        '@type': 'PostalAddress',
        addressLocality: '葉山町',
        addressRegion: '神奈川県',
        addressCountry: 'JP',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: 'FELICITY × Royal Enfield',
      url: 'https://anjinrally.com',
    },
    url: 'https://anjinrally.com',
    image: 'https://anjinrally.com/images/og-image.jpg',
    isAccessibleForFree: true,
    inLanguage: 'ja',
  }

  return (
    <main style={{ background: T.bg, minHeight: '100vh', color: T.ink }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ══════════════════════════════════════════════════
          Section 1 — HERO
      ══════════════════════════════════════════════════ */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: '100svh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}
      >
        {/* Background photo */}
        <Image
          src="/images/cover.png"
          alt=""
          aria-hidden
          fill
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          priority
        />

        {/* Dark overlay gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to bottom, rgba(15,12,8,0.50) 0%, rgba(15,12,8,0.25) 25%, rgba(15,12,8,0.55) 65%, rgba(15,12,8,0.95) 100%)',
          }}
        />

        {/* WoodblockWave at bottom */}
        <WoodblockWave color="#f4ecdb" opacity={0.32} />

        {/* CompassRose watermark top-right */}
        <div style={{ position: 'absolute', top: 0, right: -40, pointerEvents: 'none' }}>
          <CompassRose size={300} color="#f4ecdb" opacity={0.22} />
        </div>

        {/* Vertical JP text left side */}
        <div
          style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            writingMode: 'vertical-rl',
            fontSize: 11,
            letterSpacing: '0.6em',
            opacity: 0.45,
            color: '#f4ecdb',
            fontFamily: '"Shippori Mincho", serif',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          第一回・按針記念走行会
        </div>

        {/* Top bar */}
        <div
          className="font-mono"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 20px',
            fontSize: 9,
            color: 'rgba(244,236,219,0.6)',
            letterSpacing: '0.08em',
          }}
        >
          <span>FELICITY  ×  ROYAL ENFIELD</span>
          <span>35.16°N · 139.62°E</span>
        </div>

        {/* Hero content */}
        <div style={{ position: 'relative', zIndex: 2, padding: '0 20px 44px', maxWidth: 480, margin: '0 auto', width: '100%' }}>
          {/* GPS label */}
          <div
            className="font-jp"
            style={{ fontSize: 11, letterSpacing: '0.45em', color: 'rgba(244,236,219,0.72)', marginBottom: 12 }}
          >
            GPS スタンプラリー
          </div>

          {/* Main lockup row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            {/* Big JP title */}
            <div>
              <div
                className="font-jp"
                style={{ fontSize: 72, fontWeight: 700, color: '#f4ecdb', lineHeight: 1.05 }}
              >
                三浦<br />按針<br />ラリー
              </div>
              {/* Italic subtitle */}
              <div
                className="font-display"
                style={{ fontSize: 15, fontStyle: 'italic', color: 'rgba(244,236,219,0.72)', marginTop: 10 }}
              >
                The Miura Anjin Rally · 二〇二六
              </div>
            </div>

            {/* Hanko floated right */}
            <div style={{ paddingTop: 8, flexShrink: 0 }}>
              <Hanko size={62} kanji="按" color="#d68a52" />
            </div>
          </div>

          {/* Countdown */}
          <CountdownTimer />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          Section 2 — Event details strip
      ══════════════════════════════════════════════════ */}
      <section style={{ background: T.surf, padding: '36px 20px' }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 1,
              background: T.rule,
              border: `1px solid ${T.rule}`,
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            {[
              { label: '開催日', value: 'June 20–21, 2026', sub: '土・日' },
              { label: '会場',   value: '三浦半島', sub: 'Miura Peninsula' },
              { label: '参加費', value: '¥0', sub: 'Free' },
              { label: '定員',   value: '100名', sub: '100 riders' },
            ].map(({ label, value, sub }) => (
              <div
                key={label}
                style={{
                  background: T.surf,
                  padding: '20px 16px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 9, letterSpacing: '0.25em', color: T.ink2, textTransform: 'uppercase', marginBottom: 6 }}>
                  {label}
                </div>
                <div
                  className="font-display"
                  style={{ fontSize: 18, color: T.ink, fontWeight: 600 }}
                >
                  {value}
                </div>
                <div style={{ fontSize: 10, color: T.ink2, marginTop: 3 }}>{sub}</div>
              </div>
            ))}
            {/* Full-width route time row */}
            <div
              style={{
                gridColumn: '1 / -1',
                background: T.surf,
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
            >
              <svg viewBox="0 0 20 20" width={15} height={15} fill="none" stroke={T.sea} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="10" cy="10" r="8"/>
                <path d="M10 5v5l3 3"/>
              </svg>
              <span className="font-jp" style={{ fontSize: 12, color: T.ink2 }}>
                ルート最短所要時間：<span style={{ color: T.ink, fontWeight: 600 }}>約 2 時間</span>
              </span>
              <span className="font-display" style={{ fontSize: 11, fontStyle: 'italic', color: T.ink2, opacity: 0.7 }}>
                · minimum ~2 hrs
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          Section 3 — Anjin story
      ══════════════════════════════════════════════════ */}
      <section style={{ background: T.bg, padding: '52px 20px', position: 'relative', overflow: 'hidden' }}>
        <PaperGrain opacity={0.12} />
        <div style={{ maxWidth: 480, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <Eyebrow className="mb-5">章 一  ·  The Story</Eyebrow>

          <h2
            className="font-jp"
            style={{ fontSize: 32, fontWeight: 700, color: T.ink, lineHeight: 1.4, marginBottom: 16, whiteSpace: 'pre-line' }}
          >
            {`按針が見た\n海岸線を、\n辿る一日。`}
          </h2>

          <p
            className="font-display"
            style={{ fontSize: 15, fontStyle: 'italic', color: T.ink2, marginBottom: 24, lineHeight: 1.6 }}
          >
            Following the navigator&apos;s coastline, on classic motorcycles.
          </p>

          <p
            className="font-jp"
            style={{ fontSize: 14, color: T.ink2, lineHeight: 1.85 }}
          >
            1600年、イギリス人航海士ウィリアム・アダムスは嵐の末に豊後（現・大分）へ漂着した。徳川家康に謁見したアダムスは、その知識と誠実さを買われ、幕府の外交顧問として仕えることになる。家康から三浦半島に領地を与えられた彼は「三浦按針」と名乗り、この半島を愛した。今日、私たちはバイクで彼の航路を辿る。
          </p>
        </div>

      </section>

      {/* Coastal photo — full-bleed between story and checkpoints */}
      <style>{`
        .coastal-photo { width: 100%; object-fit: cover; object-position: center 72%; display: block; height: 840px; }
        @media (max-width: 767px) { .coastal-photo { height: min(70vw, 420px); object-position: center 65%; } }
      `}</style>
      <div style={{ position: 'relative', overflow: 'hidden', lineHeight: 0 }}>
        <Image
          src="/images/hero-bus-stop.jpg"
          alt="三浦半島の海岸線を走るバイク"
          className="coastal-photo"
          width={1200}
          height={840}
          style={{ width: '100%', height: '100%' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(42,41,37,0.05) 0%, rgba(42,41,37,0.5) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 14, left: 22, right: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <span className="font-display" style={{ fontSize: 13, fontStyle: 'italic', color: 'rgba(244,236,219,0.92)' }}>
            三浦半島  ·  Miura Coastline
          </span>
          <span className="font-mono" style={{ fontSize: 9, color: 'rgba(244,236,219,0.6)', letterSpacing: '0.12em' }}>
            35.16°N · 139.62°E
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          Section 4 — Checkpoints preview
      ══════════════════════════════════════════════════ */}
      <section
        style={{
          background: T.surf,
          padding: '52px 20px',
          borderTop: `1px solid ${T.rule}`,
          borderBottom: `1px solid ${T.rule}`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <PaperGrain opacity={0.10} />
        <div style={{ maxWidth: 480, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
            <div>
              <Eyebrow className="mb-2">章 二  ·  Checkpoints</Eyebrow>
              <h2 className="font-jp" style={{ fontSize: 26, fontWeight: 700, color: T.ink }}>
                六つの宿場
              </h2>
            </div>
            <span
              className="font-display"
              style={{ fontSize: 15, fontStyle: 'italic', color: T.sea }}
            >
              6 stations
            </span>
          </div>

          <p style={{ fontSize: 13, color: T.ink2, lineHeight: 1.7, marginBottom: 28 }}>
            三浦半島に点在する六つの地点を巡り、歴史の痕跡を辿ってください。各地点で判子を押すとスタンプが記録されます。
          </p>

          {/* Checkpoint grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {checkpoints.map(({ kanji, jp, en, secret, isStart, isGoal }) => {
              const accentColor = isStart ? T.sea : isGoal ? T.cinnabar : T.ink2
              return (
                <div
                  key={kanji}
                  style={{
                    background: T.card,
                    border: `1px solid ${secret ? T.rule : isGoal ? `rgba(168,90,58,0.3)` : `rgba(90,139,163,0.3)`}`,
                    borderRadius: 12,
                    padding: '16px 6px 12px',
                    textAlign: 'center',
                    position: 'relative',
                  }}
                >
                  {/* START / GOAL badge */}
                  {(isStart || isGoal) && (
                    <div style={{
                      position: 'absolute', top: -1, left: -1, right: -1,
                      height: 3, borderRadius: '12px 12px 0 0',
                      background: isStart ? T.sea : T.cinnabar,
                    }} />
                  )}
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                    <Hanko size={52} kanji={kanji} color={accentColor} locked={secret} />
                  </div>
                  <div className="font-jp" style={{ fontSize: 12, fontWeight: 600, color: secret ? T.ink2 : T.ink, marginBottom: 2 }}>
                    {jp}
                  </div>
                  <div style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.ink2 }}>
                    {en}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Goal reward callout */}
          <div style={{
            marginTop: 20, padding: '14px 18px',
            background: `rgba(168,90,58,0.06)`,
            border: `1px solid rgba(168,90,58,0.2)`,
            borderRadius: 12,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 22 }}>🍪</span>
            <div>
              <div className="font-jp" style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>
                ゴール特典
              </div>
              <div className="font-jp" style={{ fontSize: 12, color: T.ink2, marginTop: 2, lineHeight: 1.5 }}>
                亀岡八幡宮ゴールでフリードリンク＆クッキーをご用意
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          Section 5 — チャロチャロ / India Fest at the Goal
      ══════════════════════════════════════════════════ */}
      <section style={{ background: '#1a1815', color: '#f4ecdb', overflow: 'hidden' }}>

        {/* ── Photo with overlay copy ── */}
        <div style={{ position: 'relative', height: 560, overflow: 'hidden' }}>
          <Image
            src="/images/riders-shrine.jpg"
            alt="亀岡八幡宮でヘルメットを持つライダーカップル"
            fill
            style={{ objectFit: 'cover', objectPosition: 'center 35%' }}
          />
          {/* Gradient: dark at top (eyebrow) + dark at bottom (headline) */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(26,24,21,0.55) 0%, rgba(26,24,21,0.05) 40%, rgba(26,24,21,0.05) 55%, rgba(26,24,21,0.88) 100%)' }} />

          {/* Top — eyebrow */}
          <div style={{ position: 'absolute', top: 24, left: 22 }}>
            <Eyebrow style={{ color: 'rgba(244,236,219,0.6)' }}>章 三  ·  The Finish  ·  亀岡八幡宮</Eyebrow>
          </div>

          {/* Bottom — "チャロチャロ！" only */}
          <div style={{ position: 'absolute', bottom: 28, left: 22, right: 22 }}>
            <div
              className="font-jp"
              style={{ fontSize: 58, fontWeight: 700, lineHeight: 1.0, color: '#f4ecdb', letterSpacing: '0.02em' }}
            >
              チャロ<br />チャロ！
            </div>
            <div
              className="font-display"
              style={{ fontSize: 13, fontStyle: 'italic', color: 'rgba(244,236,219,0.6)', marginTop: 8, letterSpacing: '0.1em' }}
            >
              Chalo Chalo — Let&apos;s go, let&apos;s go!
            </div>
          </div>
        </div>

        {/* ── Info below the photo ── */}
        <div style={{ padding: '36px 20px 52px', maxWidth: 480, margin: '0 auto' }}>

          {/* Description */}
          <p className="font-jp" style={{ fontSize: 14, lineHeight: 1.9, color: 'rgba(244,236,219,0.72)', marginBottom: 28 }}>
            ラリーのゴール・亀岡八幡宮では、<span style={{ color: '#f4ecdb', fontWeight: 600 }}>逗子インドフェス「チャロチャロ」</span>が同時開催。神社の境内で、スパイス料理・インド綿・音楽——完走の打ち上げにふさわしい非日常体験が待っています。
          </p>

          {/* 3 Feature tiles — woodblock SVG icons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {([
              {
                svg: (
                  <svg viewBox="0 0 30 34" width={30} height={30} fill="none" stroke="rgba(244,236,219,0.88)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
                    <defs><filter id="wb1"><feTurbulence baseFrequency="0.82" numOctaves="2" seed="5"/><feDisplacementMap in="SourceGraphic" scale="0.7"/></filter></defs>
                    <g filter="url(#wb1)">
                      {/* steam */}
                      <path d="M 10 9 Q 12 6 10 3"/>
                      <path d="M 15 8 Q 17 5 15 2"/>
                      <path d="M 20 9 Q 22 6 20 3"/>
                      {/* cup body */}
                      <path d="M 5 12 L 7 26 L 23 26 L 25 12 Z"/>
                      {/* handle */}
                      <path d="M 25 15 Q 30 15 30 19 Q 30 23 25 23"/>
                      {/* saucer */}
                      <path d="M 2 28 Q 15 31 28 28"/>
                    </g>
                  </svg>
                ),
                title: 'FELICITYキッチンカー',
                desc: '完走ライダーには会場でフリードリンク＆クッキーをご用意。',
              },
              {
                svg: (
                  <svg viewBox="0 0 38 26" width={36} height={30} fill="none" stroke="rgba(244,236,219,0.88)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
                    <defs><filter id="wb2"><feTurbulence baseFrequency="0.82" numOctaves="2" seed="8"/><feDisplacementMap in="SourceGraphic" scale="0.7"/></filter></defs>
                    <g filter="url(#wb2)">
                      {/* rear wheel */}
                      <circle cx="8" cy="18" r="6"/>
                      <circle cx="8" cy="18" r="2"/>
                      {/* front wheel */}
                      <circle cx="30" cy="18" r="6"/>
                      <circle cx="30" cy="18" r="2"/>
                      {/* frame spine */}
                      <path d="M 8 12 L 16 7 L 24 9 L 30 12"/>
                      {/* seat */}
                      <path d="M 10 12 L 19 9"/>
                      {/* engine block */}
                      <path d="M 15 12 L 15 18 L 21 18 L 21 12 Z"/>
                      {/* front fork */}
                      <path d="M 25 10 L 30 18"/>
                      {/* handlebar */}
                      <path d="M 24 9 L 26 6 L 29 7"/>
                    </g>
                  </svg>
                ),
                title: 'Royal Enfieldブース',
                desc: 'インドが生んだクラシックバイクの世界観をブースで体感。',
              },
              {
                svg: (
                  <svg viewBox="0 0 30 30" width={30} height={30} fill="none" stroke="rgba(244,236,219,0.88)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
                    <defs><filter id="wb3"><feTurbulence baseFrequency="0.82" numOctaves="2" seed="12"/><feDisplacementMap in="SourceGraphic" scale="0.7"/></filter></defs>
                    <g filter="url(#wb3)">
                      {/* center petal */}
                      <path d="M 15 22 Q 11 13 15 5 Q 19 13 15 22"/>
                      {/* left petal */}
                      <path d="M 15 22 Q 6 15 4 8 Q 11 11 15 22"/>
                      {/* right petal */}
                      <path d="M 15 22 Q 24 15 26 8 Q 19 11 15 22"/>
                      {/* outer left */}
                      <path d="M 15 22 Q 4 19 1 13 Q 8 14 15 22"/>
                      {/* outer right */}
                      <path d="M 15 22 Q 26 19 29 13 Q 22 14 15 22"/>
                      {/* water line */}
                      <path d="M 3 24 Q 15 27 27 24"/>
                      {/* stem */}
                      <path d="M 15 22 L 15 25"/>
                    </g>
                  </svg>
                ),
                title: 'インドカルチャー体験',
                desc: 'スパイス料理・インド綿・音楽。逗子フィルターのマサラカルチャー。',
              },
            ] as { svg: React.ReactNode; title: string; desc: string }[]).map(({ svg, title, desc }) => (
              <div key={title} style={{ display: 'flex', gap: 16, padding: '14px 16px', background: 'rgba(244,236,219,0.05)', border: '1px solid rgba(244,236,219,0.09)', borderRadius: 12, alignItems: 'flex-start' }}>
                <div style={{ flexShrink: 0, marginTop: 4 }}>{svg}</div>
                <div>
                  <div className="font-jp" style={{ fontSize: 13, fontWeight: 600, color: '#f4ecdb', marginBottom: 3 }}>{title}</div>
                  <div className="font-jp" style={{ fontSize: 12, color: 'rgba(244,236,219,0.55)', lineHeight: 1.65 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Event details */}
          <div style={{ borderTop: '1px solid rgba(244,236,219,0.1)', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.28em', color: 'rgba(244,236,219,0.35)', marginBottom: 4 }}>
              逗子インドフェス！チャロチャロ  ·  EVENT INFO
            </div>
            {[
              ['日時', '6/20（土）10:30〜20:00  /  6/21（日）10:30〜18:00'],
              ['場所', '亀岡八幡宮  ·  逗子市逗子5-2-13'],
              ['アクセス', 'JR逗子駅 / 京急逗子・葉山駅より徒歩3分'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
                <div style={{ fontSize: 9, letterSpacing: '0.1em', color: 'rgba(244,236,219,0.35)', flexShrink: 0, width: 40, fontFamily: '"JetBrains Mono", monospace' }}>{k}</div>
                <div className="font-jp" style={{ fontSize: 12, color: 'rgba(244,236,219,0.65)', lineHeight: 1.7 }}>{v}</div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ fontSize: 9, letterSpacing: '0.1em', color: 'rgba(244,236,219,0.35)', flexShrink: 0, width: 40, fontFamily: '"JetBrains Mono", monospace' }}>SNS</div>
              <a
                href="https://www.instagram.com/zushiindiafes_chalochalo?igsh=MWR0YnU0aTZ4aDB0ZQ%3D%3D&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  color: 'rgba(244,236,219,0.65)',
                  textDecoration: 'none',
                }}
              >
                {/* Instagram icon */}
                <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="rgba(244,236,219,0.55)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="0.5" fill="rgba(244,236,219,0.55)" stroke="none"/>
                </svg>
                <span className="font-jp" style={{ borderBottom: '1px solid rgba(244,236,219,0.2)' }}>
                  @zushiindiafes_chalochalo
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          Section 6 — How it works (章 四)
      ══════════════════════════════════════════════════ */}
      <section style={{ background: T.bg, padding: '52px 20px' }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <Eyebrow className="mb-2">章 四  ·  How it works</Eyebrow>
          <h2 className="font-jp" style={{ fontSize: 26, fontWeight: 700, color: T.ink, marginBottom: 32 }}>
            参加方法
          </h2>

          <div>
            {steps.map(({ num, jp, en, sub, link }, idx) => (
              <div
                key={num}
                style={{
                  borderTop: idx === 0 ? `1px solid ${T.rule}` : undefined,
                  borderBottom: `1px solid ${T.rule}`,
                  padding: '20px 0',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 20,
                }}
              >
                <div
                  className="font-jp"
                  style={{ fontSize: 34, color: T.sea, lineHeight: 1, flexShrink: 0, width: 36, paddingTop: 2 }}
                >
                  {num}
                </div>
                <div>
                  <div className="font-jp" style={{ fontSize: 18, fontWeight: 600, color: T.ink, marginBottom: 4 }}>
                    {jp}
                  </div>
                  <div className="font-jp" style={{ fontSize: 13, color: T.ink2, lineHeight: 1.65, marginBottom: 4 }}>
                    {sub}
                  </div>
                  {link && (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11,
                        color: T.sea,
                        textDecoration: 'none',
                        letterSpacing: '0.05em',
                        fontFamily: '"JetBrains Mono", monospace',
                        marginBottom: 4,
                      }}
                    >
                      <svg viewBox="0 0 16 16" width={12} height={12} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 2C5.24 2 3 4.24 3 7c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5z"/>
                        <circle cx="8" cy="7" r="1.5"/>
                      </svg>
                      {link.text}
                    </a>
                  )}
                  <div
                    className="font-display"
                    style={{ fontSize: 12, fontStyle: 'italic', color: T.ink2, opacity: 0.7 }}
                  >
                    {en}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          Section 6 — PWA Install guide
      ══════════════════════════════════════════════════ */}
      <section
        style={{
          background: T.surf,
          borderTop: `1px solid ${T.rule}`,
          borderBottom: `1px solid ${T.rule}`,
          padding: '52px 20px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <PaperGrain opacity={0.08} />
        <div style={{ maxWidth: 480, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <Eyebrow className="mb-2">章 五  ·  App Install</Eyebrow>
          <h2 className="font-jp" style={{ fontSize: 26, fontWeight: 700, color: T.ink, marginBottom: 8 }}>
            スマホにインストール
          </h2>
          <p style={{ fontSize: 13, color: T.ink2, lineHeight: 1.7, marginBottom: 28 }}>
            このラリーはスマートフォン専用のウェブアプリです。インストールするとGPSスタンプ・カメラが使えます。ホーム画面に追加しておくと当日スムーズです。
          </p>

          {/* iOS card */}
          <div
            style={{
              background: T.card,
              border: `1px solid ${T.rule}`,
              borderRadius: 14,
              padding: '20px 20px 18px',
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              {/* Apple icon */}
              <svg viewBox="0 0 24 24" width={22} height={22} fill={T.ink}>
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <div>
                <div className="font-jp" style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>iPhone · Safari</div>
                <div style={{ fontSize: 11, color: T.ink2, marginTop: 1 }}>iOS 16.4以上推奨</div>
              </div>
            </div>
            {[
              { n: '1', text: 'SafariでこのページのURLを開く' },
              { n: '2', text: '画面下の共有ボタン（□↑）をタップ' },
              { n: '3', text: '「ホーム画面に追加」を選ぶ' },
              { n: '4', text: '右上「追加」をタップして完了' },
            ].map(({ n, text }) => (
              <div
                key={n}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}
              >
                <div
                  style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: T.ink, color: T.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1,
                  }}
                >
                  {n}
                </div>
                <div style={{ fontSize: 13, color: T.ink, lineHeight: 1.55 }}>{text}</div>
              </div>
            ))}
            <div
              style={{
                marginTop: 4,
                padding: '8px 12px',
                background: 'rgba(90,139,163,0.08)',
                borderRadius: 8,
                fontSize: 11,
                color: T.sea,
                lineHeight: 1.5,
              }}
            >
              ⚠ ChromeではなくSafariで開いてください。GPS精度が上がります。
            </div>
          </div>

          {/* Android card */}
          <div
            style={{
              background: T.card,
              border: `1px solid ${T.rule}`,
              borderRadius: 14,
              padding: '20px 20px 18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              {/* Android/Chrome icon */}
              <svg viewBox="0 0 24 24" width={22} height={22} fill="none">
                <circle cx="12" cy="12" r="10" fill="#4285F4"/>
                <circle cx="12" cy="12" r="4.2" fill="white"/>
                <path d="M12 7.8 L21 12" stroke="#EA4335" strokeWidth="2.2" strokeLinecap="round"/>
                <path d="M12 7.8 L3 12" stroke="#FBBC05" strokeWidth="2.2" strokeLinecap="round"/>
                <path d="M12 16.2 L8 9.8" stroke="#34A853" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
              <div>
                <div className="font-jp" style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>Android · Chrome</div>
                <div style={{ fontSize: 11, color: T.ink2, marginTop: 1 }}>Android 9以上推奨</div>
              </div>
            </div>
            {[
              { n: '1', text: 'ChromeでこのページのURLを開く' },
              { n: '2', text: '右上のメニュー（⋮）をタップ' },
              { n: '3', text: '「ホーム画面に追加」または「アプリをインストール」を選ぶ' },
              { n: '4', text: '「追加」をタップして完了' },
            ].map(({ n, text }) => (
              <div
                key={n}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}
              >
                <div
                  style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: T.ink, color: T.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1,
                  }}
                >
                  {n}
                </div>
                <div style={{ fontSize: 13, color: T.ink, lineHeight: 1.55 }}>{text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          Section 7 — CTA
      ══════════════════════════════════════════════════ */}
      <section
        style={{
          background: T.ink,
          padding: '56px 20px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Hanko watermark */}
        <div
          style={{
            position: 'absolute',
            top: -20,
            right: -20,
            opacity: 0.12,
            pointerEvents: 'none',
          }}
        >
          <Hanko size={180} kanji="航" color="#f4ecdb" />
        </div>

        <div style={{ maxWidth: 480, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <h2
            className="font-jp"
            style={{
              fontSize: 32,
              fontWeight: 600,
              color: '#f4ecdb',
              lineHeight: 1.4,
              marginBottom: 14,
              whiteSpace: 'pre-line',
            }}
          >
            {`名簿に\n署名を。`}
          </h2>

          <p
            className="font-display"
            style={{ fontSize: 16, fontStyle: 'italic', color: 'rgba(244,236,219,0.7)', marginBottom: 32 }}
          >
            Sign the rider&apos;s ledger.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {regOpen ? (
              <Link
                href="/register"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  background: T.card,
                  color: T.ink,
                  borderRadius: 4,
                  padding: '15px 20px',
                  fontSize: 15,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textDecoration: 'none',
                  boxSizing: 'border-box',
                }}
                className="font-jp"
              >
                参加登録  ·  Register →
              </Link>
            ) : (
              /* Countdown CTA — registration not yet open */
              <div style={{
                width: '100%',
                background: 'rgba(244,236,219,0.08)',
                border: '1px solid rgba(244,236,219,0.2)',
                borderRadius: 4,
                padding: '14px 20px',
                boxSizing: 'border-box',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 9, letterSpacing: '0.22em', color: 'rgba(244,236,219,0.55)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Registration opens in
                </div>
                <div style={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontSize: 26,
                  fontWeight: 600,
                  color: '#f4ecdb',
                  letterSpacing: '0.04em',
                  lineHeight: 1,
                }}>
                  {countdown}
                </div>
                <div style={{ fontSize: 9, color: 'rgba(244,236,219,0.45)', marginTop: 6, letterSpacing: '0.1em' }}>
                  2026.05.01 · 00:00 JST · 先着順
                </div>
              </div>
            )}

            <Link
              href="/login"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                background: 'transparent',
                color: '#f4ecdb',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 4,
                padding: '15px 20px',
                fontSize: 14,
                fontWeight: 400,
                letterSpacing: '0.04em',
                textDecoration: 'none',
                boxSizing: 'border-box',
              }}
              className="font-jp"
            >
              ログイン  ·  Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          Section 8 — Sponsors
      ══════════════════════════════════════════════════ */}
      <section
        style={{
          background: T.bg,
          borderTop: `1px solid ${T.rule}`,
          padding: '44px 20px',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <Eyebrow className="mb-8" style={{ textAlign: 'center' }}>協賛  ·  Sponsors</Eyebrow>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28, flexWrap: 'wrap' }}>
            {/* FELICITY logo */}
            <Image
              src="/images/felicity-logo.svg"
              alt="FELICITY"
              width={120}
              height={96}
              style={{ height: 96, width: 'auto', display: 'block', opacity: 0.88 }}
            />
            <span style={{ width: 1, height: 28, background: T.rule, display: 'inline-block', flexShrink: 0 }} />
            {/* Royal Enfield SVG logo */}
            <Image
              src="/images/royalenfield-logo.svg"
              alt="Royal Enfield"
              width={160}
              height={20}
              style={{ height: 20, width: 'auto', display: 'block', opacity: 0.88 }}
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          Section 9 — Emergency footer
      ══════════════════════════════════════════════════ */}
      <EmergencyFooter />

    </main>
  )
}
