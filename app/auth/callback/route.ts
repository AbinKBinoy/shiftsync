import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Auth callback handler for both OAuth sign-in and password-reset links.
// Supabase redirects here with a `code` that we exchange for a session
// cookie; `next` says where to send the browser afterward (defaults to the
// dashboard for OAuth, but a reset link sends `next=/reset-password`).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
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
