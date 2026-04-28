'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Medal,
  RefreshCw,
} from 'lucide-react'
import { CompassIcon, Eyebrow } from '@/components/anjin'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
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

// ─── Types ────────────────────────────────────────────────────────────────────
type ApiParticipant = {
  id: string
  rider_number: string
  rider_name: string
  motorcycle_make: string
  motorcycle_model: string
  started_at: string | null
  finished_at: string | null
  checkpoint_completions: { checkpoint_id: string; completed_at: string | null }[]
}

type Participant = {
  id: string
  riderNumber: string
  name: string
  bikeMake: string
  bikeModel: string
  completedCount: number
  totalCount: number
  lastActivity: string
  finishTime: string | null
}

const TOTAL_CHECKPOINTS = 6

function toParticipant(p: ApiParticipant): Participant {
  const completed = p.checkpoint_completions.filter(c => c.completed_at != null)
  const lastTs = completed
    .map(c => c.completed_at!)
    .sort()
    .at(-1)
  const lastActivity = lastTs
    ? new Date(lastTs).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
    : (p.started_at ? new Date(p.started_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '--:--')
  const finishTime = p.finished_at
    ? new Date(p.finished_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
    : null
  return {
    id: p.id,
    riderNumber: p.rider_number,
    name: p.rider_name,
    bikeMake: p.motorcycle_make,
    bikeModel: p.motorcycle_model,
    completedCount: completed.length,
    totalCount: TOTAL_CHECKPOINTS,
    lastActivity,
    finishTime,
  }
}

const CHECKPOINT_KANJI = ['壱', '弐', '参', '四', '五', '六']
const CHECKPOINT_LABELS = ['按針の碑', 'メモリアルパーク', '観音崎灯台', '三崎港', '城ヶ島', '按針の墓']

// ─── ManualCheckin ────────────────────────────────────────────────────────────
function ManualCheckin() {
  const [riderNumber, setRiderNumber] = useState('')
  const [cpOrder, setCpOrder] = useState('1')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/admin/checkpoints/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rider_number: riderNumber, checkpoint_order: Number(cpOrder) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStatus('success')
      setMessage(`ライダー #${riderNumber} のCP${cpOrder}を承認しました`)
      setRiderNumber('')
    } catch (err: unknown) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : '失敗しました')
    }
    setTimeout(() => setStatus('idle'), 3000)
  }

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.rule}`,
      borderRadius: 12,
      padding: 22,
    }}>
      <Eyebrow>手動押印  ·  Manual check-in</Eyebrow>
      <div style={{
        fontFamily: '"Cormorant Garamond", serif',
        fontStyle: 'italic',
        fontSize: 18,
        color: C.ink,
        marginTop: 6,
        marginBottom: 20,
      }}>
        Stamp a rider in by hand
      </div>

      <form onSubmit={handleSubmit}>
        {/* Rider number */}
        <div style={{ marginBottom: 18 }}>
          <Eyebrow className="mb-2">RIDER NUMBER</Eyebrow>
          <input
            type="text"
            value={riderNumber}
            onChange={e => setRiderNumber(e.target.value)}
            placeholder="042"
            required
            style={{
              width: '100%',
              padding: '12px 14px',
              background: C.surf,
              border: `1px solid ${C.rule}`,
              borderRadius: 8,
              fontSize: 18,
              fontFamily: '"JetBrains Mono", monospace',
              textAlign: 'center',
              letterSpacing: 6,
              color: C.ink,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Checkpoint selector */}
        <div style={{ marginBottom: 20 }}>
          <Eyebrow className="mb-2">CHECKPOINT</Eyebrow>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {CHECKPOINT_KANJI.map((kanji, i) => {
              const val = String(i + 1)
              const selected = cpOrder === val
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setCpOrder(val)}
                  style={{
                    padding: '12px 8px',
                    background: selected ? C.ink : C.surf,
                    color: selected ? C.bg : C.ink,
                    border: `1px solid ${selected ? C.ink : C.rule}`,
                    borderRadius: 8,
                    fontFamily: '"Shippori Mincho", serif',
                    fontSize: 18,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {kanji}
                </button>
              )
            })}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={status === 'loading'}
          style={{
            width: '100%',
            background: C.sea,
            color: '#fff',
            padding: 14,
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            border: 'none',
            cursor: status === 'loading' ? 'not-allowed' : 'pointer',
            opacity: status === 'loading' ? 0.7 : 1,
            letterSpacing: '0.06em',
          }}
        >
          {status === 'loading' ? '処理中...' : '承認する'}
        </button>

        {status !== 'idle' && status !== 'loading' && (
          <div style={{
            marginTop: 12,
            fontSize: 12,
            color: status === 'success' ? C.moss : C.cinnabar,
            textAlign: 'center',
          }}>
            {message}
          </div>
        )}
      </form>
    </div>
  )
}

// ─── GpsSettings ─────────────────────────────────────────────────────────────
function GpsSettings() {
  const [checkpoints, setCheckpoints] = useState<{ id: string; name: string; order_index: number; radius_meters: number }[]>([])
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(d => { if (d.checkpoints) setCheckpoints(d.checkpoints) })
      .catch(() => {})
  }, [])

  const handleRadiusChange = async (id: string, radius: number) => {
    setSaving(id)
    setCheckpoints(prev => prev.map(cp => cp.id === id ? { ...cp, radius_meters: radius } : cp))
    await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkpoint_id: id, radius_meters: radius }),
    }).catch(() => {})
    setSaving(null)
  }

  if (checkpoints.length === 0) return null

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.rule}`,
      borderRadius: 12,
      padding: 22,
    }}>
      <Eyebrow>判定半径  ·  GPS radius</Eyebrow>
      <div style={{
        fontFamily: '"Cormorant Garamond", serif',
        fontStyle: 'italic',
        fontSize: 18,
        color: C.ink,
        marginTop: 6,
        marginBottom: 20,
      }}>
        Per-checkpoint tuning
      </div>

      <div>
        {checkpoints.map((cp, i) => (
          <div
            key={cp.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 0',
              borderTop: i === 0 ? 'none' : `1px solid ${C.rule}`,
            }}
          >
            {/* Kanji */}
            <span style={{
              fontFamily: '"Shippori Mincho", serif',
              fontSize: 18,
              fontWeight: 600,
              color: C.sea,
              width: 22,
              flexShrink: 0,
            }}>
              {CHECKPOINT_KANJI[cp.order_index - 1] ?? cp.order_index}
            </span>

            {/* Name */}
            <span style={{
              fontFamily: '"Shippori Mincho", serif',
              fontSize: 13,
              color: C.ink,
              flex: 1,
            }}>
              {cp.name}
            </span>

            {/* Radius input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="number"
                min="20"
                max="500"
                value={cp.radius_meters}
                onChange={e => handleRadiusChange(cp.id, Number(e.target.value))}
                style={{
                  width: 60,
                  padding: '6px 8px',
                  background: C.surf,
                  border: `1px solid ${C.rule}`,
                  borderRadius: 6,
                  fontSize: 12,
                  fontFamily: '"JetBrains Mono", monospace',
                  textAlign: 'center',
                  color: C.ink,
                  outline: 'none',
                }}
              />
              <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: C.ink2 }}>m</span>
              {saving === cp.id && (
                <span style={{ fontSize: 10, color: C.moss }}>保存中</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── AdminPage ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date().toLocaleTimeString('ja-JP'))

  const loadParticipants = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/participants')
      const data = await res.json()
      if (data.participants) {
        setParticipants(data.participants.map(toParticipant))
      }
    } catch { /* silently ignore */ }
    setLastRefresh(new Date().toLocaleTimeString('ja-JP'))
    setLoading(false)
  }, [])

  useEffect(() => { loadParticipants() }, [loadParticipants])

  const totalParticipants = participants.length
  const completedAll = participants.filter(p => p.completedCount === TOTAL_CHECKPOINTS).length
  const inProgress = participants.filter(p => p.completedCount > 0 && p.completedCount < TOTAL_CHECKPOINTS).length
  const notStarted = participants.filter(p => p.completedCount === 0).length

  // Sort by completed count descending, then by finish time
  const ranked = [...participants].sort((a, b) => {
    if (b.completedCount !== a.completedCount) return b.completedCount - a.completedCount
    if (a.finishTime && b.finishTime) return a.finishTime.localeCompare(b.finishTime)
    if (a.finishTime) return -1
    if (b.finishTime) return 1
    return b.lastActivity.localeCompare(a.lastActivity)
  })

  const medalIcon = (rank: number) => {
    if (rank === 1) return <Medal className="w-4 h-4 text-yellow-500" />
    if (rank === 2) return <Medal className="w-4 h-4 text-gray-400" />
    if (rank === 3) return <Medal className="w-4 h-4 text-amber-600" />
    return <span style={{ fontSize: 11, color: C.ink2, fontWeight: 700, width: 16, textAlign: 'center', display: 'inline-block' }}>{rank}</span>
  }

  // Stats for the 4-col row
  const stats = [
    { en: 'TOTAL RIDERS', value: totalParticipants, jp: '参加者総数', color: C.ink },
    { en: 'FINISHED', value: completedAll, jp: '完走', color: C.moss },
    { en: 'RIDING', value: inProgress, jp: '走行中', color: C.sea },
    { en: 'NOT STARTED', value: notStarted, jp: '未出発', color: C.ink2 },
  ]

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'sans-serif' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Topbar ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: C.ink,
        color: C.bg,
        padding: '18px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: 'rgba(255,255,255,0.08) 1px solid',
      }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <CompassIcon size={24} color={C.bg} />
          <div>
            <div style={{
              fontFamily: '"Shippori Mincho", serif',
              fontSize: 14,
              fontWeight: 600,
              color: C.bg,
              lineHeight: 1.3,
            }}>
              三浦按針ラリー  ·  運営
            </div>
            <div style={{
              fontSize: 9,
              letterSpacing: '0.18em',
              opacity: 0.6,
              color: C.bg,
              lineHeight: 1.8,
              textTransform: 'uppercase',
            }}>
              RALLY HQ — ADMIN CONSOLE
            </div>
          </div>
        </div>

        {/* Right nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontSize: 10, color: C.bg, opacity: 0.5, letterSpacing: '0.1em' }}>
            {loading ? '更新中…' : `更新 ${lastRefresh}`}
          </span>
          <button
            onClick={loadParticipants}
            disabled={loading}
            style={{ background: 'none', border: 'none', color: C.bg, opacity: loading ? 0.4 : 0.8, cursor: 'pointer', padding: 0, display: 'flex' }}
            title="再読み込み"
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <Link
            href="/admin/participants"
            style={{
              color: C.bg,
              textDecoration: 'none',
              fontFamily: '"Shippori Mincho", serif',
              fontSize: 13,
            }}
          >
            参加者一覧
          </Link>
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' })
              window.location.href = '/login'
            }}
            style={{
              background: 'none',
              border: 'none',
              color: C.bg,
              opacity: 0.7,
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'sans-serif',
            }}
          >
            ログアウト
          </button>
        </div>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 1,
        background: C.rule,
        borderBottom: `1px solid ${C.rule}`,
      }}>
        {stats.map(s => (
          <div key={s.en} style={{ background: C.surf, padding: '20px 24px' }}>
            <div style={{
              fontSize: 10,
              letterSpacing: '0.18em',
              color: C.ink2,
              lineHeight: 1.8,
              textTransform: 'uppercase',
              marginBottom: 4,
            }}>
              {s.en}
            </div>
            <div style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: 32,
              fontWeight: 600,
              color: s.color,
              lineHeight: 1,
            }}>
              {s.value}
            </div>
            <div style={{ fontSize: 13, color: C.ink2, marginTop: 4 }}>{s.jp}</div>
          </div>
        ))}
      </div>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div style={{
        padding: 24,
        display: 'grid',
        gridTemplateColumns: '1.6fr 1fr',
        gap: 24,
        maxWidth: 1200,
        margin: '0 auto',
      }}>

        {/* LEFT: ManualCheckin */}
        <ManualCheckin />

        {/* RIGHT: GpsSettings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <GpsSettings />

          {/* Mini leaderboard */}
          <div style={{
            background: C.card,
            border: `1px solid ${C.rule}`,
            borderRadius: 12,
            padding: 22,
          }}>
            <Eyebrow>リーダーボード  ·  Leaderboard</Eyebrow>
            <div style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontStyle: 'italic',
              fontSize: 18,
              color: C.ink,
              marginTop: 6,
              marginBottom: 16,
            }}>
              Current standings
            </div>
            <div>
              {ranked.map((p, idx) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 0',
                    borderTop: idx === 0 ? 'none' : `1px solid ${C.rule}`,
                  }}
                >
                  <div style={{ width: 20, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                    {medalIcon(idx + 1)}
                  </div>
                  <span style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 11,
                    color: C.ink2,
                    background: C.surf,
                    padding: '2px 6px',
                    borderRadius: 4,
                    flexShrink: 0,
                  }}>
                    #{p.riderNumber}
                  </span>
                  <span style={{ fontSize: 13, color: C.ink, flex: 1 }}>{p.name}</span>
                  <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 2,
                          background: i < p.completedCount ? C.moss : C.rule,
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
