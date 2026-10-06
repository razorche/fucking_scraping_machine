import {
  CampaignStatus,
  EnrollmentStatus,
  GmailAccountHealth,
  LeadPipelineStatus,
  QueueJobStatus,
} from "@prisma/client";
import { db } from "@/lib/db";

export async function launchCampaign(campaignId: string) {
  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
    include: {
      gmailAccounts: { where: { enabled: true }, include: { gmailAccount: true } },
      sequence: { include: { steps: true } },
    },
  });
  if (!campaign) throw new Error("Kampanja ne postoji");
  if (!campaign.sequence || campaign.sequence.steps.length === 0) {
    throw new Error("Kampanja nema sekvencu");
  }
  const healthyAccounts = campaign.gmailAccounts.filter(
    (g) => g.gmailAccount.health === GmailAccountHealth.CONNECTED,
  );
  if (healthyAccounts.length === 0) {
    throw new Error("Nema povezanih Gmail naloga za kampanju");
  }

  const leads = await db.lead.findMany({
    where: {
      workspaceId: campaign.workspaceId,
      leadStatus: { in: [LeadPipelineStatus.NEW, LeadPipelineStatus.READY] },
    },
    take: 5000,
  });
  if (leads.length === 0) throw new Error("Nema eligible lidova");

  let enrolled = 0;
  for (const lead of leads) {
    const enrollment = await db.campaignEnrollment.upsert({
      where: { campaignId_leadId: { campaignId, leadId: lead.id } },
      create: {
        campaignId,
        leadId: lead.id,
        status: EnrollmentStatus.ACTIVE,
        currentStepIndex: 0,
        nextRunAt: new Date(),
      },
      update: {
        status: EnrollmentStatus.ACTIVE,
        currentStepIndex: 0,
        nextRunAt: new Date(),
      },
    });

    await db.queueJob.upsert({
      where: { idempotencyKey: `enrollment:${enrollment.id}:step:0` },
      create: {
        workspaceId: campaign.workspaceId,
        campaignId,
        type: "PROCESS_ENROLLMENT",
        idempotencyKey: `enrollment:${enrollment.id}:step:0`,
        payload: { enrollmentId: enrollment.id },
        status: QueueJobStatus.PENDING,
        runAfter: new Date(),
      },
      update: { status: QueueJobStatus.PENDING, runAfter: new Date() },
    });
    enrolled++;
  }

  await db.campaign.update({
    where: { id: campaignId },
    data: { status: CampaignStatus.ACTIVE, launchedAt: new Date() },
  });

  return { enrolled };
}
