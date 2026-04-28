'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Navigation } from 'lucide-react'
import { formatDistance } from '@/lib/utils'
import type { CheckpointWithStatus, CheckpointStatus, Participant } from '@/types/database'
import {
  CompassIcon,
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
  emergencyDark: '#3a2a25',
  emergencyText: '#f4dcd0',
}

// ─── Kanji for each checkpoint order_index ────────────────────────────────────
const KANJI = ['壱', '弐', '参', '四', '五', '六']

// ─── Fallback checkpoint data matching actual seeds ──────────────────────────
// isAlwaysVisible: START と GOAL は常に名前を表示。CP2〜5はクリア後に解放。
const CHECKPOINT_NAMES = [
  { id: 1, nameJa: 'FELICITY', nameEn: 'Felicity · START', area: '葉山町', isAlwaysVisible: true },
  { id: 2, nameJa: '三笠公園', nameEn: 'Mikasa Park', area: '横須賀市', isAlwaysVisible: false },
  { id: 3, nameJa: '荒崎公園', nameEn: 'Arasaki Park', area: '横須賀市', isAlwaysVisible: false },
  { id: 4, nameJa: '立石公園', nameEn: 'Tateishi Park', area: '横須賀市', isAlwaysVisible: false },
  { id: 5, nameJa: '逗子マリーナ', nameEn: 'Zushi Marina', area: '逗子市', isAlwaysVisible: false },
  { id: 6, nameJa: '亀岡八幡宮', nameEn: 'Kameoka Hachiman · GOAL', area: '逗子市', isAlwaysVisible: true },
]

const FALLBACK_LATITUDES = [35.267359, 35.2813, 35.1380, 35.2475, 35.3017, 35.2955]
const FALLBACK_LONGITUDES = [139.610321, 139.6717, 139.6008, 139.5683, 139.5747, 139.5833]

function buildFallbackCheckpoints(): CheckpointWithStatus[] {
  return CHECKPOINT_NAMES.map((cp, i) => ({
    id: cp.id,
    name: cp.nameJa,
    description: null,
    hint: '',
    latitude: FALLBACK_LATITUDES[i],
    longitude: FALLBACK_LONGITUDES[i],
    radius_meters: 100,
    quiz_question: '',
    quiz_answer: '',
    quiz_answer_aliases: null,
    quiz_choices: null,
    mission_description: '',
    order_index: i + 1,
    is_active: true,
    created_at: '',
    status: (i === 0 ? 'unlocked' : 'locked') as CheckpointStatus,
  }))
}

