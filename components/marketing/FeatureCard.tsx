'use client';

import { useRef } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import type { SVGProps } from 'react';

// The glow position is written straight to the DOM via a ref on every
// mousemove instead of through React state — a card can report dozens of
// these a second while the cursor crosses it, and routing that through
// setState would mean a full React re-render per pixel of movement for
// something that only ever affects one CSS custom property.
export default function FeatureCard({
  icon: Icon,
  title,
  body,
  featured,
}: {
  icon: (props: SVGProps<SVGSVGElement>) => React.ReactElement;
  title: string;
  body: string;
  featured?: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: ReactMouseEvent<HTMLDivElement>) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    cardRef.current?.style.setProperty('--mx', `${x}%`);
    cardRef.current?.style.setProperty('--my', `${y}%`);
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`group relative h-full overflow-hidden rounded-2xl border p-7 transition-[transform,border-color,box-shadow] duration-250 ease-enter hover:-translate-y-1.5 hover:shadow-lg hover:shadow-black/20 sm:p-9 ${
        featured
          ? 'border-yellow-500/20 bg-navy-900 hover:border-yellow-500/30'
          : 'border-navy-700 bg-navy-900 hover:border-navy-600'
      }`}
    >
      {/* The flagship feature gets a permanent, subtle wash instead of only
          a hover glow — a lighter/warmer material calling out the primary
          card, distinct from the neutral treatment on every other one. */}
      {featured && (
        <div
          className="pointer-events-none absolute inset-0 opacity-100"
          style={{
            background:
              'radial-gradient(circle at 15% 0%, rgba(255,209,0,0.06), transparent 55%)',
          }}
          aria-hidden="true"
        />
      )}

      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-250 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(255,209,0,0.08), transparent 60%)',
        }}
        aria-hidden="true"
      />

      <div className="relative">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-navy-700 bg-navy-800 text-yellow-400">
          <Icon className="h-5 w-5" />
        </span>
        <h3 className="mt-5 text-xl font-semibold text-ink-100">{title}</h3>
        <p className={`mt-2 text-sm leading-relaxed text-ink-300 ${featured ? 'max-w-2xl' : ''}`}>
          {body}
        </p>
      </div>
    </div>
  );
}
