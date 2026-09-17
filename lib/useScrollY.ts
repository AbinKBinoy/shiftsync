'use client';

import { useEffect, useState } from 'react';

// rAF-throttled scroll position, shared by anything that needs to read
// scroll continuously — parallax offsets, scroll-scrubbed transforms —
// rather than react to discrete enter/exit events like IntersectionObserver.
// Deliberately not spring-smoothed: parallax should track scroll 1:1 (Apple's
// "direct manipulation" principle — content follows the input source
// exactly), unlike cursor-driven motion, which benefits from a spring's lag.
export function useScrollY(): number {
  // Starts at 0 to match the server-rendered value exactly (no window on
  // the server, so anything else would be a hydration mismatch); the
  // effect below reconciles it with the real position within one frame.
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;

    function update() {
      setScrollY(window.scrollY);
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    // Reconciles with the real scroll position once on mount — deferred
    // through the same rAF callback as every other update, rather than a
    // direct setState call in the effect body.
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return scrollY;
}
