import { GmailAccountHealth } from "@prisma/client";
import { db } from "@/lib/db";

export async function pickGmailAccountForCampaign(campaignId: string): Promise<string | null> {
  const links = await db.campaignGmailAccount.findMany({
    where: { campaignId, enabled: true },
    orderBy: { priority: "asc" },
    include: { gmailAccount: true },
  });

  const eligible = links
    .map((l) => l.gmailAccount)
    .filter(
      (a) =>
        a.health === GmailAccountHealth.CONNECTED && a.sentToday < a.dailySendLimit,
    )
    .sort((a, b) => a.sentToday - b.sentToday);

  return eligible[0]?.id ?? null;
}
