import { CampaignStatus, EnrollmentStatus, LeadPipelineStatus, SequenceStepType } from "@prisma/client";
import { db } from "@/lib/db";
import { pickGmailAccountForCampaign } from "@/lib/gmail/pick-account";
import { sendEmailViaGmail } from "@/lib/gmail/send-message";

function renderTemplate(template: string, lead: {
  firstName?: string | null;
  company?: string | null;
  ownerName?: string | null;
  email: string;
}) {
  const firstName = lead.firstName ?? lead.ownerName?.split(" ")[0] ?? "tamo";
  const company = lead.company ?? "vaša firma";
  return template
    .replace(/\{\{firstName\}\}/gi, firstName)
    .replace(/\{\{company\}\}/gi, company)
    .replace(/\{\{email\}\}/gi, lead.email);
}

export async function processEnrollmentStep(enrollmentId: string) {
  const enrollment = await db.campaignEnrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      lead: true,
      campaign: { include: { sequence: { include: { steps: { orderBy: { orderIndex: "asc" } } } } } },
    },
  });
  if (!enrollment || enrollment.status !== EnrollmentStatus.ACTIVE) return;
  if (enrollment.campaign.status !== CampaignStatus.ACTIVE) return;

  const steps = enrollment.campaign.sequence?.steps ?? [];
  const step = steps.find((s) => s.orderIndex === enrollment.currentStepIndex);
  if (!step) {
    await db.campaignEnrollment.update({
      where: { id: enrollmentId },
      data: { status: EnrollmentStatus.COMPLETED },
    });
    return;
  }

  if (step.type === SequenceStepType.WAIT) {
    const config = step.config as { days?: number };
    const days = config.days ?? 3;
    const next = new Date();
    next.setDate(next.getDate() + days);
    await db.campaignEnrollment.update({
      where: { id: enrollmentId },
      data: { currentStepIndex: enrollment.currentStepIndex + 1, nextRunAt: next },
    });
    return;
  }

  if (step.type === SequenceStepType.EMAIL) {
    const config = step.config as { subject?: string; bodyText?: string };
    const accountId = await pickGmailAccountForCampaign(enrollment.campaignId);
    if (!accountId) throw new Error("Nema dostupnog Gmail naloga sa kvotom");

    const account = await db.gmailAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new Error("Gmail nalog nije pronađen");

    const subject = renderTemplate(config.subject ?? "Pozdrav", enrollment.lead);
    const bodyText = renderTemplate(
      config.bodyText ?? "Zdravo {{firstName}}, javljam se u vezi {{company}}.",
      enrollment.lead,
    );

    const idempotencyKey = `send:${enrollment.campaignId}:${enrollment.leadId}:${enrollment.currentStepIndex}`;

    await sendEmailViaGmail({
      workspaceId: enrollment.campaign.workspaceId,
      gmailAccountId: accountId,
      leadId: enrollment.leadId,
      campaignId: enrollment.campaignId,
      to: enrollment.lead.email,
      toName: enrollment.lead.ownerName ?? undefined,
      fromEmail: account.email,
      fromName: account.displayName ?? undefined,
      subject,
      bodyText,
      idempotencyKey,
      trackingOpens: enrollment.campaign.trackingOpens,
    });

    await db.lead.update({
      where: { id: enrollment.leadId },
      data: { leadStatus: LeadPipelineStatus.SENT },
    });

    const nextStepIndex = enrollment.currentStepIndex + 1;
    const hasNext = steps.some((s) => s.orderIndex === nextStepIndex);
    await db.campaignEnrollment.update({
      where: { id: enrollmentId },
      data: {
        currentStepIndex: nextStepIndex,
        nextRunAt: hasNext ? new Date() : null,
        status: hasNext ? EnrollmentStatus.ACTIVE : EnrollmentStatus.COMPLETED,
      },
    });
  }
}
