import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

// Auth callback handler for OAuth sign-in, and for password-reset (and other
// OTP) links.
//
// Password-reset links are handled via `token_hash` + `type=recovery`
// (verifyOtp), NOT via Supabase's redirect_to/Site URL hop. That hop is
// unreliable in production: if the redirectTo we pass to
// resetPasswordForEmail doesn't exactly match an allow-listed Redirect URL in
// the Supabase dashboard, Supabase silently swaps it for the project's Site
// URL instead — no error, no warning. That drops our `?next=/reset-password`
// entirely, the link lands back here with only `?code=...`, `next` falls
// back to its '/dashboard' default, and a password-reset click quietly signs
// the user straight into the app instead of prompting them to set a new
// password. token_hash/type travel as plain query params on a link we build
// ourselves in the "Reset Password" email template (using
// `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`
// instead of `{{ .ConfirmationURL }}`), so they never pass through that
// redirect step and can't be swapped out.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/dashboard';

  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    });

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // A password-reset link's tokens can also arrive in the URL fragment
  // instead of a `code` — fragments never reach the server, so there's
  // nothing here to exchange. Forward to the requested page anyway (the
  // fragment carries over on redirect) and let the client-side page, which
  // can see the fragment, decide whether it ended up with a usable session.
  if (next !== '/dashboard') {
    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login`);
}
