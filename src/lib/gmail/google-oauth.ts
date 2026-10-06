import { GmailAccountHealth } from "@prisma/client";
import { db } from "@/lib/db";
import { decryptSecret, encryptSecret } from "@/lib/crypto/token-vault";
import { getServerEnv } from "@/lib/env";

export type StoredTokens = {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
  scope?: string;
};

export function getOAuthConfig() {
  const env = getServerEnv();
  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  const redirectUri = env.GOOGLE_OAUTH_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Google OAuth nije konfigurisan.");
  }
  return { clientId, clientSecret, redirectUri };
}

export async function exchangeCodeForTokens(code: string): Promise<StoredTokens> {
  const { clientId, clientSecret, redirectUri } = getOAuthConfig();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${text}`);
  }
  return (await res.json()) as StoredTokens;
}

export async function refreshAccessToken(refreshToken: string): Promise<StoredTokens> {
  const { clientId, clientSecret } = getOAuthConfig();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    throw new Error("Refresh token failed");
  }
  const data = (await res.json()) as StoredTokens;
  return { ...data, refresh_token: refreshToken };
}

export function encryptTokens(tokens: StoredTokens): string {
  const key = process.env.FOM_TOKEN_ENCRYPTION_KEY;
  if (!key) throw new Error("FOM_TOKEN_ENCRYPTION_KEY missing");
  return encryptSecret(JSON.stringify(tokens), key);
}

export function decryptTokens(ciphertext: string): StoredTokens {
  const key = process.env.FOM_TOKEN_ENCRYPTION_KEY;
  if (!key) throw new Error("FOM_TOKEN_ENCRYPTION_KEY missing");
  return JSON.parse(decryptSecret(ciphertext, key)) as StoredTokens;
}

export async function getValidAccessToken(accountId: string): Promise<string> {
  const account = await db.gmailAccount.findUnique({ where: { id: accountId } });
  if (!account) throw new Error("Gmail nalog nije pronađen");
  let tokens = decryptTokens(account.encryptedTokens);
  const now = Date.now();
  if (tokens.expiry_date && tokens.expiry_date > now + 60_000) {
    return tokens.access_token;
  }
  if (!tokens.refresh_token) {
    await db.gmailAccount.update({
      where: { id: accountId },
      data: { health: GmailAccountHealth.TOKEN_EXPIRED, healthMessage: "Nema refresh tokena" },
    });
    throw new Error("REAUTH_REQUIRED");
  }
  tokens = await refreshAccessToken(tokens.refresh_token);
  tokens.expiry_date = Date.now() + 3500 * 1000;
  await db.gmailAccount.update({
    where: { id: accountId },
    data: {
      encryptedTokens: encryptTokens(tokens),
      health: GmailAccountHealth.CONNECTED,
      healthMessage: null,
    },
  });
  return tokens.access_token;
}

export async function fetchGoogleUserEmail(accessToken: string): Promise<string> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Ne mogu da pročitam Google profil");
  const data = (await res.json()) as { email?: string };
  if (!data.email) throw new Error("Email nije vraćen iz Google profila");
  return data.email.toLowerCase();
}
