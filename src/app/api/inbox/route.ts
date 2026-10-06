import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDefaultWorkspace } from "@/lib/workspace";

export async function GET() {
  const workspace = await getDefaultWorkspace();
  const threads = await db.replyThread.findMany({
    where: { workspaceId: workspace.id },
    include: { lead: { select: { email: true, company: true } } },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ threads });
}
