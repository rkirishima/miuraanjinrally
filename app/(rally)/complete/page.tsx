'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Hanko,
  TopoLines,
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

const KANJI = ['壱', '弐', '参', '四', '五', '六']

const STOPS = [
  { n: 1, nameJa: 'FELICITY',      nameEn: 'Felicity' },
  { n: 2, nameJa: '三笠公園',       nameEn: 'Mikasa Park' },
  { n: 3, nameJa: '燈明堂',         nameEn: 'Tōmyōdō' },
  { n: 4, nameJa: 'ソレイユの丘',   nameEn: 'Soleil Hill' },
  { n: 5, nameJa: '秋谷の立石',     nameEn: 'Akinoya Tateishi' },
  { n: 6, nameJa: '亀岡八幡宮',     nameEn: 'Kameoka Hachiman' },
]

type CompletionData = {
  riderName: string
  riderNumber: string
  startedAt: string | null
  finishedAt: string | null
  completedCount: number
  rank?: number | null
  stopTimes: Record<number, string>  // order_index → HH:MM
}

function formatDuration(startIso: string, endIso: string): string {
  const diff = new Date(endIso).getTime() - new Date(startIso).getTime()
  const totalMinutes = Math.floor(diff / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const secs = Math.floor((diff % 60000) / 1000)
  if (hours > 0) return `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(secs).padStart(2,'0')}`
  return `${String(minutes).padStart(2,'0')}:${String(secs).padStart(2,'0')}`
}

// ─── Corner ornament SVG ─────────────────────────────────────────────────────
function CornerL({ rotate = 0 }: { rotate?: number }) {
  return (
    <svg
      viewBox="0 0 10 10"
      width={10}
      height={10}
      fill="none"
      stroke={T.ink}
      strokeWidth={1}
      style={{
        position: 'absolute',
        transform: `rotate(${rotate}deg)`,
        ...(rotate === 0 ? { top: 8, left: 8 } :
           rotate === 90 ? { top: 8, right: 8 } :
           rotate === 180 ? { bottom: 8, right: 8 } :
           { bottom: 8, left: 8 }),
      }}
    >
      <polyline points="0,8 0,0 8,0" />
    </svg>
  )
}

export default function CompletePage() {
  const [data, setData] = useState<CompletionData | null>(null)
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/participants/me').then(r => r.json()),
      fetch('/api/checkpoints').then(r => r.json()),
    ])
      .then(([me, cps]) => {
        if (!me.participant) return
        // Build checkpoint_id → order_index map
        const orderMap: Record<string, number> = {}
        if (Array.isArray(cps.checkpoints)) {
          for (const cp of cps.checkpoints) {
            orderMap[cp.id] = cp.order_index
          }
        }
        // Build stopTimes: order_index → "HH:MM"
        const stopTimes: Record<number, string> = {}
        if (Array.isArray(me.completions)) {
          for (const c of me.completions) {
            if (c.completed_at && orderMap[c.checkpoint_id]) {
              stopTimes[orderMap[c.checkpoint_id]] = new Date(c.completed_at)
                .toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
            }
          }
        }
        setData({
          riderName: me.participant.rider_name,
          riderNumber: me.participant.rider_number,
          startedAt: me.participant.started_at,
          finishedAt: me.participant.finished_at,
          completedCount: Array.isArray(me.completions)
            ? me.completions.filter((c: { completed_at: string | null }) => c.completed_at).length
            : 0,
          rank: me.participant.rank ?? null,
          stopTimes,
        })
      })
      .catch(() => {})
  }, [])

  const handleShare = async () => {
    const text = `🏍️ MIURA ANJIN RALLY 2026 完走しました！\n三浦半島の6チェックポイントを制覇！\nライダー #${data?.riderNumber ?? ''} ${data?.riderName ?? ''}\n#三浦按針ラリー #MiuraAnjinRally`
    if (navigator.share) {
      setSharing(true)
      try {
        await navigator.share({ title: '三浦按針ラリー 完走！', text })
      } catch (_) {}
      setSharing(false)
    } else {
      await navigator.clipboard.writeText(text).catch(() => {})
      alert('シェアテキストをコピーしました！')
    }
  }

  const durationStr = data?.startedAt && data?.finishedAt
    ? formatDuration(data.startedAt, data.finishedAt)
    : '—'

  const stopTimes: Record<number, string> = data?.stopTimes ?? {}

  return (
    <div style={{ minHeight: '100vh', background: T.bg }}>
      {/* ── Hero section ────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '72px 24px 36px',
          background: `linear-gradient(180deg, ${T.surf} 0%, ${T.bg} 100%)`,
          overflow: 'hidden',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <TopoLines color={T.ink} opacity={0.08} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              fontSize: 10,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              fontWeight: 600,
              color: T.sea,
            }}
          >
            完走証  ·  Certificate of completion
          </div>

          {/* Animated Hanko */}
          <div
            className="animate-stamp-in"
            style={{
              display: 'inline-block',
              marginTop: 24,
            }}
          >
            <Hanko size={120} kanji="完" color={T.cinnabar} />
          </div>

          {/* Heading */}
          <div
            style={{
              fontFamily: '"Shippori Mincho", serif',
              fontSize: 38,
              fontWeight: 700,
              color: T.ink,
              lineHeight: 1.1,
              marginTop: 24,
            }}
          >
            制覇。
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontStyle: 'italic',
              fontSize: 18,
              color: T.ink2,
              marginTop: 8,
            }}
          >
            You finished the rally.
          </div>
        </div>
      </div>

      {/* ── Certificate card ─────────────────────────────────────────────────── */}
      <div
        style={{
          margin: '0 22px 24px',
          background: T.card,
          border: `1.5px solid ${T.ink}`,
          borderRadius: 6,
          padding: '28px 24px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Corner ornaments */}
        <CornerL rotate={0} />
        <CornerL rotate={90} />
        <CornerL rotate={180} />
        <CornerL rotate={270} />

        {/* Presented to */}
        <div
          style={{
            fontSize: 9,
            letterSpacing: '0.32em',
            color: T.ink2,
            textAlign: 'center',
            textTransform: 'uppercase',
          }}
        >
          Presented To
        </div>

        {/* Rider name */}
        <div
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontStyle: 'italic',
            fontSize: 32,
            fontWeight: 500,
            color: T.ink,
            textAlign: 'center',
            marginTop: 10,
            lineHeight: 1.1,
          }}
        >
          {data?.riderName ?? '——'}
        </div>

        {/* Rider number + JP */}
        <div
          style={{
            fontFamily: '"Shippori Mincho", serif',
            fontSize: 14,
            color: T.ink2,
            textAlign: 'center',
            marginTop: 4,
          }}
        >
          ライダー #{data?.riderNumber ?? '---'}
        </div>

        {/* Thin rule */}
        <div
          style={{
            width: 60,
            height: 1,
            background: T.ink,
            margin: '20px auto',
            opacity: 0.4,
          }}
        />

        {/* Certificate text */}
        <div
          style={{
            fontFamily: '"Shippori Mincho", serif',
            fontSize: 14,
            color: T.ink2,
            lineHeight: 1.8,
            textAlign: 'center',
          }}
        >
          2026年6月20〜21日<br />
          三浦按針ラリーの全6チェックポイントを<br />
          制覇したことをここに証明します。
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            borderTop: `1px solid ${T.rule}`,
            borderBottom: `1px solid ${T.rule}`,
            marginTop: 24,
            padding: '18px 0',
            textAlign: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.25em', color: T.ink2, textTransform: 'uppercase' }}>Stops</div>
            <div
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: 24,
                fontWeight: 600,
                color: T.ink,
                marginTop: 4,
              }}
            >
              6 / 6
            </div>
          </div>
          <div style={{ borderLeft: `1px solid ${T.rule}`, borderRight: `1px solid ${T.rule}` }}>
            <div style={{ fontSize: 9, letterSpacing: '0.25em', color: T.ink2, textTransform: 'uppercase' }}>Time</div>
            <div
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 18,
                color: T.sea,
                marginTop: 4,
              }}
            >
              {durationStr}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.25em', color: T.ink2, textTransform: 'uppercase' }}>Rank</div>
            <div
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: 24,
                fontWeight: 600,
                color: T.ink,
                marginTop: 4,
              }}
            >
              {data?.rank ? `#${data.rank}` : '—'}
            </div>
          </div>
        </div>

        {/* Issuer line */}
        <div
          style={{
            fontFamily: '"Shippori Mincho", serif',
            fontSize: 11,
            color: T.ink2,
            textAlign: 'right',
            marginTop: 16,
          }}
        >
          発行  ·  FELICITY × ROYAL ENFIELD
        </div>
      </div>

      {/* ── Stops list ───────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 22px 24px' }}>
        <Eyebrow>道程  ·  Stops cleared</Eyebrow>

        <div
          style={{
            marginTop: 12,
            background: T.card,
            borderRadius: 14,
            border: `1px solid ${T.rule}`,
            overflow: 'hidden',
          }}
        >
          {STOPS.map((stop, idx) => {
            const kanji = KANJI[idx]
            const time = stopTimes[stop.n]
            return (
              <div
                key={stop.n}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  gap: 12,
                  borderTop: idx === 0 ? 'none' : `1px solid ${T.rule}`,
                }}
              >
                <Hanko size={36} kanji={kanji} color={T.moss} completed />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: '"Shippori Mincho", serif',
                      fontSize: 14,
                      fontWeight: 600,
                      color: T.ink,
                    }}
                  >
                    {stop.nameJa}
                  </div>
                  <div style={{ fontSize: 10, color: T.ink2, marginTop: 2 }}>{stop.nameEn}</div>
                </div>
                {time && (
                  <div
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 13,
                      color: T.moss,
                      flexShrink: 0,
                    }}
                  >
                    {time}
                  </div>
                )}
                <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke={T.moss} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polyline points="4 12 10 18 20 6" />
                </svg>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Action buttons ───────────────────────────────────────────────────── */}
      <div style={{ padding: '0 22px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Primary: Share */}
        <button
          onClick={handleShare}
          disabled={sharing}
          style={{
            width: '100%',
            background: T.ink,
            color: T.bg,
            border: 'none',
            borderRadius: 12,
            padding: '16px 0',
            fontFamily: '"Shippori Mincho", serif',
            fontSize: 15,
            fontWeight: 600,
            cursor: sharing ? 'not-allowed' : 'pointer',
            opacity: sharing ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke={T.bg} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          {sharing ? 'シェア中…' : 'シェアする  ·  Share your ride →'}
        </button>

        {/* Secondary: Download PDF (placeholder) */}
        <button
          onClick={() => alert('PDF生成機能は近日公開予定です。')}
          style={{
            width: '100%',
            background: 'transparent',
            color: T.ink2,
            border: `1px solid ${T.rule}`,
            borderRadius: 12,
            padding: '16px 0',
            fontFamily: '"Shippori Mincho", serif',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          証明書をダウンロード  ·  Download PDF
        </button>

        {/* Back to dashboard */}
        <Link
          href="/dashboard"
          style={{
            display: 'block',
            textAlign: 'center',
            color: T.ink2,
            textDecoration: 'none',
            fontSize: 13,
            padding: '8px 0',
            fontFamily: '"Shippori Mincho", serif',
          }}
        >
          ダッシュボードへ戻る
        </Link>
      </div>

      {/* ── Emergency footer ────────────────────────────────────────────────── */}
      <EmergencyFooter />
    </div>
  )
}
