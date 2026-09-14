import { Resend } from 'resend';

const FROM_ADDRESS = 'ShiftSync <noreply@shiftsync.win>';
const APP_URL = 'https://shiftsync.win';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Built lazily rather than at module load: a missing RESEND_API_KEY should
// only break the one thing that needs it, not throw on import for every
// route that pulls in this module.
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  return apiKey ? new Resend(apiKey) : null;
}

// Fire-and-forget by design: callers should already be wrapping this in a
// try/catch, since a shift claim must succeed even if the notification
// email doesn't send. This function also swallows Resend's own reported
// errors internally (the SDK returns { error } rather than throwing for
// most API-level failures), so a caller's try/catch is a second layer, not
// the only one.
export async function sendShiftClaimNotification({
  teamLeadEmails,
  departmentName,
  employeeName,
  requesterName,
}: {
  teamLeadEmails: string[];
  departmentName: string;
  employeeName: string;
  requesterName: string;
}): Promise<void> {
  if (teamLeadEmails.length === 0) {
    console.warn(
      'sendShiftClaimNotification: no team lead emails to notify — skipping send.'
    );
    return;
  }

  const resend = getResendClient();
  if (!resend) {
    console.error(
      'RESEND_API_KEY is not set — skipping shift claim notification email.'
    );
    return;
  }

  const html = `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #18181b;">
      <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 16px;">New shift claim</h1>
      <p style="font-size: 14px; line-height: 1.6; color: #52525b; margin: 0 0 12px;">
        <strong>${escapeHtml(requesterName)}</strong> has asked to be linked to
        <strong>${escapeHtml(employeeName)}</strong>'s shifts in
        <strong>${escapeHtml(departmentName)}</strong>.
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #52525b; margin: 0 0 24px;">
        Review and approve it from the Link Names page.
      </p>
      <a href="${APP_URL}/link-names"
         style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 500; padding: 10px 20px; border-radius: 8px;">
        Review claim
      </a>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: teamLeadEmails,
    subject: 'New shift claim waiting for approval — ShiftSync',
    html,
  });

  if (error) {
    console.error('Resend failed to send shift claim notification:', error);
  }
}
