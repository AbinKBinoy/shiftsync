import Link from 'next/link';
import ScheduleMockup from './ScheduleMockup';
import SiteHeader from './SiteHeader';
import RevealOnScroll from './RevealOnScroll';
import {
  UploadIcon,
  SparkleIcon,
  UsersIcon,
  SwapIcon,
  CalendarSyncIcon,
  PhoneIcon,
  ChevronRightIcon,
} from './icons';

// Edit this to credit yourself in the footer.
const BUILDER_NAME = 'Your Name';

const STEPS = [
  {
    icon: UploadIcon,
    title: 'Upload a photo',
    body: 'Snap a picture of the schedule posted at work — a whiteboard, a printout, a spreadsheet on a monitor. Any of it works.',
  },
  {
    icon: SparkleIcon,
    title: 'AI reads every shift',
    body: 'Claude Vision AI extracts each name, date, and time from the photo automatically — no manual retyping of a schedule that already exists.',
  },
  {
    icon: UsersIcon,
    title: 'Your team joins in',
    body: 'Teammates join with a single invite code and instantly see the shifts that belong to them on a shared calendar.',
  },
  {
    icon: SwapIcon,
    title: 'Drop, trade, or claim',
    body: 'Need coverage? Post the shift, trade with a teammate, or claim an open one — all tracked in one place, no group chat required.',
  },
] as const;

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
    body: 'The hard part is done for you. Point a camera at a posted schedule and Claude Vision AI turns it into structured, editable shifts in seconds — built to handle messy handwriting and cluttered layouts.',
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
    body: 'Drop a shift, propose a trade, or claim one that opened up — with optional lead approval built in.',
  },
  {
    icon: PhoneIcon,
    title: 'Built for mobile',
    body: 'Check shifts, request a swap, or approve one from a phone between tasks — no desktop required.',
  },
];

export default function LandingPage() {
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
                dropping, trading, or claiming a shift takes one tap — no more group
                chat chaos.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-yellow-400 px-6 py-3 text-sm font-semibold text-navy-950 shadow-lg shadow-yellow-400/10 transition-all duration-150 hover:-translate-y-0.5 hover:bg-yellow-300 active:translate-y-0 active:scale-[0.97]"
                >
                  Get Started Free
                  <ChevronRightIcon className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-lg border border-navy-600 px-6 py-3 text-sm font-semibold text-ink-100 transition-all duration-150 hover:-translate-y-0.5 hover:bg-navy-800 active:translate-y-0 active:scale-[0.97]"
                >
                  Log in
                </Link>
              </div>

              <p className="mt-4 text-sm text-ink-500">
                Free to use. No credit card required.
              </p>
            </div>

            <ScheduleMockup />
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="border-t border-navy-800 bg-navy-900/40">
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
        </section>

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
              {FEATURES.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <RevealOnScroll
                    key={feature.title}
                    delayMs={i * 80}
                    className={feature.featured ? 'sm:col-span-2' : ''}
                  >
                    <div className="h-full rounded-2xl border border-navy-700 bg-navy-900 p-7 transition-all duration-200 hover:-translate-y-1 hover:border-navy-600 hover:shadow-lg hover:shadow-black/20 sm:p-9">
                      <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-navy-700 bg-navy-800 text-yellow-400">
                        <Icon className="h-5 w-5" />
                      </span>
                      <h3 className="mt-5 text-xl font-semibold text-ink-100">
                        {feature.title}
                      </h3>
                      <p
                        className={`mt-2 text-sm leading-relaxed text-ink-300 ${
                          feature.featured ? 'max-w-2xl' : ''
                        }`}
                      >
                        {feature.body}
                      </p>
                    </div>
                  </RevealOnScroll>
                );
              })}
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
              <Link
                href="/signup"
                className="mt-8 inline-flex items-center justify-center gap-1.5 rounded-lg bg-yellow-400 px-7 py-3.5 text-sm font-semibold text-navy-950 shadow-lg shadow-yellow-400/10 transition-all duration-150 hover:-translate-y-0.5 hover:bg-yellow-300 active:translate-y-0 active:scale-[0.97]"
              >
                Get Started Free
                <ChevronRightIcon className="h-4 w-4" />
              </Link>
            </RevealOnScroll>
          </div>
        </section>
      </main>

      <footer className="border-t border-navy-800">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <span className="text-base font-bold tracking-tight text-ink-100">
                Shift<span className="text-yellow-400">Sync</span>
              </span>
              <p className="mt-1 text-sm text-ink-500">
                AI-powered shift scheduling for frontline teams.
              </p>
            </div>

            <nav className="flex items-center gap-5 text-sm text-ink-500">
              <Link href="/privacy" className="transition-colors hover:text-ink-300">
                Privacy Policy
              </Link>
              <Link href="/terms" className="transition-colors hover:text-ink-300">
                Terms of Service
              </Link>
            </nav>

            <p className="text-sm text-ink-500">Built by {BUILDER_NAME}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
