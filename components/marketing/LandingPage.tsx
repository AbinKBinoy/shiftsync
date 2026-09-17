'use client';

import Link from 'next/link';
import ScheduleMockup from './ScheduleMockup';
import SiteHeader from './SiteHeader';
import RevealOnScroll from './RevealOnScroll';
import HowItWorks from './HowItWorks';
import FeatureCard from './FeatureCard';
import SpringCTA from './SpringCTA';
import { useScrollY } from '@/lib/useScrollY';
import {
  SparkleIcon,
  SwapIcon,
  CalendarSyncIcon,
  PhoneIcon,
  ShieldIcon,
  GitHubIcon,
} from './icons';

// Edit these to credit yourself in the footer.
const BUILDER_NAME = 'Abin Kuzhuvelikalam Binoy';
const BUILDER_GITHUB_URL = 'https://github.com/AbinKBinoy';

type Feature = {
  icon: typeof SparkleIcon;
  title: string;
  body: string;
  featured?: boolean;
};

const FEATURES: Feature[] = [
  {
    icon: SparkleIcon,
    title: 'AI schedule extraction',
    body: "The hard part is done for you. Point a camera at a posted schedule and Claude Vision AI turns it into structured, editable shifts in seconds. It's built to handle messy handwriting and cluttered layouts.",
    featured: true,
  },
  {
    icon: CalendarSyncIcon,
    title: 'Calendar sync',
    body: 'Subscribe once and every new shift shows up automatically in Google Calendar, Apple Calendar, or Outlook.',
  },
  {
    icon: SwapIcon,
    title: 'Self-serve swapping',
    body: 'Drop a shift, propose a trade, or claim one that opened up, with optional lead approval built in.',
  },
  {
    icon: PhoneIcon,
    title: 'Built for mobile',
    body: 'Check shifts, request a swap, or approve one from a phone between tasks. No desktop required.',
  },
  {
    icon: ShieldIcon,
    title: 'Secure by design',
    body: "Each department's data is isolated at the database level, so one team never sees another's schedule. Team leads and members get exactly the permissions their role needs, nothing more.",
  },
];

export default function LandingPage() {
  const currentYear = new Date().getFullYear();
  const scrollY = useScrollY();

  // Foreground (text) tracks scroll 1:1, as it always would. The mockup
  // lags slightly behind — a small positive offset that grows with scroll —
  // reading as a layer sitting a little further back, the classic
  // background-moves-slower parallax construction. Deliberately not
  // gated behind a "still in hero" check: once the hero scrolls out of
  // view the offset is irrelevant anyway, so there's nothing to clean up.
  const mockupParallax = scrollY * 0.06;

  return (
    <div className="min-h-screen bg-navy-950 text-ink-100">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section
          id="hero"
          className="mx-auto max-w-6xl px-4 pt-14 pb-20 sm:px-6 sm:pt-20 sm:pb-28"
        >
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-10">
            <div>
              <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-ink-100 sm:text-5xl">
                Turn a photo of your schedule into a calendar your whole team can use
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-300">
                Snap a photo of the schedule posted at work. Claude Vision AI extracts
                every shift automatically, your team joins with an invite code, and
                dropping, trading, or claiming a shift takes one tap, so there’s no
                more group chat chaos.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <SpringCTA
                  href="/signup"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-yellow-400 px-6 py-3 text-sm font-semibold text-navy-950 shadow-lg shadow-yellow-400/10 transition-colors hover:bg-yellow-300"
                >
                  Get Started Free
                </SpringCTA>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-lg border border-navy-600 px-6 py-3 text-sm font-semibold text-ink-100 transition-all duration-250 ease-enter hover:-translate-y-0.5 hover:bg-navy-800 active:translate-y-0 active:scale-[0.97]"
                >
                  Log in
                </Link>
              </div>

              <p className="mt-4 text-sm text-ink-500">
                Free to use. No credit card required.
              </p>
            </div>

            <div style={{ transform: `translateY(${mockupParallax}px)` }}>
              <ScheduleMockup />
            </div>
          </div>
        </section>

        {/* How it works */}
        <HowItWorks />

        {/* Features */}
        <section id="features" className="border-t border-navy-800">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <RevealOnScroll className="max-w-2xl">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
                Features
              </h2>
              <p className="mt-3 text-3xl font-bold tracking-tight text-ink-100 sm:text-4xl">
                Everything a team needs to run a schedule without the busywork
              </p>
            </RevealOnScroll>

            <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {FEATURES.map((feature, i) => (
                <RevealOnScroll
                  key={feature.title}
                  delayMs={i * 80}
                  className={feature.featured ? 'sm:col-span-2' : ''}
                >
                  <FeatureCard
                    icon={feature.icon}
                    title={feature.title}
                    body={feature.body}
                    featured={feature.featured}
                  />
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="border-t border-navy-800 bg-navy-900/40">
          <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
            <RevealOnScroll>
              <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-ink-100 sm:text-4xl">
                Stop retyping schedules. Start syncing them.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-ink-300">
                Upload a photo, invite your team, and let ShiftSync handle the rest.
              </p>
              <SpringCTA
                href="/signup"
                className="mt-8 inline-flex items-center justify-center gap-1.5 rounded-lg bg-yellow-400 px-7 py-3.5 text-sm font-semibold text-navy-950 shadow-lg shadow-yellow-400/10 transition-colors hover:bg-yellow-300"
              >
                Get Started Free
              </SpringCTA>
            </RevealOnScroll>
          </div>
        </section>
      </main>

      <footer className="border-t border-navy-800">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div>
              <span className="text-base font-bold tracking-tight text-ink-100">
                Shift<span className="text-yellow-400">Sync</span>
              </span>
              <p className="mt-1 text-sm text-ink-500">
                AI-powered shift scheduling for frontline teams.
              </p>
              <p className="mt-4 text-xs text-ink-500">
                © {currentYear} ShiftSync. All rights reserved.
              </p>
            </div>

            <nav className="flex gap-5 text-sm text-ink-500 sm:justify-center">
              <Link href="/privacy" className="transition-colors hover:text-ink-300">
                Privacy Policy
              </Link>
              <Link href="/terms" className="transition-colors hover:text-ink-300">
                Terms of Service
              </Link>
            </nav>

            <div className="sm:text-right">
              <a
                href={BUILDER_GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-ink-300"
              >
                <GitHubIcon className="h-4 w-4" />
                Built by {BUILDER_NAME}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
