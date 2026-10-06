import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { GmailAccountHealth } from "@prisma/client";
import { db } from "@/lib/db";
import {
  encryptTokens,
  exchangeCodeForTokens,
  fetchGoogleUserEmail,
} from "@/lib/gmail/google-oauth";
import { getDefaultWorkspace } from "@/lib/workspace";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const savedState = cookieStore.get("fom_oauth_state")?.value;
  const workspaceId = cookieStore.get("fom_oauth_workspace")?.value;

  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.redirect(new URL("/naloge?error=oauth_state", request.url));
  }

  try {
    const workspace = workspaceId
      ? await db.workspace.findUnique({ where: { id: workspaceId } })
      : await getDefaultWorkspace();
    if (!workspace) throw new Error("Workspace missing");

    const tokens = await exchangeCodeForTokens(code);
    tokens.expiry_date = Date.now() + 3500 * 1000;
    const email = await fetchGoogleUserEmail(tokens.access_token);
    const scopes = (tokens.scope ?? "").split(" ").filter(Boolean);

    await db.gmailAccount.upsert({
      where: { workspaceId_email: { workspaceId: workspace.id, email } },
      create: {
        workspaceId: workspace.id,
        email,
        displayName: email.split("@")[0],
        scopes: scopes.length ? scopes : ["https://www.googleapis.com/auth/gmail.send"],
        encryptedTokens: encryptTokens(tokens),
        tokenKeyId: "v1",
        health: GmailAccountHealth.CONNECTED,
      },
      update: {
        encryptedTokens: encryptTokens(tokens),
        scopes: scopes.length ? scopes : undefined,
        health: GmailAccountHealth.CONNECTED,
        healthMessage: null,
      },
    });

    cookieStore.delete("fom_oauth_state");
    cookieStore.delete("fom_oauth_workspace");
    return NextResponse.redirect(new URL("/naloge?connected=1", request.url));
  } catch {
    return NextResponse.redirect(new URL("/naloge?error=oauth_exchange", request.url));
  }
}
