'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const hero = document.getElementById('hero');
    if (!hero) return;

    // Flips once the hero section has scrolled out from under the sticky
    // header, rather than at an arbitrary pixel offset.
    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { rootMargin: '-64px 0px 0px 0px', threshold: 0 }
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-colors duration-300 backdrop-blur-sm ${
        scrolled
          ? 'border-navy-800 bg-navy-950/85'
          : 'border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <span className="text-lg font-bold tracking-tight text-ink-100">
          Shift<span className="text-yellow-400">Sync</span>
        </span>

        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-sm font-medium text-ink-300 transition-colors hover:text-ink-100 sm:px-4"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-yellow-400 px-3 py-2 text-sm font-semibold text-navy-950 transition-all duration-150 hover:bg-yellow-300 active:scale-95 sm:px-4"
          >
            Sign up
          </Link>
        </nav>
      </div>
    </header>
  );
}
