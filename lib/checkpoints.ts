import type {
  CheckpointStatus,
  CheckpointWithStatus,
  CheckpointCompletion,
  Checkpoint,
} from '@/types/database'

// ============================================================
// Status computation
// ============================================================

/**
 * Determines the status of a single checkpoint for a given participant.
 *
 * Rules:
 *  - Checkpoint 1 (order_index 1) is always unlocked.
 *  - Checkpoint N unlocks when checkpoint N-1 has quiz_passed_at set.
 *    (We do NOT require photo_uploaded_at so that a failed photo upload in the
 *     field can never permanently block a rider's progress.)
 *  - A checkpoint is "in_progress" when it has arrived_at but no completed_at.
 *  - A checkpoint is "completed" when completed_at is set.
 */
export function getCheckpointStatus(
  checkpoint: Checkpoint,
  completions: CheckpointCompletion[],
  allCheckpoints: Checkpoint[]
): CheckpointStatus {
  const completion = completions.find((c) => c.checkpoint_id === checkpoint.id)

  // Already done
  if (completion?.completed_at) return 'completed'

  // In progress (arrived but not yet finished all steps)
  if (completion?.arrived_at) return 'in_progress'

  // First checkpoint in order is always unlocked
  const sortedCheckpoints = [...allCheckpoints].sort(
    (a, b) => a.order_index - b.order_index
  )
  const isFirst = sortedCheckpoints[0]?.id === checkpoint.id
  if (isFirst) return 'unlocked'

  // Find the predecessor in order
  const currentIdx = sortedCheckpoints.findIndex((cp) => cp.id === checkpoint.id)
  if (currentIdx <= 0) return 'locked'

  const predecessor = sortedCheckpoints[currentIdx - 1]
  const predecessorCompletion = completions.find(
    (c) => c.checkpoint_id === predecessor.id
  )

  if (predecessorCompletion?.quiz_passed_at) return 'unlocked'

  return 'locked'
}

/**
 * Builds a full list of CheckpointWithStatus objects sorted by order_index.
 */
export function buildCheckpointsWithStatus(
  checkpoints: Checkpoint[],
  completions: CheckpointCompletion[],
  currentLat?: number,
  currentLon?: number
): CheckpointWithStatus[] {
  const sorted = [...checkpoints].sort((a, b) => a.order_index - b.order_index)

  return sorted.map((cp) => {
    const status = getCheckpointStatus(cp, completions, checkpoints)
    const completion = completions.find((c) => c.checkpoint_id === cp.id)
    const distance =
      currentLat != null && currentLon != null
        ? haversineDistance(currentLat, currentLon, Number(cp.latitude), Number(cp.longitude))
        : undefined

    return {
      ...cp,
      status,
      completion,
      distance,
    }
  })
}

// ============================================================
// Answer normalisation & checking
// ============================================================

/**
 * Normalises an answer string for comparison:
 * trims whitespace, collapses internal spaces, and lowercases.
 */
export function normalizeAnswer(answer: string): string {
  return answer.trim().replace(/\s+/g, '').toLowerCase()
}

/**
 * Returns true when the given answer is accepted for the checkpoint.
 *
 * Matching strategy (in order):
 *  1. Exact match after normalisation.
 *  2. Any alias is an exact match after normalisation.
 *
 * Substring matching is intentionally NOT used — it was too lenient
 * (e.g. "日本" would pass for "日本海").  Use quiz_answer_aliases to
 * allow acceptable alternative phrasings.
 */
export function checkAnswer(
  given: string,
  correct: string,
  aliases?: string[] | null
): boolean {
  const normGiven = normalizeAnswer(given)
  const normCorrect = normalizeAnswer(correct)

  if (normGiven === normCorrect) return true

  if (aliases && aliases.length > 0) {
    return aliases.some((alias) => normalizeAnswer(alias) === normGiven)
  }

  return false
}

// ============================================================
// GPS utilities
// ============================================================

/**
 * Calculates the straight-line distance between two GPS coordinates
 * using the Haversine formula.  Returns metres.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6_371_000 // Earth radius in metres
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Returns true when the given coordinates are within the checkpoint's radius.
 */
export function isWithinRadius(
  userLat: number,
  userLon: number,
  checkpoint: Checkpoint
): boolean {
  const distance = haversineDistance(
    userLat,
    userLon,
    Number(checkpoint.latitude),
    Number(checkpoint.longitude)
  )
  return distance <= checkpoint.radius_meters
}

// ============================================================
// Progress helpers
// ============================================================

/**
 * Returns the number of fully completed checkpoints.
 */
export function countCompleted(completions: CheckpointCompletion[]): number {
  return completions.filter((c) => c.completed_at != null).length
}

/**
 * Returns true when all checkpoints have been completed.
 */
export function isRallyFinished(
  completions: CheckpointCompletion[],
  totalCheckpoints: number
): boolean {
  return countCompleted(completions) >= totalCheckpoints
}
