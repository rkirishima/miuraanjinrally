/**
 * Registration window configuration.
 *
 * REGISTRATION_OPEN_AT  — first moment riders can sign up (JST midnight, May 1).
 * EVENT_DATE            — event day (used for display only).
 *
 * Change these dates here; every gate (LP, register page, API) reads from here.
 */

/** 2026-05-01 00:00:00 JST  (= 2026-04-30 15:00:00 UTC) */
export const REGISTRATION_OPEN_AT = new Date('2026-05-01T00:00:00+09:00')

export const EVENT_DATE = new Date('2026-06-20T09:00:00+09:00')

/** Returns true when registration is currently open. */
export function isRegistrationOpen(): boolean {
  return new Date() >= REGISTRATION_OPEN_AT
}

/** Returns remaining ms until registration opens (0 when already open). */
export function msUntilOpen(): number {
  return Math.max(0, REGISTRATION_OPEN_AT.getTime() - Date.now())
}
