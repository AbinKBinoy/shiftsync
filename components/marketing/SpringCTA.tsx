'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSpring } from '@/lib/useSpring';
import { ChevronRightIcon } from './icons';

// The two primary "Get Started Free" CTAs are the highest-attention
// interactive elements on the page, so they get real spring physics for
// their lift/press motion rather than a CSS transition — the spring's
// carried velocity is what makes rapid hover-in/hover-out or a fast
// click-and-drag-off feel continuous instead of restarting each time.
export default function SpringCTA({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: React.ReactNode;
}) {
  const [hovering, setHovering] = useState(false);
  const [pressed, setPressed] = useState(false);

  // Critically damped (damping = 2*sqrt(stiffness)): hover/press is a
  // discrete UI state, not a gesture carrying momentum, so per Apple's
  // fluid-interface guidance it settles cleanly with no bounce — the
  // spring is still doing real work here (continuous, interruptible,
  // starts from the current on-screen value), just without overshoot.
  const lift = useSpring(pressed ? 0 : hovering ? -3 : 0, { stiffness: 320, damping: 36 });
  const scale = useSpring(pressed ? 0.96 : hovering ? 1.02 : 1, { stiffness: 420, damping: 41 });
  const iconShift = useSpring(hovering && !pressed ? 4 : 0, { stiffness: 320, damping: 36 });

  return (
    <Link
      href={href}
      className={className}
      style={{ transform: `translateY(${lift}px) scale(${scale})` }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => {
        setHovering(false);
        setPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
    >
      {children}
      <span className="inline-flex" style={{ transform: `translateX(${iconShift}px)` }}>
        <ChevronRightIcon className="h-4 w-4" />
      </span>
    </Link>
  );
}
