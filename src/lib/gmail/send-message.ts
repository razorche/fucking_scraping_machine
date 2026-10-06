import { randomBytes } from "node:crypto";
import { SendOutcome } from "@prisma/client";
import { db } from "@/lib/db";
import { buildRfc2822Message } from "@/lib/gmail/mime";
import { getValidAccessToken } from "@/lib/gmail/google-oauth";
import { getClientEnv } from "@/lib/env";

export type SendEmailParams = {
  workspaceId: string;
  gmailAccountId: string;
  leadId: string;
  campaignId?: string;
  to: string;
  toName?: string;
  fromEmail: string;
  fromName?: string;
  subject: string;
  bodyText: string;
  idempotencyKey: string;
  trackingOpens?: boolean;
};

export async function sendEmailViaGmail(params: SendEmailParams) {
  const existing = await db.sendRecord.findUnique({
    where: { idempotencyKey: params.idempotencyKey },
  });
  if (existing?.outcome === SendOutcome.SENT) {
    return existing;
  }

  const record =
    existing ??
    (await db.sendRecord.create({
      data: {
        workspaceId: params.workspaceId,
        gmailAccountId: params.gmailAccountId,
        leadId: params.leadId,
        campaignId: params.campaignId,
        idempotencyKey: params.idempotencyKey,
        subject: params.subject,
        outcome: SendOutcome.QUEUED,
      },
    }));

  const accessToken = await getValidAccessToken(params.gmailAccountId);
  const appUrl = getClientEnv().NEXT_PUBLIC_APP_URL;
  const trackingToken = params.trackingOpens ? randomBytes(16).toString("hex") : undefined;
  const { raw } = buildRfc2822Message({
    from: params.fromEmail,
    fromName: params.fromName,
    to: params.to,
    toName: params.toName,
    subject: params.subject,
    bodyText: params.bodyText,
    trackingToken,
    appBaseUrl: appUrl,
  });

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });

  if (!res.ok) {
    const errText = await res.text();
    await db.sendRecord.update({
      where: { id: record.id },
      data: {
        outcome: SendOutcome.FAILED,
        errorCode: String(res.status),
        errorMessage: errText.slice(0, 500),
      },
    });
    await db.gmailAccount.update({
      where: { id: params.gmailAccountId },
      data: {
        lastErrorAt: new Date(),
        lastErrorMessage: errText.slice(0, 500),
      },
    });
    throw new Error(`Gmail send failed: ${res.status}`);
  }

  const data = (await res.json()) as { id?: string; threadId?: string };
  await db.$transaction([
    db.sendRecord.update({
      where: { id: record.id },
      data: {
        outcome: SendOutcome.SENT,
        gmailMessageId: data.id,
        threadId: data.threadId,
        sentAt: new Date(),
      },
    }),
    db.gmailAccount.update({
      where: { id: params.gmailAccountId },
      data: { sentToday: { increment: 1 } },
    }),
  ]);

  if (trackingToken) {
    await db.trackingEvent.create({
      data: {
        sendRecordId: record.id,
        type: "open",
        token: trackingToken,
      },
    });
  }

  return db.sendRecord.findUnique({ where: { id: record.id } });
}
