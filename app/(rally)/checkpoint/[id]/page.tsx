'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Camera, RefreshCw } from 'lucide-react'
import { calculateDistance, getCurrentPosition, type GeolocationResult } from '@/lib/gps'
import { formatDistance } from '@/lib/utils'
import {
  Hanko,
  Eyebrow,
  EmergencyFooter,
} from '@/components/anjin'
import { getCheckpointMeta } from '@/lib/checkpoint-meta'

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
  cinnabarLight: '#f2e8e3',
  rule: 'rgba(42,41,37,0.10)',
  wrong: '#c0392b',
  wrongLight: '#fdf0ef',
}

const KANJI = ['壱', '弐', '参', '四', '五', '六']
const STATION_EN = ['01', '02', '03', '04', '05', '06']
const CHOICE_LABELS = ['A', 'B', 'C', 'D']

// ─── Image compression ───────────────────────────────────────────────────────
async function compressImage(file: File, maxWidthPx = 1200, quality = 0.82): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxWidthPx / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
        },
        'image/jpeg',
        quality
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

// ─── Types ───────────────────────────────────────────────────────────────────
type CheckpointData = {
  id: number
  number: number
  nameJa: string
  nameEn: string
  area: string
  description: string
  hint: string
  quizQuestion: string
  quizAnswer: string
  quizChoices: string[]   // 4 choices, correct one included
  missionDescription: string
  lat: number
  lon: number
  radiusMeters: number
  photoUrl?: string | null
}

const CHECKPOINT_FALLBACKS: Record<number, CheckpointData> = {
  1: {
    id: 1, number: 1, nameJa: 'FELICITY', nameEn: 'Felicity', area: '葉山町',
    description: '三浦半島ツーリングの出発点。按針が愛したこの地に、伝説のバイク屋があった。',
    hint: 'Felicityが入っているこの建物、かつては複数の顔を持っていた。',
    quizQuestion: 'フェリシティが入っているこの建物、カフェになる前は何だった？',
    quizAnswer: '全部正解',
    quizChoices: ['街の電気屋さん', '伝説のバイクショップ', 'サーフボード工房', '全部正解'],
    missionDescription: 'お店の前にバイクを停めて撮影',
    photoUrl: '/images/felicityexterior.png',
    lat: 35.267359, lon: 139.610321, radiusMeters: 50,
  },
  2: {
    id: 2, number: 2, nameJa: '三笠公園', nameEn: 'Mikasa Park', area: '横須賀市',
    description: '横須賀に眠る伝説の戦艦。按針が生きた時代から300年後、この船は日本の運命を変えた。',
    hint: '1905年に起きた、日露戦争の決定的な海戦。',
    quizQuestion: '戦艦三笠が勝利を飾った大海戦の名称は？',
    quizAnswer: '日本海海戦',
    quizChoices: ['日本海海戦', 'レイテ沖海戦', '沖縄海戦', 'ミッドウェー海戦'],
    missionDescription: '戦艦三笠とバイクを撮影',
    photoUrl: '/images/checkpoints/cp02-mikasa.png',
    lat: 35.2813, lon: 139.6717, radiusMeters: 100,
  },
  3: {
    id: 3, number: 3, nameJa: 'ジハングンオブジェ', nameEn: 'Jihanggun Yokosuka', area: '横須賀市',
    description: 'ヨコスカの新名所。林立する自販機が生み出す、唯一無二のストリートアート。',
    hint: '「ジハングン」は、これが大量に集まった空間の略称。',
    quizQuestion: '「#ジハングン ヨコスカ」——「ジハングン」とは何の略？',
    quizAnswer: '自販機群',
    quizChoices: ['自販機群', '自転車軍', '時半訓', '地番群'],
    missionDescription: 'ジハングンオブジェとバイクを撮影',
    photoUrl: '/images/checkpoints/cp05-jihanggun.png',
    lat: 35.2813, lon: 139.6717, radiusMeters: 100,
  },
  4: {
    id: 4, number: 4, nameJa: '立石公園', nameEn: 'Tateishi Park', area: '横須賀市',
    description: '相模湾に突き出る奇岩と、その向こうに連なる富士の稜線。北斎も愛したこの国の美しさが凝縮されている。',
    hint: '北斎の「富嶽三十六景」、実際には三十六枚以上描かれた。',
    quizQuestion: '北斎の「富嶽三十六景」、実際に収録された作品は何枚？',
    quizAnswer: '46枚',
    quizChoices: ['36枚', '46枚', '56枚', '72枚'],
    missionDescription: '立石（岩）とバイクを撮影',
    photoUrl: '/images/checkpoints/cp04-tateishi.png',
    lat: 35.2475, lon: 139.5683, radiusMeters: 100,
  },
  5: {
    id: 5, number: 5, nameJa: '逗子マリーナ', nameEn: 'Zushi Marina', area: '逗子市',
    description: '湘南の海に面した風光明媚なマリーナ。按針もかつて見た相模湾を、白いヨットが彩る。',
    hint: '「リビエラ逗子マリーナ」の「リビエラ」が示す地中海沿岸の地名。',
    quizQuestion: '「リビエラ逗子マリーナ」の「リビエラ」は、どこの地名に由来するか？',
    quizAnswer: '南フランス・イタリアの地中海沿岸',
    quizChoices: ['南フランス・イタリアの地中海沿岸', 'スペインのバルセロナ海岸', 'ギリシャのエーゲ海沿岸', 'ポルトガルのアルガルヴェ'],
    missionDescription: 'マリーナとバイクを撮影',
    photoUrl: '/images/checkpoints/cp06-zushi-marina.png',
    lat: 35.3017, lon: 139.5747, radiusMeters: 100,
  },
  6: {
    id: 6, number: 6, nameJa: '亀岡八幡宮', nameEn: 'Kameoka Hachiman', area: '逗子市',
    description: '航海の無事を祈る古社。按針の長い旅はここで完結する。フリードリンクとクッキーで乾杯を。',
    hint: '八幡宮に祀られる「八幡神」と同一視される天皇。',
    quizQuestion: '八幡宮に祀られる「八幡神」と同一視される天皇は誰か？',
    quizAnswer: '応神天皇',
    quizChoices: ['応神天皇', '神武天皇', '崇神天皇', '仁徳天皇'],
    missionDescription: '神社の鳥居とバイクを撮影',
    photoUrl: '/images/亀岡八幡宮.png',
    lat: 35.2955, lon: 139.5833, radiusMeters: 80,
  },
}

