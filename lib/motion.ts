// Mirrors the shared duration convention documented in app/globals.css
// (Tailwind's duration-150/250/400 used consistently instead of ad-hoc
// values — there's no --duration-* theme namespace to generate matching
// named utilities from, unlike --color-*/--ease-*, so this object is the
// single source of truth for the JS side instead). Anything that needs to
// time a JS-driven unmount (an exit-animation delay before removing a
// conditionally-rendered element) reads from this instead of a magic number.
export const MOTION_MS = {
  fast: 150,
  base: 250,
  slow: 400,
} as const;

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// How long to wait before unmounting an element that's mid exit-animation.
// The global prefers-reduced-motion override in globals.css already
// collapses the CSS transition itself to near-zero, but a JS setTimeout
// doesn't know that on its own — without this, a reduced-motion user would
// have the element sit invisible-but-still-mounted (and focusable) for the
// full delay after it visually vanishes.
export function exitAnimationDelay(ms: number): number {
  return prefersReducedMotion() ? 0 : ms;
}
