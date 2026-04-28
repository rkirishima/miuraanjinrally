/**
 * Checkpoint display metadata — single source of truth.
 *
 * Photos live in /public/images/checkpoints/ (and a few in /public/images/).
 * Both the demo page and the live checkpoint page import from here so photo
 * paths never drift out of sync.
 */

export type CheckpointMeta = {
  /** DB id (1-based, matches checkpoints.id) */
  id: number
  /** Order kanji: 壱 弐 参 肆 伍 陸 */
  kanji: string
  nameJa: string
  nameEn: string
  /** Prefecture / city area label */
  area: string
  /** Absolute path under /public — used as <img src> or CSS background-image */
  photoUrl: string
  /**
   * CSS background-position for the demo banner crop.
   * Defaults to "center 60%" when omitted.
   */
  photoBgPos?: string
}

export const CHECKPOINT_META: CheckpointMeta[] = [
  {
    id: 1,
    kanji: '壱',
    nameJa: 'Felicity',
    nameEn: 'Felicity · START',
    area: '葉山町',
    photoUrl: '/images/checkpoints/felicity-gaikan.jpg',
    photoBgPos: 'center 82%',
  },
  {
    id: 2,
    kanji: '弐',
    nameJa: '三笠公園',
    nameEn: 'Mikasa Park',
    area: '横須賀市',
    photoUrl: '/images/checkpoints/cp02-mikasa.png',
    photoBgPos: 'center 50%',
  },
  {
    id: 3,
    kanji: '参',
    nameJa: 'ジハングンオブジェ',
    nameEn: 'Jihanggun · Yokosuka',
    area: '横須賀市',
    photoUrl: '/images/checkpoints/cp05-jihanggun.png',
    photoBgPos: 'center 40%',
  },
  {
    id: 4,
    kanji: '肆',
    nameJa: '立石公園',
    nameEn: 'Tateishi Park',
    area: '横須賀市',
    photoUrl: '/images/checkpoints/cp04-tateishi.png',
    photoBgPos: 'center 55%',
  },
  {
    id: 5,
    kanji: '伍',
    nameJa: '逗子マリーナ',
    nameEn: 'Zushi Marina',
    area: '逗子市',
    photoUrl: '/images/checkpoints/cp06-zushi-marina.png',
    photoBgPos: 'center 50%',
  },
  {
    id: 6,
    kanji: '陸',
    nameJa: '亀岡八幡宮',
    nameEn: 'Kameoka Hachiman · GOAL',
    area: '逗子市',
    photoUrl: '/images/亀岡八幡宮.png',
    photoBgPos: 'center 45%',
  },
]

/** Lookup helper — returns meta for a given checkpoint id, or undefined */
export function getCheckpointMeta(id: number): CheckpointMeta | undefined {
  return CHECKPOINT_META.find((m) => m.id === id)
}
