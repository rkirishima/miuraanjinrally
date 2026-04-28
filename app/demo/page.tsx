'use client'

/**
 * /demo — Quiz UI preview (no GPS, no login required)
 * Matches Claude Design spec + stamp animation + photo banner
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Hanko } from '@/components/anjin'
import { getCheckpointMeta } from '@/lib/checkpoint-meta'

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg: '#f0ede6',
  card: '#faf8f4',
  white: '#ffffff',
  ink: '#2a2520',
  ink2: '#6b6455',
  ink3: '#9c9185',
  rule: 'rgba(42,37,32,0.10)',
  cinnabar: '#b85c38',
  sel: '#4f7d96',
  selBg: '#eef4f7',
  wrong: '#c0392b',
  wrongBg: '#fdf0ef',
}

const KANJI_NUM = ['壱', '弐', '参', '肆']

// ─── Demo checkpoint data ─────────────────────────────────────────────────────
// 順序: Felicity → 三笠公園 → ジハングンオブジェ → 立石公園 → 逗子マリーナ → 亀岡八幡宮
const DEMO = [
  {
    cpNum: 1, kanji: '壱', nameJa: 'Felicity', nameEn: 'Felicity',
    photoUrl: getCheckpointMeta(1)?.photoUrl ?? null as string | null,
    photoBgPos: getCheckpointMeta(1)?.photoBgPos ?? 'center 60%',
    question: 'フェリシティが入っているこの建物、カフェになる前は何だった？',
    questionEn: 'Before becoming a café, what was this building used for?',
    answer: '全部正解',
    choices: [
      { ja: '街の電気屋さん', en: 'A neighbourhood electronics shop' },
      { ja: '伝説のバイクショップ', en: 'A legendary motorcycle shop' },
      { ja: 'サーフボード工房', en: 'A surfboard workshop' },
      { ja: '全部正解 ✓', en: 'All of the above ✓' },
    ],
    hint: {
      title: 'この建物には地層がある',
      body: 'この場所は、電気屋 → バイクショップ → サーフボード工房 → そしてフェリシティへ。葉山の暮らしを支えてきた建物が、いま再びライダーたちの出発点となる。',
      bodyEn: 'Electronics shop → motorcycle shop → surfboard workshop → Felicity. A building that has always served the Hayama life — now the starting line.',
    },
  },
  {
    cpNum: 2, kanji: '弐', nameJa: '三笠公園', nameEn: 'Mikasa Park',
    photoUrl: getCheckpointMeta(2)?.photoUrl ?? null as string | null,
    photoBgPos: getCheckpointMeta(2)?.photoBgPos ?? 'center 60%',
    question: '戦艦三笠が勝利を飾った大海戦の名称は？',
    questionEn: 'What was the name of the great naval battle where the Mikasa achieved victory?',
    answer: '日本海海戦',
    choices: [
      { ja: '日本海海戦', en: 'Battle of Tsushima' },
      { ja: 'レイテ沖海戦', en: 'Battle of Leyte Gulf' },
      { ja: '沖縄海戦', en: 'Battle of Okinawa' },
      { ja: 'ミッドウェー海戦', en: 'Battle of Midway' },
    ],
    hint: {
      title: '1905年の決定的な海戦',
      body: '日露戦争のクライマックス。東郷平八郎が率いる連合艦隊がバルチック艦隊を撃破。その旗艦が三笠であった。',
      bodyEn: "The climax of the Russo-Japanese War, 1905. Admiral Tōgō's decisive victory.",
    },
  },
  {
    cpNum: 3, kanji: '参', nameJa: 'ジハングンオブジェ', nameEn: 'Jihanggun Objet',
    photoUrl: getCheckpointMeta(3)?.photoUrl ?? null as string | null,
    photoBgPos: getCheckpointMeta(3)?.photoBgPos ?? 'center 60%',
    question: '「#ジハングン ヨコスカ」——「ジハングン」とは何の略？',
    questionEn: 'What does "Jihanggun" stand for at this Yokosuka landmark?',
    answer: '自販機群',
    choices: [
      { ja: '自販機群（本物とフェイクの自販機アート）', en: 'Jihanki-gun — a mix of real & fake vending machines' },
      { ja: '慈眼軍（地元の伝説の武士団）', en: 'Jigan-gun — a legendary local samurai corps' },
      { ja: '字版群（箱文字アートの集合体）', en: 'Jiban-gun — a collective of box-letter art' },
      { ja: '地番群（地番表示プレートを集めたアート）', en: 'Chiban-gun — a collection of address number plates' },
    ],
    hint: {
      title: 'オブジェの周りをよく見て',
      body: '「ヨコスカ」の文字オブジェの周囲には、本物そっくりのフェイク自販機が紛れ込んでいる。気づかず通り過ぎる人も多いが、それが仕掛け。',
      bodyEn: 'Look around the letters — fake vending machines are hidden among real ones. Most visitors walk right past the joke.',
    },
  },
  {
    cpNum: 4, kanji: '肆', nameJa: '立石公園', nameEn: 'Tateishi Park',
    photoUrl: getCheckpointMeta(4)?.photoUrl ?? null as string | null,
    photoBgPos: getCheckpointMeta(4)?.photoBgPos ?? 'center 60%',
    question: '北斎の「富嶽三十六景」、実際に収録された作品は何枚？',
    questionEn: 'Hokusai\'s "Thirty-six Views of Mt. Fuji" — how many prints does it actually contain?',
    answer: '46枚',
    choices: [
      { ja: '46枚', en: '46 prints' },
      { ja: '36枚', en: '36 prints' },
      { ja: '60枚', en: '60 prints' },
      { ja: '100枚', en: '100 prints' },
    ],
    hint: {
      title: 'タイトルと中身が合っていない？',
      body: '「三十六景」と銘打ちながら、評判が良すぎて10枚が追加され全46枚に。立石の岩と富士を描いた一枚も、その中に収められている。',
      bodyEn: 'So popular that Hokusai added 10 extra prints — making 46 in all. The view from Tateishi is among them.',
    },
  },
  {
    cpNum: 5, kanji: '伍', nameJa: '逗子マリーナ', nameEn: 'Zushi Marina',
    photoUrl: getCheckpointMeta(5)?.photoUrl ?? null as string | null,
    photoBgPos: getCheckpointMeta(5)?.photoBgPos ?? 'center 60%',
    question: '「リビエラ逗子マリーナ」の「リビエラ」は、どこの地名に由来するか？',
    questionEn: 'Where does the name "Riviera" in "Riviera Zushi Marina" originate from?',
    answer: '南フランス・イタリアの地中海沿岸',
    choices: [
      { ja: '南フランス・イタリアの地中海沿岸', en: 'The Mediterranean coast of southern France & Italy' },
      { ja: 'スペインのバルセロナ近郊', en: 'Near Barcelona, Spain' },
      { ja: 'ギリシャのサントリーニ島', en: 'Santorini Island, Greece' },
      { ja: 'クロアチアのドブロブニク', en: 'Dubrovnik, Croatia' },
    ],
    hint: {
      title: '湘南の地中海リゾート',
      body: 'リビエラとはフランス語で「海岸」の意。コート・ダジュールやイタリア・リグリア海岸など、地中海の高級リゾート地帯を指す言葉。逗子マリーナはその雰囲気を湘南に再現した。',
      bodyEn: 'Riviera means "coastline" in French — evoking the glamorous Mediterranean shores of France and Italy, transplanted to Shonan.',
    },
  },
  {
    cpNum: 6, kanji: '陸', nameJa: '亀岡八幡宮', nameEn: 'Kameoka Hachimangu',
    photoUrl: getCheckpointMeta(6)?.photoUrl ?? null as string | null,
    photoBgPos: getCheckpointMeta(6)?.photoBgPos ?? 'center 60%',
    question: '八幡宮に祀られる「八幡神」と同一視される天皇は誰か？',
    questionEn: 'Which emperor is identified with Hachiman, the deity enshrined at Hachimangu shrines?',
    answer: '応神天皇',
    choices: [
      { ja: '応神天皇', en: 'Emperor Ōjin' },
      { ja: '神武天皇', en: 'Emperor Jimmu' },
      { ja: '崇神天皇', en: 'Emperor Sujin' },
      { ja: '仁徳天皇', en: 'Emperor Nintoku' },
    ],
    hint: {
      title: '武神・弓矢の神',
      body: '八幡神は応神天皇を神格化した武神。源氏の氏神として源頼朝も深く信仰し、三浦半島にも多くの八幡宮が勧請された。亀岡八幡宮は三浦市三崎に鎮座する古社。',
      bodyEn: 'Hachiman is the deified Emperor Ōjin — god of war and archery, clan deity of the Minamoto, whose influence spread throughout the Miura Peninsula.',
    },
  },
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Ink spread rings ─────────────────────────────────────────────────────────
function InkRings({ active }: { active: boolean }) {
  if (!active) return null
  return (
    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none', width: 220, height: 220 }}>
      {[{ delay: '0s', opacity: 1, width: 3 }, { delay: '0.18s', opacity: 0.5, width: 1.5 }, { delay: '0.36s', opacity: 0.25, width: 1 }].map((r, i) => (
        <div key={i} style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: `${r.width}px solid ${T.cinnabar}`,
          opacity: r.opacity,
          animation: `ink-ring 1.3s ${r.delay} ease-out forwards`,
        }} />
      ))}
    </div>
  )
}

// ─── Stamp animation overlay ──────────────────────────────────────────────────
function StampOverlay({
  visible, kanji, onDone,
}: {
  visible: boolean
  kanji: string
  onDone: () => void
}) {
  const [phase, setPhase] = useState<'drop' | 'impact' | 'reveal'>('drop')

  useEffect(() => {
    if (!visible) { setPhase('drop'); return }
    const t1 = setTimeout(() => setPhase('impact'), 700)
    const t2 = setTimeout(() => setPhase('reveal'), 1200)
    const t3 = setTimeout(() => onDone(), 3000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [visible, onDone])

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(42,37,32,0.93)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 0,
    }}>
      {/* Stamp + ink */}
      <div style={{ position: 'relative', width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ animation: 'stamp-drop 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
          <Hanko size={170} kanji={kanji} color={T.cinnabar} />
        </div>
        <InkRings active={phase === 'impact' || phase === 'reveal'} />
      </div>

      {/* 正解 text */}
      <div style={{
        marginTop: 36, textAlign: 'center',
        opacity: phase === 'reveal' ? 1 : 0,
        transform: phase === 'reveal' ? 'translateY(0)' : 'translateY(18px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}>
        <div style={{
          fontFamily: '"Shippori Mincho", serif',
          fontSize: 44, fontWeight: 700,
          color: T.cinnabar, letterSpacing: '0.06em', lineHeight: 1,
        }}>正解</div>
        <div style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontStyle: 'italic',
          fontSize: 16, color: 'rgba(240,237,230,0.65)',
          marginTop: 8, letterSpacing: '0.12em',
        }}>
          Correct  ·  Well done
        </div>
      </div>
    </div>
  )
}

