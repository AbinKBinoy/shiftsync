'use client';

import { useEffect, useRef, useState } from 'react';
import RevealOnScroll from './RevealOnScroll';
import { useScrollY } from '@/lib/useScrollY';
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function StepCard({
  icon: Icon,
  title,
  body,
  index,
  closeness,
  isLast,
}: {
  icon: StepIconType;
  title: string;
  body: string;
  index: number;
  // Continuous 0..1: 1 when this step is exactly centered in the scroll
  // range, fading smoothly to 0 a full step-width away in either
  // direction — driven directly by scroll position every frame, not a
  // threshold that snaps and leaves dead zones in between.
  closeness: number;
  isLast: boolean;
}) {
  const active = closeness > 0.5;
  const opacity = 0.4 + closeness * 0.6;
  const scale = 0.95 + closeness * 0.1;

  return (
    <div
      className="relative"
      style={{ opacity, transform: `scale(${scale})` }}
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
  const sectionRef = useRef<HTMLDivElement>(null);
  const scrollY = useScrollY();
  const [bounds, setBounds] = useState({ top: 0, height: 0 });
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    function measure() {
      const el = sectionRef.current;
      if (el) setBounds({ top: el.offsetTop, height: el.offsetHeight });
      setViewportHeight(window.innerHeight);
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // 0..STEPS.length, continuous — how far through the pinned scroll range
  // we are, in fractional "steps". Recomputed every scroll frame (via
  // useScrollY's rAF throttling), so there's no dead zone: every pixel of
  // scroll moves this by some amount, unlike the old IntersectionObserver
  // threshold that only updated at four fixed crossing points.
  const scrollableRange = Math.max(bounds.height - viewportHeight, 1);
  const rawProgress = clamp((scrollY - bounds.top) / scrollableRange, 0, 1);
  const stepProgress = rawProgress * STEPS.length;

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="border-t border-navy-800 bg-navy-900/40"
    >
      {/* Desktop, motion-safe: pinned scroll-driven steps */}
      <div
        className="relative hidden lg:motion-safe:block"
        style={{ height: `${STEPS.length * 100}vh` }}
      >
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
              {STEPS.map((step, i) => {
                const closeness = clamp(1 - Math.abs(stepProgress - (i + 0.5)), 0, 1);
                return (
                  <StepCard
                    key={step.title}
                    icon={step.icon}
                    title={step.title}
                    body={step.body}
                    index={i}
                    closeness={closeness}
                    isLast={i === STEPS.length - 1}
                  />
                );
              })}
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
