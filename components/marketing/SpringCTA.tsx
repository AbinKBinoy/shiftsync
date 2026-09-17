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

  const lift = useSpring(pressed ? 0 : hovering ? -3 : 0, { stiffness: 320, damping: 20 });
  const scale = useSpring(pressed ? 0.96 : hovering ? 1.02 : 1, { stiffness: 420, damping: 22 });
  const iconShift = useSpring(hovering && !pressed ? 4 : 0, { stiffness: 320, damping: 18 });

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