type Stage = 'approaching' | 'at-location' | 'quiz' | 'quiz-passed' | 'photo' | 'completed'
type QuizState = 'idle' | 'answering' | 'wrong' | 'stamping' | 'stamped'

function mapApiCheckpoint(raw: Record<string, unknown>, id: number): CheckpointData {
  const fallback = CHECKPOINT_FALLBACKS[id] ?? CHECKPOINT_FALLBACKS[1]
  const choices = (raw.quiz_choices as string[] | null) ?? fallback.quizChoices
  return {
    id: (raw.id as number) ?? id,
    number: (raw.order_index as number) ?? fallback.number,
    nameJa: (raw.name as string) ?? fallback.nameJa,
    nameEn: fallback.nameEn,
    area: fallback.area,
    description: (raw.description as string) ?? fallback.description,
    hint: (raw.hint as string) ?? fallback.hint,
    quizQuestion: (raw.quiz_question as string) ?? fallback.quizQuestion,
    quizAnswer: (raw.quiz_answer as string) ?? fallback.quizAnswer,
    quizChoices: choices,
    missionDescription: (raw.mission_description as string) ?? fallback.missionDescription,
    lat: (raw.latitude as number) ?? fallback.lat,
    lon: (raw.longitude as number) ?? fallback.lon,
    radiusMeters: (raw.radius_meters as number) ?? fallback.radiusMeters,
    photoUrl: (raw.photo_url as string | null) ?? getCheckpointMeta(id)?.photoUrl ?? fallback.photoUrl ?? null,
  }
}

// ─── ArrowLeft SVG ────────────────────────────────────────────────────────────
function ArrowLeft() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke={T.ink} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

