import { NextResponse } from "next/server";
import { GmailAccountHealth } from "@prisma/client";
import { db } from "@/lib/db";
import { getDefaultWorkspace } from "@/lib/workspace";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const workspace = await getDefaultWorkspace();
  const account = await db.gmailAccount.findFirst({
    where: { id, workspaceId: workspace.id },
  });
  if (!account) {
    return NextResponse.json({ error: "Nalog nije pronađen" }, { status: 404 });
  }
  await db.gmailAccount.update({
    where: { id },
    data: { health: GmailAccountHealth.REVOKED, healthMessage: "Diskonektovano iz FOM" },
  });
  return NextResponse.json({ ok: true });
}
