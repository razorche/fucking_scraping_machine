import { LeadPipelineStatus, LeadVerificationStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { normalizeEmail, normalizeEmailForDedupe } from "@/lib/leads/normalize-email";
import type { ParsedLeadInput } from "@/lib/import/types";

export type CommitImportResult = {
  imported: number;
  duplicates: number;
  suppressed: number;
  invalid: number;
  jobId: string;
};

export async function commitLeadImport(
  workspaceId: string,
  fileName: string,
  leads: ParsedLeadInput[],
): Promise<CommitImportResult> {
  const job = await db.leadImportJob.create({
    data: { workspaceId, fileName, status: "processing" },
  });

  const suppressions = await db.suppressionEntry.findMany({ where: { workspaceId } });
  const suppressedSet = new Set(suppressions.map((s) => normalizeEmail(s.email)));

  const existing = await db.lead.findMany({
    where: { workspaceId },
    select: { emailNormalized: true },
  });
  const existingSet = new Set(existing.map((l) => l.emailNormalized));

  let imported = 0;
  let duplicates = 0;
  let suppressed = 0;
  let invalid = 0;
  const seenBatch = new Set<string>();

  for (const row of leads) {
    const email = normalizeEmail(row.email);
    const emailNormalized = normalizeEmailForDedupe(email);
    if (!email.includes("@")) {
      invalid++;
      continue;
    }
    if (suppressedSet.has(email)) {
      suppressed++;
      continue;
    }
    if (existingSet.has(emailNormalized) || seenBatch.has(emailNormalized)) {
      duplicates++;
      continue;
    }
    seenBatch.add(emailNormalized);

    await db.lead.create({
      data: {
        workspaceId,
        email,
        emailNormalized,
        company: row.company,
        ownerName: row.ownerName,
        firstName: row.firstName,
        lastName: row.lastName,
        dotNumber: row.dotNumber,
        powerUnits: row.powerUnits,
        city: row.city,
        state: row.state,
        phone: row.phone,
        website: row.website,
        source: row.source,
        leadStatus: LeadPipelineStatus.READY,
        verificationStatus: LeadVerificationStatus.VALID_FORMAT,
        sourceMeta: {
          sourceFile: row.sourceFile,
          sourceRow: row.sourceRow,
        },
      },
    });
    existingSet.add(emailNormalized);
    imported++;
  }

  await db.leadImportJob.update({
    where: { id: job.id },
    data: {
      status: "completed",
      stats: { imported, duplicates, suppressed, invalid },
    },
  });

  return { imported, duplicates, suppressed, invalid, jobId: job.id };
}
