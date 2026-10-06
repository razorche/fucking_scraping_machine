import { NextResponse } from "next/server";
import { SendOutcome } from "@prisma/client";
import { db } from "@/lib/db";
import { getDefaultWorkspace } from "@/lib/workspace";

export async function GET() {
  const workspace = await getDefaultWorkspace();
  const [leads, accounts, sent, failed, campaigns, opens] = await Promise.all([
    db.lead.count({ where: { workspaceId: workspace.id } }),
    db.gmailAccount.count({ where: { workspaceId: workspace.id, health: "CONNECTED" } }),
    db.sendRecord.count({ where: { workspaceId: workspace.id, outcome: SendOutcome.SENT } }),
    db.sendRecord.count({ where: { workspaceId: workspace.id, outcome: SendOutcome.FAILED } }),
    db.campaign.count({ where: { workspaceId: workspace.id } }),
    db.trackingEvent.count({
      where: { type: "open", sendRecord: { workspaceId: workspace.id } },
    }),
  ]);

  return NextResponse.json({ leads, accounts, sent, failed, campaigns, opens });
}
