'use client';

import { useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { SparkleIcon } from './icons';
import { useSpring } from '@/lib/useSpring';
import { prefersReducedMotion } from '@/lib/motion';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type Block = {
  day: number;
  row: number;
  span: number;
  label: string;
  time: string;
  tone: 'yellow' | 'blue' | 'outline';
};

const BLOCKS: Block[] = [
  { day: 0, row: 1, span: 2, label: 'J. Rivera', time: '9a–2p', tone: 'yellow' },
  { day: 1, row: 2, span: 2, label: 'M. Chen', time: '11a–4p', tone: 'blue' },
  { day: 2, row: 1, span: 1, label: 'You', time: '8a–12p', tone: 'yellow' },
  { day: 3, row: 3, span: 2, label: 'D. Osei', time: '2p–8p', tone: 'blue' },
  { day: 4, row: 1, span: 2, label: 'You', time: '9a–3p', tone: 'yellow' },
  { day: 5, row: 2, span: 1, label: 'Open', time: '4p–9p', tone: 'outline' },
];

const toneClasses: Record<Block['tone'], string> = {
  yellow: 'bg-yellow-400 text-navy-950 border-yellow-500/40',
  blue: 'bg-navy-700 text-ink-100 border-navy-600',
  outline: 'border-dashed border-ink-500/50 text-ink-500 bg-transparent',
};

// Global reveal order the blocks "build themselves" in each time the card
// enters — left-to-right, matching BLOCKS' own day order. Independent of
// each day column's local filtered index below.
const BLOCK_DELAYS = new Map(BLOCKS.map((_, i) => [i, 120 + i * 90]));

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export default function ScheduleMockup() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotionRef = useRef(false);

  const [visible, setVisible] = useState(false);
  // Bumped every time the card re-enters the viewport, so keying the block
  // grid on it forces a fresh mount and replays the CSS stagger — the same
  // "remount to replay" pattern CalendarGrid uses for its week transitions.
  const [replayKey, setReplayKey] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [tiltTarget, setTiltTarget] = useState({ x: 0, y: 0 });

  useEffect(() => {
    reducedMotionRef.current = prefersReducedMotion();
  }, []);

  // Re-triggerable by design (unlike RevealOnScroll, which fires once and
  // disconnects): toggles both ways, so scrolling back up past the hero and
  // back down replays the entrance instead of leaving it permanently settled.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setReplayKey((k) => k + 1);
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Critically damped (damping = 2*sqrt(stiffness)) — a scroll-triggered
  // reveal carries no gesture momentum, so per Apple's fluid-interface
  // guidance it should settle smoothly with no overshoot, not bounce.
  // Because it's a spring, scrolling back and forth rapidly still just
  // redirects the existing motion instead of restarting or glitching.
  const enter = useSpring(visible ? 1 : 0, { stiffness: 120, damping: 22 });
  // Underdamped on purpose: this is the one continuously gesture-driven
  // value on the card (tracks the cursor), matching Apple's documented
  // "Rotation" spring (damping ratio ~0.8 — bounce earned by real pointer
  // input, unlike the discrete state changes above).
  const tiltX = useSpring(tiltTarget.x, { stiffness: 150, damping: 20 });
  const tiltY = useSpring(tiltTarget.y, { stiffness: 150, damping: 20 });
  const hoverScale = useSpring(hovering ? 1.015 : 1, { stiffness: 150, damping: 25 });

  function handleMouseMove(e: ReactMouseEvent<HTMLDivElement>) {
    if (reducedMotionRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    // Tilt the far edge from the cursor back and the near edge up, like the
    // card is a physical card being tipped toward the pointer.
    setTiltTarget({ x: py * -10, y: px * 12 });
  }

  function handleMouseEnter() {
    if (!reducedMotionRef.current) setHovering(true);
  }

  function handleMouseLeave() {
    setHovering(false);
    setTiltTarget({ x: 0, y: 0 });
  }

  const cardOpacity = clamp(enter, 0, 1);
  const cardTranslateY = (1 - enter) * 24;
  const cardScale = (0.94 + clamp(enter, 0, 1.2) * 0.06) * hoverScale;
  // Trails the card: only starts appearing once the card is half revealed,
  // so it reads as a follow-up detail rather than arriving simultaneously.
  const badgeOpacity = clamp((enter - 0.5) * 2, 0, 1);

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ perspective: '1200px' }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="absolute -top-4 right-6 z-10 flex items-center gap-1.5 rounded-full border border-yellow-500/30 bg-navy-900 px-3 py-1.5 text-xs font-medium text-yellow-300 shadow-lg shadow-black/30"
        style={{
          opacity: badgeOpacity,
          transform: `translateY(${(1 - clamp(badgeOpacity, 0, 1)) * 8}px)`,
        }}
      >
        <SparkleIcon className="h-3.5 w-3.5" />
        Extracted from a photo in seconds
      </div>

      <div
        className="rounded-2xl border border-navy-700 bg-navy-900 p-4 shadow-2xl shadow-black/40 sm:p-6"
        style={{
          opacity: cardOpacity,
          transform: `translateY(${cardTranslateY}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${cardScale})`,
          transformStyle: 'preserve-3d',
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-ink-100">This week</span>
            <span className="text-xs text-ink-500">Mar 9 – Mar 15</span>
          </div>
          <div className="flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-navy-600" />
            <span className="h-2 w-2 rounded-full bg-navy-600" />
            <span className="h-2 w-2 rounded-full bg-yellow-400" />
          </div>
        </div>

        <div key={replayKey} className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {DAYS.map((day) => (
            <div
              key={day}
              className="text-center text-[10px] font-medium uppercase tracking-wide text-ink-500 sm:text-xs"
            >
              {day}
            </div>
          ))}

          {DAYS.map((_, dayIndex) => (
            <div
              key={dayIndex}
              className="grid grid-rows-4 gap-1.5 rounded-lg bg-navy-950/60 p-1 sm:gap-2 sm:p-1.5"
              style={{ minHeight: '9.5rem' }}
            >
              {BLOCKS.map((b, globalIndex) => ({ b, globalIndex }))
                .filter(({ b }) => b.day === dayIndex)
                .map(({ b, globalIndex }) => (
                  <div
                    key={globalIndex}
                    className={`animate-block-in flex flex-col justify-center rounded-md border px-1.5 py-1 text-[9px] leading-tight font-medium sm:text-[11px] ${toneClasses[b.tone]}`}
                    style={{
                      gridRow: `${b.row} / span ${b.span}`,
                      animationDelay: `${BLOCK_DELAYS.get(globalIndex)}ms`,
                    }}
                  >
                    <span className="truncate">{b.label}</span>
                    <span className="truncate opacity-80">{b.time}</span>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
