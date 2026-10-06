import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { DEFAULT_GMAIL_SCOPES, GMAIL_MODIFY_SCOPE } from "@/lib/gmail/scopes";
import { getDefaultWorkspace } from "@/lib/workspace";

export async function GET(request: Request) {
  const env = getServerEnv();
  const clientId = env.GOOGLE_CLIENT_ID;
  const redirectUri = env.GOOGLE_OAUTH_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Google OAuth nije konfigurisan (GOOGLE_CLIENT_ID / REDIRECT_URI)." },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const withInbox = url.searchParams.get("inbox") === "1";
  const scopes = withInbox ? [...DEFAULT_GMAIL_SCOPES, GMAIL_MODIFY_SCOPE] : [...DEFAULT_GMAIL_SCOPES];

  const state = randomBytes(16).toString("hex");
  const workspace = await getDefaultWorkspace();
  const cookieStore = await cookies();
  cookieStore.set("fom_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  cookieStore.set("fom_oauth_workspace", workspace.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes.join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
