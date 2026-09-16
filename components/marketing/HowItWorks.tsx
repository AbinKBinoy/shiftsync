'use client';

import { useEffect, useRef, useState } from 'react';
import RevealOnScroll from './RevealOnScroll';
import { UploadIcon, SparkleIcon, UsersIcon, SwapIcon } from './icons';

type StepIconType = typeof UploadIcon;

const STEPS: Array<{ icon: StepIconType; title: string; body: string }> = [
  {
    icon: UploadIcon,
    title: 'Upload a photo',
    body: "Snap a picture of the schedule posted at work, whether it's a whiteboard, a printout, or a spreadsheet on a monitor. Any of it works.",
  },
  {
    icon: SparkleIcon,
    title: 'AI reads every shift',
    body: "Claude Vision AI extracts each name, date, and time from the photo automatically, so there's no manual retyping of a schedule that already exists.",
  },
  {
    icon: UsersIcon,
    title: 'Your team joins in',
    body: 'Teammates join with a single invite code and instantly see the shifts that belong to them on a shared calendar.',
  },
  {
    icon: SwapIcon,
    title: 'Drop, trade, or claim',
    body: "Need coverage? Post the shift, trade with a teammate, or claim an open one. It's all tracked in one place, no group chat required.",
  },
];

function StepCard({
  icon: Icon,
  title,
  body,
  index,
  active,
  isLast,
}: {
  icon: StepIconType;
  title: string;
  body: string;
  index: number;
  active: boolean;
  isLast: boolean;
}) {
  return (
    <div
      className={`relative transition-all duration-500 ease-out ${
        active ? 'scale-105 opacity-100' : 'scale-95 opacity-40'
      }`}
    >
      {!isLast && (
        <div
          className="pointer-events-none absolute top-6 left-full w-8 border-t border-dashed border-navy-600"
          aria-hidden="true"
        />
      )}
      <div className="flex items-center gap-3">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-all duration-500 ${
            active
              ? 'border-yellow-400/60 bg-yellow-400/10 text-yellow-300 shadow-[0_0_24px_rgba(255,209,0,0.18)]'
              : 'border-navy-700 bg-navy-800 text-ink-500'
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <span
          className={`text-sm font-semibold transition-colors duration-500 ${
            active ? 'text-yellow-300' : 'text-ink-500'
          }`}
        >
          Step {index + 1}
        </span>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-ink-100">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-300">{body}</p>
    </div>
  );
}

export default function HowItWorks() {
  const [activeIndex, setActiveIndex] = useState(0);
  const sentinelRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Each sentinel occupies one full-viewport slice of the tall scroll
    // container. A -50% root margin on all sides shrinks the observer's
    // root to a single line at the vertical center of the viewport, so
    // whichever sentinel currently crosses that line is the active step.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-step-index'));
            if (!Number.isNaN(index)) setActiveIndex(index);
          }
        }
      },
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 }
    );

    for (const el of sentinelRefs.current) {
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="how-it-works" className="border-t border-navy-800 bg-navy-900/40">
      {/* Desktop, motion-safe: pinned scroll-driven steps */}
      <div
        className="relative hidden lg:motion-safe:block"
        style={{ height: `${STEPS.length * 100}vh` }}
      >
        {STEPS.map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              sentinelRefs.current[i] = el;
            }}
            data-step-index={i}
            className="absolute inset-x-0"
            style={{ top: `${i * 100}vh`, height: '100vh' }}
            aria-hidden="true"
          />
        ))}

        <div className="sticky top-16 flex h-[calc(100vh-4rem)] items-center overflow-hidden">
          <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
            <div className="max-w-2xl">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
                How it works
              </h2>
              <p className="mt-3 text-3xl font-bold tracking-tight text-ink-100 sm:text-4xl">
                From a photo on a wall to a schedule everyone can trust
              </p>
            </div>

            <div className="mt-16 grid grid-cols-4 gap-8">
              {STEPS.map((step, i) => (
                <StepCard
                  key={step.title}
                  icon={step.icon}
                  title={step.title}
                  body={step.body}
                  index={i}
                  active={i === activeIndex}
                  isLast={i === STEPS.length - 1}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile, or reduced motion: normal stacked reveal, no pinning */}
      <div className="block lg:motion-safe:hidden">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <RevealOnScroll className="max-w-2xl">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
              How it works
            </h2>
            <p className="mt-3 text-3xl font-bold tracking-tight text-ink-100 sm:text-4xl">
              From a photo on a wall to a schedule everyone can trust
            </p>
          </RevealOnScroll>

          <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <RevealOnScroll key={step.title} delayMs={i * 80} className="relative">
                  {i < STEPS.length - 1 && (
                    <div
                      className="pointer-events-none absolute top-6 left-full hidden w-8 border-t border-dashed border-navy-600 lg:block"
                      aria-hidden="true"
                    />
                  )}
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-navy-700 bg-navy-800 text-yellow-400">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-semibold text-ink-500">
                      Step {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-ink-100">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-300">
                    {step.body}
                  </p>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