// ─── Hint bottom sheet ────────────────────────────────────────────────────────
function HintSheet({ hint, onClose }: {
  hint: { title: string; body: string; bodyEn: string }
  onClose: () => void
}) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(42,37,32,0.45)', backdropFilter: 'blur(3px)' }} />
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative', background: T.white,
          borderRadius: '20px 20px 0 0', padding: '20px 24px 44px',
          animation: 'slide-up 0.28s ease',
        }}
      >
        <div style={{ width: 36, height: 4, background: T.rule, borderRadius: 2, margin: '0 auto 20px' }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <div style={{ width: 18, height: 1.5, background: T.cinnabar }} />
              <span style={{ fontSize: 9, letterSpacing: '0.25em', color: T.cinnabar, fontFamily: '"JetBrains Mono", monospace' }}>
                助言  ·  HINT
              </span>
            </div>
            <div style={{ fontFamily: '"Shippori Mincho", serif', fontSize: 19, fontWeight: 700, color: T.ink }}>
              {hint.title}
            </div>
          </div>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
            border: `2px solid ${T.cinnabar}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: '"Shippori Mincho", serif', fontSize: 16, fontWeight: 700, color: T.cinnabar }}>助</span>
          </div>
        </div>

        <div style={{
          border: `1px solid ${T.rule}`, borderLeft: `3px solid ${T.cinnabar}`,
          borderRadius: '0 8px 8px 0',
          padding: '14px 16px', background: T.bg, marginBottom: 20,
        }}>
          <p style={{ fontFamily: '"Shippori Mincho", serif', fontSize: 14, color: T.ink, lineHeight: 1.85, margin: 0 }}>{hint.body}</p>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: 12, color: T.ink3, margin: '10px 0 0' }}>{hint.bodyEn}</p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '13px 0', border: `1.5px solid ${T.rule}`, borderRadius: 10, background: T.card, fontFamily: '"Shippori Mincho", serif', fontSize: 13, fontWeight: 600, color: T.ink2, cursor: 'pointer' }}>
            閉じる  ·  Close
          </button>
          <button onClick={onClose} style={{ flex: 2, padding: '13px 0', border: 'none', borderRadius: 10, background: T.ink, fontFamily: '"Shippori Mincho", serif', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
            問いへ戻る  ·  Back to question
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Correct result screen ────────────────────────────────────────────────────
function CorrectScreen({ answer, answerEn, kanji, nameJa, onStamp }: {
  answer: string; answerEn: string; kanji: string; nameJa: string; onStamp: () => void
}) {
  return (
    <div style={{
      minHeight: '100vh', background: T.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 32px',
      animation: 'fade-in 0.4s ease',
    }}>
      {/* 正 hanko */}
      <div style={{
        width: 124, height: 124, borderRadius: '50%',
        border: `3px solid ${T.cinnabar}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 32, position: 'relative',
        animation: 'stamp-pop 0.5s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {[0,90,180,270].map(deg => (
          <div key={deg} style={{ position: 'absolute', width: 9, height: 1.5, background: T.cinnabar, transformOrigin: 'left center', transform: `rotate(${deg}deg) translateX(56px)` }} />
        ))}
        <span style={{ fontFamily: '"Shippori Mincho", serif', fontSize: 50, fontWeight: 700, color: T.cinnabar, lineHeight: 1 }}>正</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 20, height: 1.5, background: T.cinnabar }} />
        <span style={{ fontSize: 10, letterSpacing: '0.3em', color: T.cinnabar, fontFamily: '"JetBrains Mono", monospace' }}>正解  ·  CORRECT</span>
        <div style={{ width: 20, height: 1.5, background: T.cinnabar }} />
      </div>

      <div style={{ fontFamily: '"Shippori Mincho", serif', fontSize: 28, fontWeight: 700, color: T.ink, textAlign: 'center', marginBottom: 4 }}>{answer}</div>
      <div style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: 14, color: T.ink3, marginBottom: 32, textAlign: 'center' }}>{answerEn}</div>

      <p style={{ fontFamily: '"Shippori Mincho", serif', fontSize: 13, color: T.ink2, lineHeight: 2, textAlign: 'center', marginBottom: 48 }}>
        続いて、押印へ。<br />あなたの帳面に、{nameJa}の判子を。
      </p>

      <button onClick={onStamp} style={{
        width: '100%', maxWidth: 360, padding: '16px 0',
        background: T.ink, color: '#fff', border: 'none', borderRadius: 12,
        fontFamily: '"Shippori Mincho", serif', fontSize: 15, fontWeight: 600,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', border: `1.5px solid ${T.cinnabar}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: '"Shippori Mincho", serif', fontSize: 10, color: T.cinnabar }}>{kanji}</span>
        </div>
        押印する  ·  Stamp this checkpoint →
      </button>
    </div>
  )
}

