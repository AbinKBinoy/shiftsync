import Link from 'next/link';

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-ink-100">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-ink-300">
        {children}
      </div>
    </section>
  );
}

export default function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-navy-950 text-ink-100">
      <header className="border-b border-navy-800">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-lg font-bold tracking-tight text-ink-100">
            Shift<span className="text-yellow-400">Sync</span>
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-ink-300 transition-colors hover:text-ink-100"
          >
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-ink-100 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-ink-500">Last updated {updated}</p>

        <div className="mt-10 space-y-10">{children}</div>
      </main>

      <footer className="border-t border-navy-800">
        <div className="mx-auto max-w-3xl px-4 py-8 text-sm text-ink-500 sm:px-6">
          <Link href="/" className="hover:text-ink-300">
            ShiftSync
          </Link>
        </div>
      </footer>
    </div>
  );
}
