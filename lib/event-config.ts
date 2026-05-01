/**
 * Event date configuration.
 * All checkpoint / quiz access is blocked before EVENT_START_AT.
 */

/** Rally opens at midnight JST on June 20, 2026. */
export const EVENT_START_AT = new Date('2026-06-20T00:00:00+09:00')

export function isRallyOpen(): boolean {
  return Date.now() >= EVENT_START_AT.getTime()
}
