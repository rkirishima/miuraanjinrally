import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Participant } from '@/types/database'

// ---------- constants ----------
const SESSION_COOKIE = 'anjin_session'
const COOKIE_MAX_AGE = 60 * 60 * 48 // 48 hours in seconds
const PIN_SALT = 'anjin2026'

// ---------- hashing ----------

/**
 * Hashes a plain-text PIN using SHA-256 with a fixed salt.
 * Works in both Node.js (via globalThis.crypto) and the browser.
 */
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(`${PIN_SALT}:${pin}`)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Returns true when the given plain-text PIN matches the stored hash.
 */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  const computed = await hashPin(pin)
  return computed === hash
}

// ---------- login / logout ----------

/**
 * Looks up the rider by rider_number, verifies the PIN, and returns the
 * participant row (without pin_hash).  Throws a localised error on failure.
 */
export async function loginWithPin(
  riderNumber: string,
  pin: string
): Promise<Omit<Participant, 'pin_hash'>> {
  const adminClient = createAdminClient()

  const { data: participant, error } = await adminClient
    .from('participants')
    .select('*')
    .eq('rider_number', riderNumber.trim().toUpperCase())
    .single()

  if (error || !participant) {
    throw new Error('ライダーが見つかりません')
  }

  const valid = await verifyPin(pin, participant.pin_hash)
  if (!valid) {
    throw new Error('PINが正しくありません')
  }

  // Record started_at on first login
  if (!participant.started_at) {
    await adminClient
      .from('participants')
      .update({ started_at: new Date().toISOString() })
      .eq('id', participant.id)
  }

  // Return row without the sensitive hash
  const { pin_hash: _omit, ...safeParticipant } = participant
  return safeParticipant
}

/**
 * Writes the session cookie.  Call from a Route Handler (POST /api/auth/login).
 * Also writes the anjin_admin cookie when isAdmin is true (read by middleware for
 * quick edge-level admin guard without a DB round-trip).
 */
export function setSessionCookie(participantId: string, isAdmin = false): void {
  const cookieStore = cookies()
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  }
  cookieStore.set(SESSION_COOKIE, participantId, cookieOpts)
  // Always write the admin cookie so middleware can read it.
  // Use httpOnly:false so middleware (edge runtime) can still read it,
  // but it carries no sensitive data — just a boolean hint.
  cookieStore.set('anjin_admin', isAdmin ? 'true' : '', {
    ...cookieOpts,
    httpOnly: false,
    maxAge: isAdmin ? COOKIE_MAX_AGE : 0,
  })
}

/**
 * Clears the session cookie.  Call from a Route Handler (POST /api/auth/logout).
 */
export function clearSessionCookie(): void {
  const cookieStore = cookies()
  cookieStore.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

// ---------- session reading ----------

/**
 * Returns the participant ID stored in the session cookie, or null if absent.
 */
export function getSessionParticipantId(): string | null {
  const cookieStore = cookies()
  return cookieStore.get(SESSION_COOKIE)?.value ?? null
}

/**
 * Fetches the full participant row for the current session.
 * Returns null when not logged in or when the row is not found.
 */
export async function getCurrentParticipant(): Promise<Omit<Participant, 'pin_hash'> | null> {
  const participantId = getSessionParticipantId()
  if (!participantId) return null

  const adminClient = createAdminClient()
  const { data: participant, error } = await adminClient
    .from('participants')
    .select('*')
    .eq('id', participantId)
    .single()

  if (error || !participant) return null
  const { pin_hash: _omit, ...safeParticipant } = participant
  return safeParticipant
}

/**
 * Convenience helper — throws a 401-style error when no session exists.
 */
export async function requireSession(): Promise<Omit<Participant, 'pin_hash'>> {
  const participant = await getCurrentParticipant()
  if (!participant) {
    throw new Error('ログインが必要です')
  }
  return participant
}

/**
 * Returns true when the current session belongs to an admin.
 */
export async function isAdminSession(): Promise<boolean> {
  const participant = await getCurrentParticipant()
  return participant?.is_admin ?? false
}
