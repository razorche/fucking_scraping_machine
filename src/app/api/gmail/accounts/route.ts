import { NextResponse } from "next/server";
import { getDefaultWorkspace } from "@/lib/workspace";
import { db } from "@/lib/db";

export async function GET() {
  const workspace = await getDefaultWorkspace();
  const accounts = await db.gmailAccount.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      displayName: true,
      health: true,
      healthMessage: true,
      dailySendLimit: true,
      sentToday: true,
      scopes: true,
      lastSyncAt: true,
      lastErrorAt: true,
      lastErrorMessage: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ accounts });
}