// ─── Elapsed timer hook ───────────────────────────────────────────────────────
function useElapsed(startedAt: string | null | undefined) {
  const [elapsed, setElapsed] = useState('—')
  useEffect(() => {
    if (!startedAt) return
    const start = new Date(startedAt).getTime()
    function tick() {
      const diffMs = Date.now() - start
      const h = Math.floor(diffMs / 3600000)
      const m = Math.floor((diffMs % 3600000) / 60000)
      const s = Math.floor((diffMs % 60000) / 1000)
      setElapsed(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startedAt])
  return elapsed
}

export default function DashboardPage() {
  const [checkpoints, setCheckpoints] = useState<CheckpointWithStatus[]>([])
  const [participant, setParticipant] = useState<Omit<Participant, 'pin_hash'> | null>(null)
  const [gpsActive, setGpsActive] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)
  const [leaderboard, setLeaderboard] = useState<Array<{
    riderNumber: string
    riderName: string
    motorcycleMake: string | null
    completedCount: number
    wrongCount: number
    score: number
    finishedAt: string | null
  }>>([])
  const [leaderboardOpen, setLeaderboardOpen] = useState(false)

  const fetchCheckpoints = useCallback(async (lat?: number, lon?: number) => {
    try {
      const url =
        lat != null && lon != null
          ? `/api/checkpoints?lat=${lat}&lon=${lon}`
          : '/api/checkpoints'
      const res = await fetch(url)
      if (!res.ok) throw new Error(`checkpoints fetch failed: ${res.status}`)
      const data = await res.json()
      setCheckpoints(data.checkpoints || [])
      setApiError(null)
    } catch {
      setApiError('Supabase未設定のためデモモードで表示中')
      setCheckpoints(buildFallbackCheckpoints())
    }
  }, [])

  const fetchParticipant = useCallback(async () => {
    try {
      const res = await fetch('/api/participants/me')
      if (!res.ok) return
      const data = await res.json()
      setParticipant(data.participant ?? null)
    } catch {
      // Silently fail — header shows fallback text
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchParticipant(), fetchCheckpoints()]).finally(() => setLoading(false))

    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(d => { if (d.leaderboard) setLeaderboard(d.leaderboard) })
      .catch(() => {})

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsActive(true)
          const lat = pos.coords.latitude
          const lon = pos.coords.longitude
          fetchCheckpoints(lat, lon)
        },
        () => setGpsError('GPS信号を取得できません'),
        { enableHighAccuracy: true }
      )
    } else {
      setGpsError('このデバイスはGPSに対応していません')
    }
  }, [fetchCheckpoints, fetchParticipant])

  const completedCount = checkpoints.filter((c) => c.status === 'completed').length
  const totalCount = checkpoints.length || 6

  const elapsed = useElapsed((participant as (Omit<Participant, 'pin_hash'> & { started_at?: string }) | null)?.started_at)

  const isAccessible = (status: CheckpointStatus) =>
    status === 'unlocked' || status === 'in_progress' || status === 'completed'

  // ロック状態かつ非公開CPは名前を隠す
  const isRevealed = (cp: CheckpointWithStatus) => {
    const fallback = CHECKPOINT_NAMES.find((f) => f.id === cp.id)
    if (fallback?.isAlwaysVisible) return true          // START / GOAL は常に表示
    return cp.status !== 'locked'                        // 解錠・進行中・完了なら表示
  }

  const displayName = (cp: CheckpointWithStatus) => {
    if (!isRevealed(cp)) return 'シークレット'
    const fallback = CHECKPOINT_NAMES.find((f) => f.id === cp.id)
    return fallback?.nameJa ?? cp.name
  }

  const displayNameEn = (cp: CheckpointWithStatus) => {
    if (!isRevealed(cp)) return 'SECRET'
    const fallback = CHECKPOINT_NAMES.find((f) => f.id === cp.id)
    return fallback?.nameEn ?? ''
  }

  const displayArea = (cp: CheckpointWithStatus) => {
    if (!isRevealed(cp)) return ''
    const fallback = CHECKPOINT_NAMES.find((f) => f.id === cp.id)
    return fallback?.area ?? ''
  }

  const getKanji = (cp: CheckpointWithStatus) => KANJI[(cp.order_index ?? 1) - 1] ?? '壱'

  const getHankoColor = (status: CheckpointStatus) => {
    if (status === 'completed') return T.moss
    if (status === 'unlocked' || status === 'in_progress') return T.cinnabar
    return T.ink2
  }

  const dotColor = (status: CheckpointStatus) => {
    if (status === 'completed') return T.moss
    if (status === 'unlocked' || status === 'in_progress') return T.cinnabar
    return T.rule
  }

  // Derive completed timestamp if available
  const getCompletedTime = (cp: CheckpointWithStatus): string | null => {
    const raw = cp as CheckpointWithStatus & { completed_at?: string }
    if (!raw.completed_at) return null
    const d = new Date(raw.completed_at)
    return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: T.ink,
          color: T.bg,
          padding: '72px 20px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CompassIcon size={22} color={T.bg} strokeWidth={1.4} />
          <div>
            <div
              style={{
                fontFamily: '"Shippori Mincho", serif',
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: '0.04em',
                lineHeight: 1.2,
              }}
            >
              三浦按針ラリー
            </div>
            {!loading && (
              <div
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 9,
                  opacity: 0.6,
                  marginTop: 2,
                  letterSpacing: '0.08em',
                }}
              >
                #{participant?.rider_number ?? '---'}  {participant?.rider_name ?? 'RIDER'}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Admin link — only visible to admins */}
          {participant?.is_admin && (
            <Link
              href="/admin"
              style={{
                color: T.bg,
                opacity: 0.85,
                fontSize: 12,
                textDecoration: 'none',
                fontFamily: '"Shippori Mincho", serif',
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <svg viewBox="0 0 20 20" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="10" cy="7" r="3" />
                <path d="M3 17c0-3.3 3.1-6 7-6s7 2.7 7 6" />
              </svg>
              運営
            </Link>
          )}
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' })
              window.location.href = '/login'
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: T.bg,
              opacity: 0.7,
              fontSize: 12,
              cursor: 'pointer',
              padding: '4px 0',
            }}
          >
            ログアウト
          </button>
        </div>
      </div>

      {/* ── Progress bar section ────────────────────────────────────────────── */}
      <div
        style={{
          background: T.surf,
          borderBottom: `1px solid ${T.rule}`,
          padding: '24px 20px 20px',
        }}
      >
        {/* Top row: progress + elapsed */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <Eyebrow>進行状況  ·  Progress</Eyebrow>
            <div style={{ marginTop: 4, display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span
                style={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontSize: 36,
                  fontWeight: 600,
                  color: T.ink,
                  lineHeight: 1,
                }}
              >
                {completedCount}
              </span>
              <span
                style={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontSize: 24,
                  color: T.ink2,
                  lineHeight: 1,
                }}
              >
                / 6
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Eyebrow>経過  ·  Elapsed</Eyebrow>
            <div
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 22,
                color: T.sea,
                marginTop: 4,
                lineHeight: 1,
              }}
            >
              {elapsed}
            </div>
          </div>
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 4 }}>
          {(checkpoints.length > 0 ? checkpoints : buildFallbackCheckpoints()).map((cp) => (
            <div
              key={cp.id}
              style={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                background: dotColor(cp.status),
                transition: 'background 0.4s ease',
              }}
            />
          ))}
        </div>

        {/* All complete CTA */}
        {!loading && completedCount >= 6 && (
          <Link
            href="/complete"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 16,
              background: T.ink,
              color: T.bg,
              padding: '14px 20px',
              borderRadius: 12,
              fontFamily: '"Shippori Mincho", serif',
              fontSize: 15,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            完走！結果を見る →
          </Link>
        )}
      </div>

      {/* ── Route list section ──────────────────────────────────────────────── */}
      <div style={{ padding: '28px 20px 20px', position: 'relative', overflow: 'hidden' }}>
        <TopoLines color={T.ink} opacity={0.05} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Eyebrow>道程  ·  The route</Eyebrow>

          {/* Vertical dashed line */}
          <div
            style={{
              position: 'absolute',
              left: 35,
              top: 30,
              bottom: 30,
              width: 0,
              borderLeft: `1.5px dashed ${T.rule}`,
              zIndex: 0,
            }}
          />

          <div style={{ marginTop: 16, position: 'relative', zIndex: 1 }}>
            {(loading ? buildFallbackCheckpoints() : checkpoints).map((cp) => {
              const status = cp.status
              const accessible = isAccessible(status)
              const kanji = getKanji(cp)
              const jpName = displayName(cp)
              const enName = displayNameEn(cp)
              const completedTime = getCompletedTime(cp)
              const isUnlocked = status === 'unlocked' || status === 'in_progress'
              const isCompleted = status === 'completed'
              const isLocked = status === 'locked'

              const cardStyle: React.CSSProperties = {
                flex: 1,
                borderRadius: 14,
                padding: '14px 16px',
                position: 'relative',
                overflow: 'hidden',
                opacity: isLocked ? 0.55 : 1,
                border: isUnlocked
                  ? `1.5px solid ${T.cinnabar}`
                  : isCompleted
                  ? `1px solid ${T.moss}40`
                  : `1px solid ${T.rule}`,
                background: isUnlocked ? T.card : T.surf,
                boxShadow: isUnlocked ? '0 4px 24px rgba(168,90,58,0.10)' : 'none',
              }

              return (
                <div
                  key={cp.id}
                  style={{ marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 16 }}
                >
                  {/* Hanko */}
                  <Hanko
                    size={70}
                    kanji={kanji}
                    color={getHankoColor(status)}
                    locked={isLocked}
                    completed={isCompleted}
                  />

                  {/* Card */}
                  {accessible ? (
                    <Link href={`/checkpoint/${cp.id}`} style={{ flex: 1, textDecoration: 'none' }}>
                      <div style={cardStyle}>
                        {/* Cinnabar accent bar for unlocked */}
                        {isUnlocked && (
                          <div
                            style={{
                              position: 'absolute',
                              top: -1,
                              left: -1,
                              right: -1,
                              height: 3,
                              background: T.cinnabar,
                              borderRadius: '14px 14px 0 0',
                            }}
                          />
                        )}
                        {/* Name row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div
                              style={{
                                fontFamily: '"Shippori Mincho", serif',
                                fontSize: 16,
                                fontWeight: 600,
                                color: T.ink,
                                lineHeight: 1.2,
                              }}
                            >
                              {jpName}
                            </div>
                            <div
                              style={{
                                fontSize: 10,
                                letterSpacing: '0.12em',
                                color: T.ink2,
                                marginTop: 3,
                              }}
                            >
                              {enName}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            {isCompleted && completedTime && (
                              <div
                                style={{
                                  fontFamily: '"JetBrains Mono", monospace',
                                  fontSize: 12,
                                  color: T.moss,
                                }}
                              >
                                {completedTime}
                              </div>
                            )}
                            {isUnlocked && cp.distance != null && (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  color: T.sea,
                                  fontSize: 12,
                                }}
                              >
                                <Navigation size={12} strokeWidth={1.6} />
                                {formatDistance(cp.distance)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Completed badge */}
                        {isCompleted && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              marginTop: 8,
                              color: T.moss,
                              fontSize: 11,
                              letterSpacing: '0.06em',
                            }}
                          >
                            <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke={T.moss} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="4 12 10 18 20 6" />
                            </svg>
                            制覇  ·  Stamped
                          </div>
                        )}

                        {/* Google Maps button for unlocked */}
                        {isUnlocked && (
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${cp.latitude},${cp.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 8,
                              marginTop: 12,
                              width: '100%',
                              background: T.sea,
                              color: '#fff',
                              padding: '11px 0',
                              borderRadius: 8,
                              fontSize: 13,
                              fontWeight: 600,
                              textDecoration: 'none',
                              boxSizing: 'border-box',
                            }}
                          >
                            <Navigation size={14} strokeWidth={1.6} />
                            ルート案内  ·  Navigate
                          </a>
                        )}
                      </div>
                    </Link>
                  ) : (
                    <div style={cardStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontFamily: isRevealed(cp) ? '"Shippori Mincho", serif' : '"JetBrains Mono", monospace',
                              fontSize: isRevealed(cp) ? 16 : 13,
                              fontWeight: 600,
                              color: T.ink2,
                              lineHeight: 1.2,
                              letterSpacing: isRevealed(cp) ? 'normal' : '0.18em',
                            }}
                          >
                            {jpName}
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              color: T.ink2,
                              marginTop: 3,
                              letterSpacing: '0.14em',
                              opacity: 0.6,
                            }}
                          >
                            {enName}
                          </div>
                          {!isRevealed(cp) && (
                            <div
                              style={{
                                marginTop: 6,
                                fontSize: 10,
                                color: T.ink2,
                                opacity: 0.5,
                                fontFamily: '"Cormorant Garamond", serif',
                                fontStyle: 'italic',
                              }}
                            >
                              前のクイズに正解すると解放されます
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Leaderboard section ─────────────────────────────────────────────── */}
      {leaderboard.length > 0 && (
        <div
          style={{
            background: T.surf,
            borderTop: `1px solid ${T.rule}`,
            margin: '8px 0',
            padding: '20px',
          }}
        >
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: leaderboardOpen ? 16 : 0 }}>
            <Eyebrow>順位  ·  Leaderboard</Eyebrow>
            <button
              onClick={() => setLeaderboardOpen(o => !o)}
              style={{
                background: 'none',
                border: 'none',
                color: T.sea,
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: '"JetBrains Mono", monospace',
                padding: 0,
              }}
            >
              Top 20 {leaderboardOpen ? '▴' : '▾'}
            </button>
          </div>

          {leaderboardOpen && (
            <div>
              {leaderboard.slice(0, 20).map((rider, idx) => {
                const isCurrentUser = rider.riderNumber === participant?.rider_number
                const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null
                return (
                  <div
                    key={rider.riderNumber}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 0',
                      borderTop: `1px solid ${T.rule}`,
                    }}
                  >
                    <div style={{ width: 22, textAlign: 'center', fontSize: 14 }}>
                      {medal ?? (
                        <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: T.ink2 }}>
                          {idx + 1}
                        </span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: isCurrentUser ? 700 : 400,
                          fontSize: 14,
                          color: T.ink,
                          lineHeight: 1.2,
                        }}
                      >
                        {rider.riderName}
                      </div>
                      {rider.wrongCount > 0 && (
                        <div style={{ fontSize: 10, color: T.cinnabar, fontFamily: '"JetBrains Mono", monospace', marginTop: 1 }}>
                          -{rider.wrongCount * 10}pt
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div
                        style={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 14,
                          fontWeight: 700,
                          color: rider.score > 0 ? T.ink : T.ink2,
                        }}
                      >
                        {rider.score}
                        <span style={{ fontSize: 9, fontWeight: 400, color: T.ink2, marginLeft: 2 }}>pt</span>
                      </div>
                      <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, color: T.ink2, marginTop: 1 }}>
                        #{rider.riderNumber}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Emergency footer ────────────────────────────────────────────────── */}
      <EmergencyFooter />
    </div>
  )
}
