import { NextResponse } from "next/server";
import { QueueJobStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { processEnrollmentStep } from "@/lib/queue/process-enrollment";

export async function GET(request: Request) {
  return runQueue(request);
}

export async function POST(request: Request) {
  return runQueue(request);
}

async function runQueue(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";
  if (secret && auth !== `Bearer ${secret}` && !isVercelCron) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jobs = await db.queueJob.findMany({
    where: { status: QueueJobStatus.PENDING, runAfter: { lte: new Date() } },
    orderBy: { runAfter: "asc" },
    take: 20,
  });

  let processed = 0;
  let failed = 0;

  for (const job of jobs) {
    const locked = await db.queueJob.updateMany({
      where: { id: job.id, status: QueueJobStatus.PENDING },
      data: { status: QueueJobStatus.RUNNING, lockedAt: new Date(), attempts: { increment: 1 } },
    });
    if (locked.count === 0) continue;

    try {
      if (job.type === "PROCESS_ENROLLMENT") {
        const payload = job.payload as { enrollmentId?: string };
        if (!payload.enrollmentId) throw new Error("Missing enrollmentId");
        await processEnrollmentStep(payload.enrollmentId);

        const enrollment = await db.campaignEnrollment.findUnique({
          where: { id: payload.enrollmentId },
        });
        if (enrollment?.nextRunAt && enrollment.nextRunAt > new Date()) {
          await db.queueJob.create({
            data: {
              workspaceId: job.workspaceId,
              campaignId: job.campaignId,
              type: "PROCESS_ENROLLMENT",
              idempotencyKey: `enrollment:${enrollment.id}:step:${enrollment.currentStepIndex}:${enrollment.nextRunAt.getTime()}`,
              payload: { enrollmentId: enrollment.id },
              runAfter: enrollment.nextRunAt,
            },
          });
        } else if (enrollment?.status === "ACTIVE") {
          await db.queueJob.create({
            data: {
              workspaceId: job.workspaceId,
              campaignId: job.campaignId,
              type: "PROCESS_ENROLLMENT",
              idempotencyKey: `enrollment:${enrollment.id}:step:${enrollment.currentStepIndex}:now:${Date.now()}`,
              payload: { enrollmentId: enrollment.id },
              runAfter: new Date(),
            },
          });
        }
      }

      await db.queueJob.update({
        where: { id: job.id },
        data: { status: QueueJobStatus.SUCCEEDED, lastError: null },
      });
      processed++;
    } catch (e) {
      failed++;
      const message = e instanceof Error ? e.message : "Unknown error";
      const dead = job.attempts + 1 >= job.maxAttempts;
      await db.queueJob.update({
        where: { id: job.id },
        data: {
          status: dead ? QueueJobStatus.DEAD : QueueJobStatus.PENDING,
          lastError: message,
          runAfter: dead ? job.runAfter : new Date(Date.now() + 60_000 * (job.attempts + 1)),
        },
      });
    }
  }

  return NextResponse.json({ processed, failed, picked: jobs.length });
}