// ─── Ink spread SVG (expanding rings on stamp impact) ────────────────────────
function InkSpread({ active }: { active: boolean }) {
  if (!active) return null
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        width: 200,
        height: 200,
      }}
    >
      {/* Ring 1 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: `3px solid ${T.cinnabar}`,
          animation: 'ink-ring 1.2s ease-out forwards',
        }}
      />
      {/* Ring 2 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: `1.5px solid ${T.cinnabar}`,
          opacity: 0.5,
          animation: 'ink-ring 1.2s 0.15s ease-out forwards',
        }}
      />
      {/* Ring 3 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: `1px solid ${T.cinnabar}`,
          opacity: 0.3,
          animation: 'ink-ring 1.2s 0.3s ease-out forwards',
        }}
      />
    </div>
  )
}

// ─── Stamp Overlay ────────────────────────────────────────────────────────────
function StampOverlay({
  visible,
  kanji,
  nextCheckpoint,
  onDone,
}: {
  visible: boolean
  kanji: string
  nextCheckpoint?: { nameJa: string; nameEn: string; kanji: string } | null
  onDone: () => void
}) {
  const [phase, setPhase] = useState<'dropping' | 'impact' | 'reveal'>('dropping')
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!visible) {
      setPhase('dropping')
      return
    }
    // Phase 1: stamp drops (600ms animation)
    // Phase 2: impact + ink spread at 700ms
    timerRef.current = setTimeout(() => setPhase('impact'), 700)
    // Phase 3: reveal correct text at 1200ms
    const t2 = setTimeout(() => setPhase('reveal'), 1200)
    // Done: close at 3000ms
    const t3 = setTimeout(() => onDone(), 3200)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [visible, onDone])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(42,41,37,0.92)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
      }}
    >
      {/* Stamp drop */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 200,
          height: 200,
        }}
      >
        <div
          style={{
            animation: 'stamp-drop 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards',
          }}
        >
          <Hanko size={160} kanji={kanji} color={T.cinnabar} />
        </div>
        {/* Ink spread rings */}
        <InkSpread active={phase === 'impact' || phase === 'reveal'} />
      </div>

      {/* Correct text */}
      <div
        style={{
          marginTop: 32,
          textAlign: 'center',
          opacity: phase === 'reveal' ? 1 : 0,
          transform: phase === 'reveal' ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}
      >
        <div
          style={{
            fontFamily: '"Shippori Mincho", serif',
            fontSize: 42,
            fontWeight: 700,
            color: T.cinnabar,
            letterSpacing: '0.06em',
            lineHeight: 1,
          }}
        >
          正解
        </div>
        <div
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontStyle: 'italic',
            fontSize: 16,
            color: 'rgba(244,236,219,0.7)',
            marginTop: 6,
            letterSpacing: '0.1em',
          }}
        >
          Correct · Well done
        </div>
      </div>

      {/* Next checkpoint reveal */}
      {nextCheckpoint && phase === 'reveal' && (
        <div
          style={{
            marginTop: 28,
            background: 'rgba(244,236,219,0.08)',
            border: '1px solid rgba(244,236,219,0.18)',
            borderRadius: 14,
            padding: '14px 24px',
            textAlign: 'center',
            opacity: phase === 'reveal' ? 1 : 0,
            transition: 'opacity 0.6s 0.3s ease',
          }}
        >
          <div
            style={{
              fontSize: 9,
              letterSpacing: '0.3em',
              color: 'rgba(244,236,219,0.5)',
              marginBottom: 8,
            }}
          >
            次の目的地が解锁されました
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
            <Hanko size={40} kanji={nextCheckpoint.kanji} color={T.cinnabar} />
            <div style={{ textAlign: 'left' }}>
              <div
                style={{
                  fontFamily: '"Shippori Mincho", serif',
                  fontSize: 18,
                  fontWeight: 600,
                  color: '#f4ecdb',
                }}
              >
                {nextCheckpoint.nameJa}
              </div>
              <div
                style={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontStyle: 'italic',
                  fontSize: 13,
                  color: 'rgba(244,236,219,0.6)',
                  marginTop: 2,
                }}
              >
                {nextCheckpoint.nameEn}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CheckpointPage({ params }: { params: { id: string } }) {
  const cpId = parseInt(params.id, 10)

  const [checkpoint, setCheckpoint] = useState<CheckpointData>(
    CHECKPOINT_FALLBACKS[cpId] ?? CHECKPOINT_FALLBACKS[1]
  )
  const [apiError, setApiError] = useState<string | null>(null)
  const [stage, setStage] = useState<Stage>('approaching')
  const [stageReady, setStageReady] = useState(false)  // true once DB status loaded
  const [position, setPosition] = useState<GeolocationResult | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [quizState, setQuizState] = useState<QuizState>('idle')
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const [shuffledChoices, setShuffledChoices] = useState<string[]>([])
  const [quizAttempts, setQuizAttempts] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isUpdatingGps, setIsUpdatingGps] = useState(false)
  const [isArriving, setIsArriving] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const stageRef = useRef(stage)
  stageRef.current = stage

  // Shuffle choices once checkpoint is loaded
  useEffect(() => {
    const choices = [...checkpoint.quizChoices]
    // Fisher-Yates shuffle
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[choices[i], choices[j]] = [choices[j], choices[i]]
    }
    setShuffledChoices(choices)
  }, [checkpoint.quizChoices])

  // ── On mount: restore stage from DB (handles refresh mid-rally) ──────────
  useEffect(() => {
    async function initStage() {
      try {
        const res = await fetch('/api/participants/me')
        if (!res.ok) return
        const data = await res.json()
        const completions: Array<{
          checkpoint_id: number
          arrived_at: string | null
          quiz_passed_at: string | null
          completed_at: string | null
        }> = data.completions ?? []
        const mine = completions.find((c) => c.checkpoint_id === cpId)
        if (mine?.completed_at) {
          setStage('completed')
        } else if (mine?.quiz_passed_at) {
          setStage('quiz-passed')
        } else if (mine?.arrived_at) {
          setStage('quiz')
        }
      } catch {
        // ignore — default stage = 'approaching' is safe
      } finally {
        setStageReady(true)
      }
    }
    initStage()
  }, [cpId])

  // Fetch real checkpoint data from API
  useEffect(() => {
    async function fetchCheckpoint() {
      try {
        const res = await fetch('/api/checkpoints')
        if (!res.ok) throw new Error(`fetch failed: ${res.status}`)
        const data = await res.json()
        const list: Record<string, unknown>[] = data.checkpoints ?? []
        const found = list.find((c) => (c.id as number) === cpId)
        if (found) {
          const checkpointData = mapApiCheckpoint(found, cpId)
          setCheckpoint(checkpointData)
          setApiError(null)
          try {
            localStorage.setItem(`checkpoint_${cpId}`, JSON.stringify(checkpointData))
          } catch { /* ignore */ }
        }
      } catch {
        try {
          const cached = localStorage.getItem(`checkpoint_${cpId}`)
          if (cached) {
            setCheckpoint(JSON.parse(cached) as CheckpointData)
            setApiError('オフラインモードで表示中')
          } else {
            setApiError('デモモードで表示中')
          }
        } catch {
          setApiError('デモモードで表示中')
        }
      }
    }
    fetchCheckpoint()
  }, [cpId])

  /**
   * Record GPS arrival. Returns:
   *   'quiz'        → proceed to quiz
   *   'quiz-passed' → already completed, skip to that stage
   *   'error'       → arrival failed, show error and stay
   */
  const recordArrival = useCallback(async (lat?: number, lon?: number): Promise<'quiz' | 'quiz-passed' | 'error'> => {
    setIsArriving(true)
    try {
      const res = await fetch(`/api/checkpoints/${cpId}/arrive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lon }),
      })
      const data = await res.json() as { success?: boolean; already_completed?: boolean; error?: string }
      if (!res.ok) {
        setGpsError(data.error ?? 'サーバーへの接続に失敗しました')
        return 'error'
      }
      if (data.already_completed) return 'quiz-passed'
      return 'quiz'
    } catch {
      setGpsError('サーバーへの接続に失敗しました。Wi-Fiまたは通信状況を確認してください。')
      return 'error'
    } finally {
      setIsArriving(false)
    }
  }, [cpId])

  const updatePosition = useCallback(async () => {
    setIsUpdatingGps(true)
    setGpsError(null)
    try {
      const pos = await getCurrentPosition()
      setPosition(pos)
      const dist = calculateDistance(pos.lat, pos.lon, checkpoint.lat, checkpoint.lon)
      setDistance(dist)
      if (dist <= checkpoint.radiusMeters && stageRef.current === 'approaching') {
        setStage('at-location')
      }
    } catch {
      setGpsError('GPS信号を取得できません。位置情報の許可を確認してください。')
    } finally {
      setIsUpdatingGps(false)
    }
  }, [checkpoint.lat, checkpoint.lon, checkpoint.radiusMeters])

  useEffect(() => {
    updatePosition()
  }, [updatePosition])

  const handleChoiceSelect = useCallback(
    async (choice: string) => {
      if (quizState !== 'idle') return   // block any click once processing starts
      setSelectedChoice(choice)
      setQuizState('answering')

      // Check answer — server only, no local fallback
      let correct = false
      try {
        const res = await fetch(`/api/checkpoints/${cpId}/quiz`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answer: choice }),
        })
        const data = await res.json() as { correct?: boolean; error?: string }
        if (!res.ok) {
          // Surface server error (e.g. not arrived, rally not open)
          setQuizState('idle')
          setSelectedChoice(null)
          setError(data.error ?? 'サーバーエラーが発生しました')
          return
        }
        correct = data.correct ?? false
      } catch {
        setQuizState('idle')
        setSelectedChoice(null)
        setError('通信エラー。もう一度お試しください。')
        return
      }

      if (correct) {
        setQuizState('stamping')
      } else {
        setQuizAttempts((n) => n + 1)
        setQuizState('wrong')
        // Reset after 1.5s
        setTimeout(() => {
          setSelectedChoice(null)
          setQuizState('idle')
        }, 1500)
      }
    },
    [quizState, checkpoint.quizAnswer, cpId]
  )

  const handleStampDone = useCallback(() => {
    setQuizState('stamped')
    setStage('quiz-passed')
  }, [])

  const handlePhotoChange = useCallback(
    async (file: File | null) => {
      if (!file) return
      setIsUploadingPhoto(true)

      const reader = new FileReader()
      reader.onload = (e) => setPhotoPreview(e.target?.result as string)
      reader.readAsDataURL(file)

      try {
        const compressed = await compressImage(file)
        const formData = new FormData()
        formData.append('photo', compressed)
        const res = await fetch(`/api/checkpoints/${cpId}/photo`, {
          method: 'POST',
          body: formData,
        })
        if (res.ok) {
          setStage('completed')
        } else {
          throw new Error('upload failed')
        }
      } catch {
        setStage('completed')
      } finally {
        setIsUploadingPhoto(false)
      }
    },
    [cpId]
  )

  const kanji = KANJI[(checkpoint.number ?? 1) - 1] ?? '壱'
  const stationEn = STATION_EN[(checkpoint.number ?? 1) - 1] ?? '01'
  const inRange = distance !== null && distance <= checkpoint.radiusMeters
  const isCompleted = stage === 'completed'
  const distanceColor = inRange ? T.moss : distance !== null && distance < checkpoint.radiusMeters * 3 ? T.sea : T.ink2

  // Next checkpoint info for stamp overlay
  const nextId = checkpoint.number + 1
  const nextCp = CHECKPOINT_FALLBACKS[nextId]
  const nextForOverlay = nextCp
    ? { nameJa: nextCp.nameJa, nameEn: nextCp.nameEn, kanji: KANJI[nextId - 1] ?? '弐' }
    : null

  return (
    <div style={{ minHeight: '100vh', background: T.bg }}>

      {/* ── Stamp animation overlay ─────────────────────────────────────────── */}
      <StampOverlay
        visible={quizState === 'stamping'}
        kanji={kanji}
        nextCheckpoint={checkpoint.number < 6 ? nextForOverlay : null}
        onDone={handleStampDone}
      />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: T.surf,
          borderBottom: `1px solid ${T.rule}`,
          padding: '70px 20px 14px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 14,
        }}
      >
        <Link
          href="/dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'transparent',
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          <ArrowLeft />
        </Link>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.18em', color: T.ink2 }}>
            第{checkpoint.number}宿  ·  STATION {stationEn}
          </div>
          <div
            style={{
              fontFamily: '"Shippori Mincho", serif',
              fontSize: 18,
              fontWeight: 600,
              color: T.ink,
              marginTop: 2,
              lineHeight: 1.2,
            }}
          >
            {checkpoint.nameJa}
          </div>
        </div>

        <Hanko size={36} kanji={kanji} color={T.cinnabar} />
      </div>

      {/* ── Hero image / gradient ───────────────────────────────────────────── */}
      <div
        style={{
          height: 220,
          position: 'relative',
          background: checkpoint.photoUrl
            ? `url(${checkpoint.photoUrl}) ${getCheckpointMeta(checkpoint.id)?.photoBgPos ?? 'center 60%'}/cover no-repeat`
            : `linear-gradient(135deg, ${T.sea2} 0%, ${T.sea} 60%, ${T.ink} 100%)`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(42,41,37,0.10) 0%, rgba(42,41,37,0.70) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '12px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontStyle: 'italic',
                fontSize: 13,
                color: '#fff',
                opacity: 0.85,
              }}
            >
              {checkpoint.nameEn}
            </div>
            <div
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 11,
                color: '#fff',
                opacity: 0.7,
                marginTop: 2,
              }}
            >
              {checkpoint.lat.toFixed(4)}, {checkpoint.lon.toFixed(4)}
            </div>
          </div>
          <div
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11,
              color: '#fff',
              opacity: 0.7,
            }}
          >
            {new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* ── GPS distance card ───────────────────────────────────────────────── */}
      {!isCompleted && stage !== 'quiz' && stage !== 'quiz-passed' && (
        <div style={{ margin: '20px 20px 0' }}>
          <div
            style={{
              background: T.card,
              border: `2px solid ${inRange ? T.moss : T.sea}`,
              borderRadius: 18,
              padding: '22px 20px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Compass watermark */}
            <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.06, pointerEvents: 'none' }}>
              <svg viewBox="0 0 200 200" width={140} height={140} fill="none" stroke={T.sea} strokeWidth={0.7}>
                <circle cx="100" cy="100" r="96"/>
                <circle cx="100" cy="100" r="78"/>
                <circle cx="100" cy="100" r="60" strokeDasharray="2 3"/>
                {Array.from({ length: 32 }).map((_, i) => {
                  const a = (i / 32) * Math.PI * 2
                  const r2 = i % 8 === 0 ? 96 : i % 4 === 0 ? 92 : 86
                  return <line key={i} x1={100 + Math.cos(a) * 78} y1={100 + Math.sin(a) * 78} x2={100 + Math.cos(a) * r2} y2={100 + Math.sin(a) * r2} />
                })}
                <polygon points="100,8 105,100 100,80 95,100" fill={T.sea}/>
              </svg>
            </div>

            <div style={{ position: 'relative' }}>
              <Eyebrow>距離  ·  Distance to checkpoint</Eyebrow>

              {/* Distance + GPS status row */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
                {distance === null ? (
                  <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 52, fontWeight: 600, color: T.ink2, lineHeight: 1 }}>—</span>
                ) : distance < 1000 ? (
                  <>
                    <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 52, fontWeight: 600, color: distanceColor, lineHeight: 1 }}>{Math.round(distance)}</span>
                    <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 20, color: T.ink2 }}>m</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 52, fontWeight: 600, color: distanceColor, lineHeight: 1 }}>{(distance / 1000).toFixed(1)}</span>
                    <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 20, color: T.ink2 }}>km</span>
                  </>
                )}
                <div style={{ flex: 1 }} />
                {/* GPS LIVE / status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {gpsError ? (
                    <span style={{ fontSize: 11, color: T.ink2 }}>GPS オフ</span>
                  ) : (
                    <>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: inRange ? T.moss : T.sea, display: 'inline-block', animation: 'pulse-dot 1.5s ease-in-out infinite' }} />
                      <span style={{ fontSize: 11, color: inRange ? T.moss : T.sea, fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.04em' }}>
                        {inRange ? 'IN RANGE' : 'GPS LIVE'}
                      </span>
                    </>
                  )}
                  <button
                    onClick={updatePosition}
                    disabled={isUpdatingGps}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 6px', opacity: isUpdatingGps ? 0.4 : 0.6, lineHeight: 0 }}
                  >
                    <RefreshCw size={14} strokeWidth={1.6} color={T.ink2} style={{ animation: isUpdatingGps ? 'spin 1s linear infinite' : 'none' }} />
                  </button>
                </div>
              </div>

              {/* Progress bar toward stamping zone */}
              {distance !== null && (
                <>
                  <div style={{ marginTop: 14, height: 4, background: T.rule, borderRadius: 2, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, Math.max(2, ((1 - distance / (checkpoint.radiusMeters * 10)) * 100)))}%`,
                        height: '100%',
                        background: inRange
                          ? `linear-gradient(90deg, ${T.moss}, #5aad8a)`
                          : `linear-gradient(90deg, ${T.sea2}, ${T.sea})`,
                        borderRadius: 2,
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: T.ink2, fontFamily: '"JetBrains Mono", monospace' }}>
                    <span>遠  ·  Far</span>
                    <span style={{ color: inRange ? T.moss : T.ink2 }}>{inRange ? '解錠  ·  Stamping zone' : `${checkpoint.radiusMeters}m で解錠`}</span>
                  </div>
                </>
              )}

              {gpsError && (
                <div style={{ marginTop: 10, fontSize: 12, color: T.ink2, fontFamily: '"Shippori Mincho", serif', lineHeight: 1.5 }}>{gpsError}</div>
              )}

              {/* Navigate button */}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${checkpoint.lat},${checkpoint.lon}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 16,
                  width: '100%',
                  background: inRange ? T.moss : T.sea,
                  color: '#fff',
                  padding: '13px 0',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'none',
                  boxSizing: 'border-box',
                  transition: 'background 0.3s ease',
                }}
              >
                <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                </svg>
                Google Maps で案内  ·  Navigate
              </a>

              {/* Stamp button — shown inside card when in range */}
              {inRange && stage === 'at-location' && (
                <button
                  onClick={async () => {
                    const result = await recordArrival(position?.lat, position?.lon)
                    if (result !== 'error') setStage(result)
                  }}
                  disabled={isArriving}
                  style={{
                    marginTop: 10,
                    width: '100%',
                    background: T.cinnabar,
                    border: 'none',
                    borderRadius: 12,
                    padding: '16px 0',
                    textAlign: 'center',
                    cursor: 'pointer',
                    animation: 'pulse-dot 2s ease-in-out infinite',
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ fontFamily: '"Shippori Mincho", serif', fontSize: 17, fontWeight: 600, color: '#fff' }}>
                    押印する  ·  Stamp here
                  </div>
                  <div style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>
                    タップしてクイズに挑戦
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Mission card (always visible except completed) ──────────────────── */}
      {!isCompleted && stage !== 'quiz' && stage !== 'quiz-passed' && (
        <div style={{ padding: '16px 20px 0', marginBottom: 0 }}>
          <div
            style={{
              background: T.card,
              border: `1px solid ${T.rule}`,
              borderRadius: 14,
              padding: 20,
            }}
          >
            <Eyebrow>ミッション  ·  Mission</Eyebrow>
            <p
              style={{
                fontFamily: '"Shippori Mincho", serif',
                fontSize: 14,
                color: T.ink,
                lineHeight: 1.7,
                marginTop: 10,
                marginBottom: 0,
              }}
            >
              {checkpoint.description}
            </p>
          </div>
        </div>
      )}

      {/* ── Quiz section (4-choice) ──────────────────────────────────────────── */}
      {error && stage === 'quiz' && (
        <div style={{ margin: '16px 20px 0', padding: '12px 16px', background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: 10, color: '#c0392b', fontSize: 13, fontFamily: '"Shippori Mincho", serif', lineHeight: 1.5 }}>
          {error}
        </div>
      )}
      {stage === 'quiz' && (
        <div style={{ padding: '0 20px', marginBottom: 16 }}>
          <div
            style={{
              background: T.card,
              border: `1px solid ${T.rule}`,
              borderRadius: 14,
              padding: 20,
            }}
          >
            <Eyebrow>問い  ·  Quiz</Eyebrow>
            <p
              style={{
                fontFamily: '"Shippori Mincho", serif',
                fontSize: 16,
                fontWeight: 600,
                color: T.ink,
                lineHeight: 1.65,
                margin: '12px 0 20px',
              }}
            >
              {checkpoint.quizQuestion}
            </p>

            {/* 2×2 choice grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
              }}
            >
              {shuffledChoices.map((choice, i) => {
                const isSelected = selectedChoice === choice
                const isWrong = isSelected && quizState === 'wrong'
                return (
                  <button
                    key={choice}
                    onClick={() => handleChoiceSelect(choice)}
                    disabled={quizState !== 'idle'}
                    style={{
                      background: isWrong
                        ? T.wrongLight
                        : isSelected && quizState === 'answering'
                        ? T.cinnabarLight
                        : T.surf,
                      border: isWrong
                        ? `1.5px solid ${T.wrong}`
                        : isSelected && quizState === 'answering'
                        ? `1.5px solid ${T.cinnabar}`
                        : `1.5px solid ${T.rule}`,
                      borderRadius: 10,
                      padding: '14px 12px',
                      cursor: quizState === 'wrong' || quizState === 'stamping' ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      animation: isWrong ? 'shake 0.4s ease' : 'none',
                      transition: 'background 0.15s, border-color 0.15s',
                    }}
                  >
                    {/* Letter badge */}
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: isWrong
                          ? T.wrong
                          : isSelected && quizState === 'answering'
                          ? T.cinnabar
                          : T.ink2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#fff',
                          lineHeight: 1,
                        }}
                      >
                        {CHOICE_LABELS[i]}
                      </span>
                    </div>
                    <span
                      style={{
                        fontFamily: '"Shippori Mincho", serif',
                        fontSize: 14,
                        color: isWrong ? T.wrong : T.ink,
                        lineHeight: 1.4,
                        fontWeight: isSelected ? 600 : 400,
                      }}
                    >
                      {choice}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Wrong answer feedback */}
            {quizState === 'wrong' && (
              <div
                style={{
                  marginTop: 14,
                  padding: '10px 14px',
                  background: T.wrongLight,
                  border: `1px solid ${T.wrong}`,
                  borderRadius: 8,
                  fontSize: 13,
                  color: T.wrong,
                  fontFamily: '"Shippori Mincho", serif',
                  lineHeight: 1.5,
                }}
              >
                {quizAttempts >= 3
                  ? `ヒント: ${checkpoint.hint}`
                  : '不正解。もう一度考えてみましょう！'}
              </div>
            )}

            {/* Hint notice */}
            {quizAttempts > 0 && quizState === 'idle' && (
              <div
                style={{
                  marginTop: 12,
                  fontSize: 11,
                  color: T.ink2,
                  textAlign: 'center',
                  letterSpacing: '0.04em',
                }}
              >
                {quizAttempts}回目の挑戦
                {quizAttempts >= 2 && ` · ヒント: ${checkpoint.hint}`}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Completed stamp badge ────────────────────────────────────────────── */}
      {isCompleted && (
        <div style={{ margin: '0 20px 16px' }}>
          <div
            style={{
              background: T.mossBg,
              border: `1.5px solid ${T.moss}`,
              borderRadius: 14,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
            }}
          >
            <Hanko size={32} kanji={kanji} color={T.moss} completed />
            <div
              style={{
                fontFamily: '"Shippori Mincho", serif',
                fontSize: 16,
                fontWeight: 600,
                color: T.moss,
              }}
            >
              制覇済み  ·  Stamped
            </div>
          </div>
        </div>
      )}

      {/* ── Quiz passed: next CP revealed + photo upload ─────────────────────── */}
      {stage === 'quiz-passed' && (
        <>
          {/* Correct badge */}
          <div style={{ padding: '0 20px', marginBottom: 12 }}>
            <div
              style={{
                background: T.cinnabarLight,
                border: `1.5px solid ${T.cinnabar}`,
                borderRadius: 14,
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <Hanko size={40} kanji={kanji} color={T.cinnabar} completed />
              <div>
                <div
                  style={{
                    fontFamily: '"Shippori Mincho", serif',
                    fontSize: 16,
                    fontWeight: 700,
                    color: T.cinnabar,
                  }}
                >
                  正解  ·  Correct
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: T.ink2,
                    marginTop: 3,
                    fontFamily: '"Cormorant Garamond", serif',
                    fontStyle: 'italic',
                  }}
                >
                  スタンプが押されました
                </div>
              </div>
            </div>
          </div>

          {/* Next checkpoint unlocked */}
          {checkpoint.number < 6 && nextCp && (
            <div style={{ padding: '0 20px', marginBottom: 12 }}>
              <div
                style={{
                  background: T.card,
                  border: `1px solid ${T.rule}`,
                  borderRadius: 14,
                  padding: 20,
                }}
              >
                <Eyebrow>次の目的地が解放されました  ·  Unlocked</Eyebrow>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    marginTop: 14,
                  }}
                >
                  <Hanko size={52} kanji={KANJI[nextId - 1] ?? '弐'} color={T.cinnabar} />
                  <div>
                    <div
                      style={{
                        fontFamily: '"Shippori Mincho", serif',
                        fontSize: 20,
                        fontWeight: 700,
                        color: T.ink,
                        lineHeight: 1.2,
                      }}
                    >
                      {nextCp.nameJa}
                    </div>
                    <div
                      style={{
                        fontFamily: '"Cormorant Garamond", serif',
                        fontStyle: 'italic',
                        fontSize: 14,
                        color: T.ink2,
                        marginTop: 4,
                      }}
                    >
                      {nextCp.nameEn}  ·  {nextCp.area}
                    </div>
                    <div
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 10,
                        color: T.sea,
                        marginTop: 4,
                      }}
                    >
                      {nextCp.lat.toFixed(4)}, {nextCp.lon.toFixed(4)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Photo upload */}
          <div style={{ padding: '0 20px', marginBottom: 16 }}>
            <div
              style={{
                background: T.card,
                border: `1px solid ${T.rule}`,
                borderRadius: 14,
                padding: 20,
              }}
            >
              <Eyebrow>撮影  ·  Photo</Eyebrow>
              <p
                style={{
                  fontFamily: '"Shippori Mincho", serif',
                  fontSize: 13,
                  color: T.ink2,
                  lineHeight: 1.6,
                  margin: '8px 0 14px',
                }}
              >
                {checkpoint.missionDescription}
              </p>

              <label style={{ display: 'block', cursor: 'pointer' }}>
                <div
                  style={{
                    border: `1.5px dashed ${T.rule}`,
                    borderRadius: 10,
                    height: photoPreview ? 'auto' : 140,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: T.surf,
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  {isUploadingPhoto ? (
                    <RefreshCw size={32} color={T.ink2} strokeWidth={1.4} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : photoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoPreview} alt="preview" style={{ width: '100%', display: 'block', borderRadius: 10 }} />
                  ) : (
                    <>
                      <Camera size={32} color={T.ink2} strokeWidth={1.4} />
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 13,
                          color: T.ink2,
                          fontFamily: '"Shippori Mincho", serif',
                        }}
                      >
                        写真を撮る  ·  Take photo
                      </div>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  disabled={isUploadingPhoto}
                  onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
                />
              </label>

              <button
                onClick={() => setStage('completed')}
                disabled={isUploadingPhoto}
                style={{
                  marginTop: 12,
                  width: '100%',
                  background: T.sea,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '12px 0',
                  fontFamily: '"Shippori Mincho", serif',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: isUploadingPhoto ? 'not-allowed' : 'pointer',
                  opacity: isUploadingPhoto ? 0.4 : 1,
                }}
              >
                アップロードして完了
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Completed: back to dashboard ─────────────────────────────────────── */}
      {isCompleted && (
        <div style={{ padding: '0 20px', marginBottom: 16 }}>
          <Link
            href="/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: T.ink,
              color: T.bg,
              padding: '16px 0',
              borderRadius: 12,
              textDecoration: 'none',
              fontFamily: '"Shippori Mincho", serif',
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            <ArrowLeft />
            ダッシュボードへ戻る
          </Link>
        </div>
      )}

      {/* ── Emergency footer ────────────────────────────────────────────────── */}
      <EmergencyFooter />

      {/* ── CSS animations ──────────────────────────────────────────────────── */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes stamp-drop {
          0%   { transform: translateY(-180px) rotate(-10deg) scale(0.5); opacity: 0; }
          60%  { opacity: 1; }
          80%  { transform: translateY(10px) rotate(2deg) scale(1.1); }
          100% { transform: translateY(0) rotate(0deg) scale(1); }
        }
        @keyframes ink-ring {
          0%   { transform: scale(0.2); opacity: 0.9; }
          100% { transform: scale(2.8); opacity: 0; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%      { transform: translateX(-7px); }
          40%      { transform: translateX(7px); }
          60%      { transform: translateX(-4px); }
          80%      { transform: translateX(4px); }
        }
        @keyframes pulse-dot {
          0%, 100% { box-shadow: 0 0 0 0 rgba(168,90,58,0.35); }
          50%       { box-shadow: 0 0 0 10px rgba(168,90,58,0); }
        }
      `}</style>
    </div>
  )
}
