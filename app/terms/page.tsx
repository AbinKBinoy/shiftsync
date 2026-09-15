import LegalLayout, { Section } from '@/components/marketing/LegalLayout';

// Edit this to the address you want questions about these terms sent to.
const CONTACT_EMAIL = 'abink@uvic.ca';

export const metadata = {
  title: 'Terms of Service — ShiftSync',
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" updated="September 15, 2026">
      <p className="leading-relaxed text-ink-300">
        These are the basic terms for using ShiftSync. By creating an account,
        you agree to them.
      </p>

      <Section title="What ShiftSync is">
        <p>
          ShiftSync is a tool for teams to turn photos of posted work
          schedules into a shared calendar, and to manage shift drops,
          trades, and claims. It’s provided as-is, and we’re always working
          to improve it.
        </p>
      </Section>

      <Section title="Your account">
        <p>
          You’re responsible for the accuracy of the information you provide
          and for keeping your login credentials secure. If you sign in with
          Google, your account is tied to that Google account.
        </p>
      </Section>

      <Section title="Acceptable use">
        <p>Please don’t use ShiftSync to:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Upload photos or content you don’t have the right to share.</li>
          <li>Impersonate someone else, or misrepresent shifts that weren’t actually scheduled.</li>
          <li>Attempt to disrupt, overload, or gain unauthorized access to the service.</li>
          <li>Use the service for anything illegal or intended to harm others.</li>
        </ul>
      </Section>

      <Section title="Your content">
        <p>
          You keep ownership of the schedule photos and data you upload. By
          uploading them, you give ShiftSync permission to process and store
          that content for the purpose of running the service — for example,
          extracting shifts and displaying them to your team.
        </p>
      </Section>

      <Section title="Team data">
        <p>
          Anything you publish to a department — shifts, swaps, comments — is
          visible to other members of that department. Don’t post anything
          there you wouldn’t want your team to see.
        </p>
      </Section>

      <Section title="Availability">
        <p>
          We aim to keep ShiftSync reliable, but it’s provided without any
          guarantee of uninterrupted or error-free service. Features may
          change or be discontinued as the product evolves.
        </p>
      </Section>

      <Section title="Ending your use">
        <p>
          You can stop using ShiftSync and request account deletion at any
          time — see our{' '}
          <a href="/privacy" className="font-medium text-yellow-400 hover:text-yellow-300">
            Privacy Policy
          </a>{' '}
          for how. We may suspend or remove accounts that violate these
          terms.
        </p>
      </Section>

      <Section title="Limitation of liability">
        <p>
          ShiftSync is provided without warranties of any kind. We aren’t
          liable for scheduling errors, missed shifts, or other issues
          arising from your use of the service — always confirm important
          schedule changes with your team directly.
        </p>
      </Section>

      <Section title="Changes to these terms">
        <p>
          If these terms change in a meaningful way, we’ll update the date at
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
