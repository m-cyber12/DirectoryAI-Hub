/**
 * Titan theme state for the Infinity Gauntlet easter egg.
 *
 * v2.4 change (owner feedback): the red theme must NOT survive a refresh —
 * "refresh should bring the gold back". So the theme is now kept in a
 * module-level variable only:
 *   - client-side navigation keeps the red (the variable lives),
 *   - any full page load (refresh, new tab, direct URL) starts amber.
 * Round progress (clicked stones / snapped) lives in sessionStorage and is
 * reset on load whenever a previous round had already snapped, so a refresh
 * always begins a fresh yellow round.
 */

let red = false;

export function snapThemeActive(): boolean {
  return red;
}

/** Toggle the <html> class + in-memory flag. Returns the new state. */
export function setSnapTheme(on: boolean): boolean {
  if (typeof window === 'undefined') return on;
  red = on;
  document.documentElement.classList.toggle('theme-red', on);
  return on;
}

/** Full loads always start amber (the snap is a moment, not a setting). */
export function applyStoredSnapTheme(): boolean {
  return setSnapTheme(false);
}
