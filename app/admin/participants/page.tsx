'use client'
import { useState, useEffect, useMemo } from 'react'
import { RefreshCw, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CompassIcon, Eyebrow } from '@/components/anjin'
import Link from 'next/link'

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
type CheckpointCompletion = {
  checkpoint_id: string
  completed_at: string
}

type Participant = {
  id: string
  rider_number: string
  rider_name: string
  motorcycle_make: string | null
  motorcycle_model: string | null
  started_at: string | null
  finished_at: string | null
  created_at: string
  checkpoint_completions: CheckpointCompletion[]
}

const TOTAL_CHECKPOINTS = 6

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(iso: string | null): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function elapsedLabel(started: string | null, finished: string | null): string {
  if (!started) return '-'
  const end = finished ? new Date(finished) : new Date()
  const ms = end.getTime() - new Date(started).getTime()
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  return `${h}h ${String(m).padStart(2, '0')}m`
}

function exportCSV(participants: Participant[]) {
  const headers = [
    'ライダー番号', '氏名', 'メーカー', 'モデル',
    'スタート', 'フィニッシュ', '完了CP数', '登録日時',
  ]
  const rows = participants.map(p => [
    p.rider_number,
    p.rider_name,
    p.motorcycle_make ?? '',
    p.motorcycle_model ?? '',
    p.started_at ?? '',
    p.finished_at ?? '',
    String(p.checkpoint_completions.length),
    p.created_at,
  ])
  const csv =
    '\uFEFF' +
    [headers, ...rows]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `participants_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ p }: { p: Participant }) {
  const cpCount = p.checkpoint_completions.length
  if (p.finished_at || cpCount === TOTAL_CHECKPOINTS) {
    return (
      <span style={{
        padding: '4px 10px',
        borderRadius: 6,
        fontSize: 10,
        fontWeight: 600,
        background: C.mossBg,
        color: C.moss,
        whiteSpace: 'nowrap',
      }}>
        完走 · finished
      </span>
    )
  }
  if (p.started_at || cpCount > 0) {
    return (
      <span style={{
        padding: '4px 10px',
        borderRadius: 6,
        fontSize: 10,
        fontWeight: 600,
        background: C.sea2,
        color: C.sea,
        whiteSpace: 'nowrap',
      }}>
        走行中 · riding
      </span>
    )
  }
  return (
    <span style={{
      padding: '4px 10px',
      borderRadius: 6,
      fontSize: 10,
      fontWeight: 600,
      background: C.rule,
      color: C.ink2,
      whiteSpace: 'nowrap',
    }}>
      未出発 · idle
    </span>
  )
}

// ─── Stamp dots ───────────────────────────────────────────────────────────────
function StampDots({ count }: { count: number }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[...Array(TOTAL_CHECKPOINTS)].map((_, i) => (
        <div
          key={i}
          style={{
            width: 10,
            height: 10,
            borderRadius: 2,
            background: i < count ? C.moss : C.rule,
          }}
        />
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const loadParticipants = () => {
    fetch('/api/admin/participants')
      .then(r => r.json())
      .then(d => {
        if (d.participants) {
          setParticipants(d.participants)
          setLastUpdated(
            new Date().toLocaleTimeString('ja-JP', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
          )
        } else {
          setError(d.error ?? '取得に失敗しました')
        }
      })
      .catch(() => setError('取得に失敗しました'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadParticipants()

    // Supabase realtime: watch for new participants
    const supabase = createClient()
    const channel = supabase
      .channel('participants-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants' },
        () => { loadParticipants() }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return participants
    return participants.filter(
      p =>
        p.rider_name.toLowerCase().includes(q) ||
        p.rider_number.toLowerCase().includes(q) ||
        (p.motorcycle_make ?? '').toLowerCase().includes(q) ||
        (p.motorcycle_model ?? '').toLowerCase().includes(q)
    )
  }, [participants, search])

  // Derived stats
  const totalCount = participants.length
  const finishedCount = participants.filter(p => !!p.finished_at || p.checkpoint_completions.length === TOTAL_CHECKPOINTS).length
  const ridingCount = participants.filter(p => !p.finished_at && p.checkpoint_completions.length > 0).length
  const idleCount = participants.filter(p => !p.started_at && p.checkpoint_completions.length === 0).length

  const summaryStats = [
    { en: 'TOTAL RIDERS', value: totalCount,   jp: '参加者総数', color: C.ink },
    { en: 'FINISHED',     value: finishedCount, jp: '完走',      color: C.moss },
    { en: 'RIDING',       value: ridingCount,   jp: '走行中',    color: C.sea },
    { en: 'NOT STARTED',  value: idleCount,     jp: '未出発',    color: C.ink2 },
  ]

  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (p: Participant) => {
    if (!confirm(`「${p.rider_name}（${p.rider_number}）」を削除しますか？\nこの操作は取り消せません。`)) return
    setDeletingId(p.id)
    try {
      const res = await fetch(`/api/admin/participants/${p.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '削除に失敗しました')
      loadParticipants()
    } catch (err) {
      alert(err instanceof Error ? err.message : '削除に失敗しました')
    } finally {
      setDeletingId(null)
    }
  }

  const COLS = [
    { label: 'NO.',     width: 60 },
    { label: 'RIDER',   width: 'auto' as const },
    { label: 'BIKE',    width: 140 },
    { label: 'CC',      width: 60 },
    { label: 'STAMPS',  width: 90 },
    { label: 'ELAPSED', width: 90 },
    { label: 'STATUS',  width: 120 },
    { label: '',        width: 44 },
  ]

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>

      {/* ── Topbar ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: C.ink,
        color: C.bg,
        padding: '18px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
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
              lineHeight: 1.8,
              textTransform: 'uppercase',
            }}>
              RALLY HQ — ADMIN CONSOLE
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link
            href="/admin"
            style={{ color: C.bg, textDecoration: 'none', fontFamily: '"Shippori Mincho", serif', fontSize: 13 }}
          >
            ダッシュボード
          </Link>
          <button
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

      {/* ── Page body ──────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '32px 24px' }}>

        {/* Header row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}>
          {/* Left */}
          <div>
            <Eyebrow>参加者管理  ·  Participants</Eyebrow>
            <div style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontStyle: 'italic',
              fontSize: 28,
              color: C.ink,
              marginTop: 4,
              lineHeight: 1.1,
            }}>
              Live riders
            </div>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Realtime indicator */}
            {lastUpdated && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: C.moss,
                  animation: 'pulse 2s infinite',
                }} />
                <span style={{ fontSize: 11, color: C.ink2, fontFamily: '"JetBrains Mono", monospace' }}>
                  Realtime  ·  最終更新 {lastUpdated}
                </span>
              </div>
            )}

            {/* Refresh button */}
            <button
              onClick={() => { setLoading(true); loadParticipants() }}
              title="手動更新"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                background: C.card,
                border: `1px solid ${C.rule}`,
                borderRadius: 8,
                color: C.ink2,
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              <RefreshCw size={14} />
            </button>

            {/* CSV export */}
            <button
              onClick={() => exportCSV(filtered)}
              disabled={loading || filtered.length === 0}
              style={{
                padding: '8px 16px',
                background: C.moss,
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: loading || filtered.length === 0 ? 'not-allowed' : 'pointer',
                opacity: loading || filtered.length === 0 ? 0.4 : 1,
              }}
            >
              CSV エクスポート
            </button>
          </div>
        </div>

        {/* Stats summary */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 24,
        }}>
          {summaryStats.map(s => (
            <div key={s.en} style={{
              background: C.surf,
              border: `1px solid ${C.rule}`,
              borderRadius: 12,
              padding: '16px 20px',
            }}>
              <div style={{
                fontSize: 10,
                letterSpacing: '0.18em',
                color: C.ink2,
                textTransform: 'uppercase',
                marginBottom: 4,
              }}>
                {s.en}
              </div>
              <div style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: 28,
                fontWeight: 600,
                color: s.color,
                lineHeight: 1,
              }}>
                {s.value}
              </div>
              <div style={{ fontSize: 12, color: C.ink2, marginTop: 4 }}>{s.jp}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <input
            type="search"
            placeholder="ライダー番号・氏名・バイクで検索..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              maxWidth: 360,
              padding: '10px 14px',
              background: C.card,
              border: `1px solid ${C.rule}`,
              borderRadius: 8,
              fontSize: 13,
              color: C.ink,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '64px 0', color: C.ink2, fontSize: 14 }}>
            読み込み中...
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: '#fff5f5',
            border: '1px solid #fca5a5',
            borderRadius: 10,
            padding: '12px 16px',
            color: C.cinnabar,
            fontSize: 13,
            marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        {/* Table card */}
        {!loading && !error && (
          <div style={{
            background: C.card,
            border: `1px solid ${C.rule}`,
            borderRadius: 12,
            overflow: 'hidden',
          }}>
            {/* Column header */}
            <div style={{
              background: C.surf,
              padding: '10px 22px',
              display: 'grid',
              gridTemplateColumns: `${COLS.map(c => c.width === 'auto' ? '1fr' : `${c.width}px`).join(' ')}`,
              gap: 12,
              alignItems: 'center',
            }}>
              {COLS.map(col => (
                <div key={col.label} style={{
                  fontSize: 9,
                  letterSpacing: '1.8px',
                  color: C.ink2,
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}>
                  {col.label}
                </div>
              ))}
            </div>

            {/* Data rows */}
            {filtered.length === 0 ? (
              <div style={{ padding: '48px 22px', textAlign: 'center', color: C.ink2, fontSize: 14 }}>
                {search ? '該当する参加者が見つかりません' : '参加者がいません'}
              </div>
            ) : (
              filtered.map((p, idx) => {
                const cpCount = p.checkpoint_completions.length
                const bike = [p.motorcycle_make, p.motorcycle_model].filter(Boolean).join(' ') || '-'

                return (
                  <div
                    key={p.id}
                    style={{
                      padding: '14px 22px',
                      display: 'grid',
                      gridTemplateColumns: `${COLS.map(c => c.width === 'auto' ? '1fr' : `${c.width}px`).join(' ')}`,
                      gap: 12,
                      alignItems: 'center',
                      borderTop: idx === 0 ? 'none' : `1px solid ${C.rule}`,
                    }}
                  >
                    {/* NO. */}
                    <div style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontWeight: 600,
                      fontSize: 13,
                      color: C.ink,
                    }}>
                      {p.rider_number}
                    </div>

                    {/* RIDER */}
                    <div style={{ fontSize: 13, color: C.ink, fontWeight: 500 }}>
                      {p.rider_name}
                    </div>

                    {/* BIKE */}
                    <div style={{ fontSize: 12, color: C.ink2 }}>
                      {bike}
                    </div>

                    {/* CC — placeholder, show displacement if available */}
                    <div style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 11,
                      color: C.ink2,
                    }}>
                      —
                    </div>

                    {/* STAMPS */}
                    <StampDots count={cpCount} />

                    {/* ELAPSED */}
                    <div style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 12,
                      color: C.ink2,
                    }}>
                      {elapsedLabel(p.started_at, p.finished_at)}
                    </div>

                    {/* STATUS */}
                    <StatusBadge p={p} />

                    {/* DELETE */}
                    <button
                      onClick={() => handleDelete(p)}
                      disabled={deletingId === p.id}
                      title="削除"
                      style={{
                        background: 'none',
                        border: `1px solid ${C.rule}`,
                        borderRadius: 6,
                        padding: '5px 7px',
                        cursor: deletingId === p.id ? 'not-allowed' : 'pointer',
                        color: C.cinnabar,
                        opacity: deletingId === p.id ? 0.4 : 0.6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = deletingId === p.id ? '0.4' : '0.6')}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
