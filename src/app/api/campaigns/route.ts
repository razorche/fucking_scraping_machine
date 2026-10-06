import { NextResponse } from "next/server";
import { z } from "zod";
import { CampaignStatus, SequenceStepType } from "@prisma/client";
import { db } from "@/lib/db";
import { getDefaultWorkspace } from "@/lib/workspace";
import { launchCampaign } from "@/lib/campaigns/launch";

export async function GET() {
  const workspace = await getDefaultWorkspace();
  const campaigns = await db.campaign.findMany({
    where: { workspaceId: workspace.id },
    include: {
      _count: { select: { enrollments: true } },
      gmailAccounts: { include: { gmailAccount: { select: { email: true, id: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ campaigns });
}

const createSchema = z.object({
  name: z.string().min(1),
  gmailAccountIds: z.array(z.string()).min(1),
  subject1: z.string().min(1),
  body1: z.string().min(1),
  subject2: z.string().optional(),
  body2: z.string().optional(),
  waitDays: z.number().int().min(1).max(30).default(3),
  launch: z.boolean().default(false),
});

export async function POST(request: Request) {
  const workspace = await getDefaultWorkspace();
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Neispravan unos kampanje" }, { status: 400 });
  }

  const data = parsed.data;
  const steps = [
    {
      orderIndex: 0,
      type: SequenceStepType.EMAIL,
      name: "Email 1",
      config: { subject: data.subject1, bodyText: data.body1 },
    },
    {
      orderIndex: 1,
      type: SequenceStepType.WAIT,
      name: "Čekanje",
      config: { days: data.waitDays },
    },
  ];
  if (data.subject2 && data.body2) {
    steps.push({
      orderIndex: 2,
      type: SequenceStepType.EMAIL,
      name: "Email 2",
      config: { subject: data.subject2, bodyText: data.body2 },
    });
  }

  const campaign = await db.campaign.create({
    data: {
      workspaceId: workspace.id,
      name: data.name,
      status: CampaignStatus.DRAFT,
      sendingAccountId: data.gmailAccountIds[0],
      gmailAccounts: {
        create: data.gmailAccountIds.map((id, priority) => ({
          gmailAccountId: id,
          priority,
          enabled: true,
        })),
      },
      sequence: {
        create: {
          steps: { create: steps },
        },
      },
    },
    include: { sequence: { include: { steps: true } } },
  });

  if (data.launch) {
    const result = await launchCampaign(campaign.id);
    return NextResponse.json({ campaign, launch: result });
  }

  return NextResponse.json({ campaign });
}
