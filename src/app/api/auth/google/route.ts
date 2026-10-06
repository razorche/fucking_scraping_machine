import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { DEFAULT_GMAIL_SCOPES } from "@/lib/gmail/scopes";

/**
 * Starts Google OAuth 2.0 authorization (PKCE/state wired in Pass 0018).
 */
export async function GET() {
  const env = getServerEnv();
  const clientId = env.GOOGLE_CLIENT_ID;
  const redirectUri = env.GOOGLE_OAUTH_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Google OAuth nije konfigurisan (GOOGLE_CLIENT_ID / REDIRECT_URI)." },
      { status: 503 },
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: DEFAULT_GMAIL_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