// ─── Stamped screen ───────────────────────────────────────────────────────────
function StampedScreen({ kanji, nameJa, onReset }: { kanji: string; nameJa: string; onReset: () => void }) {
  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 32px', animation: 'fade-in 0.4s ease' }}>
      <Hanko size={100} kanji={kanji} color={T.cinnabar} completed />
      <div style={{ fontFamily: '"Shippori Mincho", serif', fontSize: 22, fontWeight: 700, color: T.ink, marginTop: 28, marginBottom: 6, textAlign: 'center' }}>{nameJa}</div>
      <div style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: 14, color: T.ink3, marginBottom: 48, textAlign: 'center' }}>制覇  ·  Stamped</div>
      <button onClick={onReset} style={{ padding: '13px 36px', background: 'transparent', border: `1.5px solid ${T.ink3}`, borderRadius: 10, fontFamily: '"Shippori Mincho", serif', fontSize: 13, color: T.ink2, cursor: 'pointer' }}>
        もう一度試す  ·  Try again
      </button>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
type Stage = 'question' | 'stamping' | 'correct' | 'stamped'

export default function DemoPage() {
  const [demoIdx, setDemoIdx] = useState(0)
  const demo = DEMO[demoIdx]

  const [shuffled, setShuffled] = useState<typeof demo.choices>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [stage, setStage] = useState<Stage>('question')
  const [showHint, setShowHint] = useState(false)
  const [isWrong, setIsWrong] = useState(false)
  const [wrongCount, setWrongCount] = useState(0)

  useEffect(() => {
    setShuffled(shuffle(demo.choices))
    setSelected(null)
    setStage('question')
    setShowHint(false)
    setIsWrong(false)
    setWrongCount(0)
  }, [demo])

  const handleSubmit = useCallback(() => {
    if (!selected) return
    if (selected === demo.answer) {
      setIsWrong(false)
      setStage('stamping')   // ← start stamp animation
    } else {
      setWrongCount(n => n + 1)
      setIsWrong(true)
    }
  }, [selected, demo.answer])

  const handleRetry = useCallback(() => {
    setSelected(null)
    setIsWrong(false)
  }, [])

  const handleReset = useCallback(() => {
    setShuffled(shuffle(demo.choices))
    setSelected(null)
    setStage('question')
    setShowHint(false)
    setIsWrong(false)
    setWrongCount(0)
  }, [demo.choices])

  if (stage === 'stamped') return <StampedScreen kanji={demo.kanji} nameJa={demo.nameJa} onReset={handleReset} />
  if (stage === 'correct') {
    const answerEn = demo.choices.find(c => c.ja === demo.answer)?.en ?? ''
    return <CorrectScreen answer={demo.answer} answerEn={answerEn} kanji={demo.kanji} nameJa={demo.nameJa} onStamp={() => setStage('stamped')} />
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, position: 'relative', paddingBottom: 110 }}>

      {/* Stamp animation overlay */}
      <StampOverlay
        visible={stage === 'stamping'}
        kanji={demo.kanji}
        onDone={() => setStage('correct')}
      />

      {/* Hint sheet */}
      {showHint && <HintSheet hint={demo.hint} onClose={() => setShowHint(false)} />}

      {/* Demo switcher */}
      <div style={{ background: T.cinnabar, padding: '7px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.12em' }}>DEMO MODE</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {DEMO.map((d, i) => (
            <button key={i} onClick={() => setDemoIdx(i)} style={{
              background: i === demoIdx ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${i === demoIdx ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.18)'}`,
              borderRadius: 6, padding: '3px 12px', cursor: 'pointer',
              fontFamily: '"Shippori Mincho", serif', fontSize: 12, color: '#fff',
            }}>
              {d.kanji}
            </button>
          ))}
        </div>
      </div>

      {/* Header */}
      <div style={{ background: T.bg, padding: '14px 20px 12px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${T.rule}` }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: `2px solid ${T.cinnabar}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontFamily: '"Shippori Mincho", serif', fontSize: 14, fontWeight: 700, color: T.cinnabar }}>{demo.kanji}</span>
        </div>
        <div>
          <div style={{ fontSize: 9, letterSpacing: '0.18em', color: T.ink3, fontFamily: '"JetBrains Mono", monospace' }}>CP 0{demo.cpNum}  ·  問</div>
          <div style={{ fontFamily: '"Shippori Mincho", serif', fontSize: 14, fontWeight: 600, color: T.ink, marginTop: 1 }}>{demo.nameJa}</div>
        </div>
      </div>

      {/* ── Photo banner ──────────────────────────────────────────────────────── */}
      <div style={{
        height: 200, position: 'relative', overflow: 'hidden',
        background: demo.photoUrl
          ? `url(${demo.photoUrl}) ${(demo as {photoBgPos?: string}).photoBgPos ?? 'center center'}/cover no-repeat`
          : `linear-gradient(145deg, #8fa8b8 0%, #5a7a8e 45%, #2a3a48 100%)`,
      }}>
        {/* Overlay gradient */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(42,37,32,0.08) 0%, rgba(42,37,32,0.60) 100%)' }} />

        {/* Photo placeholder label (only when no photo) */}
        {!demo.photoUrl && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            textAlign: 'center',
          }}>
            <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.2em' }}>
              PHOTO  ·  {demo.nameJa.toUpperCase()}
            </div>
          </div>
        )}

        {/* Bottom overlay info */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>{demo.nameEn}</div>
            <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
              {demo.cpNum === 3 ? '35.213°N · 139.611°E' : '35.281°N · 139.672°E'}
            </div>
          </div>
          <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: 'rgba(255,255,255,0.55)' }}>
            {new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* Quiz body */}
      <div style={{ padding: '24px 20px 0' }}>
        {/* Question number */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ width: 20, height: 1.5, background: T.cinnabar }} />
          <span style={{ fontSize: 10, letterSpacing: '0.2em', color: T.cinnabar, fontFamily: '"JetBrains Mono", monospace' }}>
            問の{demo.kanji}  ·  QUESTION 0{demo.cpNum}
          </span>
        </div>

        <h1 style={{ fontFamily: '"Shippori Mincho", serif', fontSize: 22, fontWeight: 700, color: T.ink, lineHeight: 1.55, margin: '0 0 8px' }}>
          {demo.question}
        </h1>
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: 13, color: T.ink3, margin: '0 0 28px', lineHeight: 1.5 }}>
          {demo.questionEn}
        </p>

        {/* Choices — vertical list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {shuffled.map((choice, i) => {
            const isSel = selected === choice.ja
            const isWrongChoice = isWrong && isSel
            return (
              <button
                key={choice.ja}
                onClick={() => { if (!isWrong || !isSel) { setIsWrong(false); setSelected(choice.ja) } }}
                style={{
                  width: '100%',
                  background: isWrongChoice ? T.wrongBg : isSel ? T.selBg : T.card,
                  border: `1.5px solid ${isWrongChoice ? T.wrong : isSel ? T.sel : T.rule}`,
                  borderRadius: 12, padding: '15px 16px',
                  display: 'flex', alignItems: 'center', gap: 14,
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'border-color 0.15s, background 0.15s',
                  animation: isWrongChoice ? 'shake 0.4s ease' : 'none',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  border: `1.5px solid ${isWrongChoice ? T.wrong : isSel ? T.sel : T.ink3}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isWrongChoice ? T.wrong : isSel ? T.sel : 'transparent',
                  transition: 'all 0.15s',
                }}>
                  {isWrongChoice
                    ? <span style={{ fontSize: 14, color: '#fff' }}>✕</span>
                    : <span style={{ fontFamily: '"Shippori Mincho", serif', fontSize: 14, fontWeight: 600, color: isSel ? '#fff' : T.ink2, lineHeight: 1 }}>{KANJI_NUM[i]}</span>
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: '"Shippori Mincho", serif', fontSize: 16, fontWeight: 600, color: isWrongChoice ? T.wrong : isSel ? T.sel : T.ink, lineHeight: 1.3 }}>{choice.ja}</div>
                  <div style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: 12, color: isWrongChoice ? T.wrong : T.ink3, marginTop: 3, opacity: isWrongChoice ? 0.7 : 1 }}>{choice.en}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Bottom bar ──────────────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: T.bg, borderTop: `1px solid ${T.rule}`,
        padding: '12px 20px 32px', zIndex: 50,
      }}>
        {/* Wrong notification */}
        {isWrong && (
          <div style={{
            background: T.ink, borderRadius: 10, padding: '11px 16px',
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10,
            animation: 'slide-up-sm 0.22s ease',
          }}>
            <span style={{ fontSize: 16, color: T.cinnabar, flexShrink: 0 }}>✕</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <div style={{ width: 14, height: 1, background: T.cinnabar }} />
                <span style={{ fontSize: 9, letterSpacing: '0.2em', color: T.cinnabar, fontFamily: '"JetBrains Mono", monospace' }}>外れ  ·  NOT QUITE</span>
              </div>
              <div style={{ fontFamily: '"Shippori Mincho", serif', fontSize: 13, color: '#fff' }}>
                もう一度。{wrongCount >= 2 ? 'ヒントを使ってみましょう。' : `残り${3 - wrongCount}回挑戦できます。`}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          {/* Hint button */}
          <button onClick={() => setShowHint(true)} style={{
            padding: '12px 16px', background: 'transparent',
            border: `1.5px solid ${T.rule}`, borderRadius: 10,
            fontFamily: '"Shippori Mincho", serif', fontSize: 12, color: T.ink2,
            cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            ?  ヒントを見る
          </button>

          {isWrong ? (
            <button onClick={handleRetry} style={{ flex: 1, padding: '12px 0', background: T.cinnabar, color: '#fff', border: 'none', borderRadius: 10, fontFamily: '"Shippori Mincho", serif', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              もう一度  ·  Retry ↩
            </button>
          ) : selected ? (
            <button onClick={handleSubmit} style={{ flex: 1, padding: '12px 0', background: T.ink, color: '#fff', border: 'none', borderRadius: 10, fontFamily: '"Shippori Mincho", serif', fontSize: 14, fontWeight: 600, cursor: 'pointer', animation: 'fade-in 0.2s ease' }}>
              この答えで決める  ·  Submit →
            </button>
          ) : (
            <div style={{ flex: 1, padding: '12px 16px', border: `1.5px dashed ${T.rule}`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: T.ink3, letterSpacing: '0.15em' }}>
              選択して進む  ·  TAP TO PICK
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes stamp-drop {
          0%   { transform: translateY(-200px) rotate(-12deg) scale(0.4); opacity: 0; }
          55%  { opacity: 1; }
          80%  { transform: translateY(12px) rotate(2deg) scale(1.08); }
          100% { transform: translateY(0) rotate(0deg) scale(1); }
        }
        @keyframes ink-ring {
          0%   { transform: scale(0.15); opacity: 0.9; }
          100% { transform: scale(3); opacity: 0; }
        }
        @keyframes stamp-pop {
          0%   { transform: scale(0.3) rotate(-15deg); opacity: 0; }
          70%  { transform: scale(1.08) rotate(2deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-7px); }
          40% { transform: translateX(7px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes slide-up-sm {
          from { transform: translateY(10px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
