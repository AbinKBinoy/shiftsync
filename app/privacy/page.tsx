import LegalLayout, { Section } from '@/components/marketing/LegalLayout';

// Edit this to the address you want account-deletion and privacy requests sent to.
const CONTACT_EMAIL = 'abink@uvic.ca';

export const metadata = {
  title: 'Privacy Policy — ShiftSync',
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="September 15, 2026">
      <p className="leading-relaxed text-ink-300">
        This page explains what ShiftSync collects, why, and how you can get your
        data removed. We’ve tried to write it the way we’d want to read it
        ourselves — plainly, and without legal padding.
      </p>

      <Section title="What we collect">
        <p>When you use ShiftSync, we collect:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <span className="text-ink-100">Your name and email address</span> —
            from signup, or from your Google account if you sign in with Google.
          </li>
          <li>
            <span className="text-ink-100">Shift schedule data</span> — the
            names, dates, and times extracted from photos of posted schedules
            that you or a teammate upload.
          </li>
          <li>
            <span className="text-ink-100">The schedule photos themselves</span>{' '}
            — stored so a schedule can be reviewed or corrected after upload.
          </li>
          <li>
            <span className="text-ink-100">Department and activity data</span> —
            which team you belong to, and records of shift drops, trades, and
            claims so your team’s schedule stays accurate.
          </li>
        </ul>
      </Section>

      <Section title="How we use it">
        <p>We use this information to:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Build and maintain your team’s shared shift calendar.</li>
          <li>
            Sync your shifts to external calendars — Google Calendar, Apple
            Calendar, or Outlook — if you choose to subscribe.
          </li>
          <li>
            Send you notifications about schedule changes, swap requests, and
            approvals.
          </li>
          <li>Keep your account secure and your team’s data separated from other teams’.</li>
        </ul>
      </Section>

      <Section title="How schedule photos are processed">
        <p>
          When you upload a photo of a posted schedule, it’s sent to{' '}
          <span className="text-ink-100">Anthropic’s Claude API</span>, which
          reads the image and extracts the shifts on it — names, dates, and
          times — into a structured list you can review before it’s published
          to your team. The photo is used only to extract this schedule data;
          it isn’t used to train AI models or for any other purpose.
        </p>
      </Section>

      <Section title="Where your data lives">
        <p>
          ShiftSync stores account and schedule data with{' '}
          <span className="text-ink-100">Supabase</span>, which provides our
          database, file storage, and login system. Access to your team’s data
          is restricted at the database level so that only members of your
          department can see it.
        </p>
      </Section>

      <Section title="We don’t sell your data">
        <p>
          ShiftSync does not sell or rent your personal information to anyone.
          We only share data with the service providers that make the app
          work — Supabase for storage, Anthropic for reading schedule photos,
          and Resend for sending transactional emails (like password resets)
          — and only to the extent needed to provide the service. Within your
          team, your name and shifts are visible to your teammates, since
          that’s the point of a shared schedule.
        </p>
      </Section>

      <Section title="Deleting your account">
        <p>
          You can ask us to delete your account and personal data at any time
          by emailing{' '}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-medium text-yellow-400 hover:text-yellow-300"
          >
            {CONTACT_EMAIL}
          </a>
          . We’ll remove your profile, uploaded schedule photos, and personal
          data within a reasonable time, except where a record needs to be
          kept briefly for security or legal reasons.
        </p>
      </Section>

      <Section title="Changes to this policy">
        <p>
          If this policy changes in a meaningful way, we’ll update the date at
          the top of this page.
        </p>
      </Section>

      <Section title="Questions">
        <p>
          Reach out any time at{' '}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-medium text-yellow-400 hover:text-yellow-300"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </Section>
    </LegalLayout>
  );
}
