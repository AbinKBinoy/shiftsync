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

// Shared press-feedback treatment for any pressable element — instant
// scale-down on :active confirming the interface heard the tap. 0.97 matches
// the value `animate`'s own reference examples use throughout, and duration
// mirrors MOTION_MS.fast above (kept as a literal, not interpolated, so
// Tailwind's static class scanner can see it). Previously hand-retyped
// independently across 8+ components with drifting scale values
// (0.95/0.97/0.98) and inconsistent `transition-all`/`transition-transform`
// scoping — this is the one canonical string all of them should share.
export const PRESS = 'transition-all duration-150 active:scale-[0.97]';

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
