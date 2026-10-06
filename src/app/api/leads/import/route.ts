import { NextResponse } from "next/server";
import { z } from "zod";
import { parseUploadBuffer } from "@/lib/import/parsers";
import { commitLeadImport } from "@/lib/import/commit-import";
import { getDefaultWorkspace } from "@/lib/workspace";
import { normalizeEmailForDedupe } from "@/lib/leads/normalize-email";
import { db } from "@/lib/db";

const MAX_BYTES = 25 * 1024 * 1024;

export async function POST(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") ?? "preview";
  const workspace = await getDefaultWorkspace();

  if (mode === "commit") {
    const body = await request.json();
    const schema = z.object({
      fileName: z.string(),
      leads: z.array(
        z.object({
          email: z.string(),
          company: z.string().optional(),
          ownerName: z.string().optional(),
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          dotNumber: z.string().optional(),
          powerUnits: z.number().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          phone: z.string().optional(),
          website: z.string().optional(),
          source: z.string().optional(),
          sourceFile: z.string().optional(),
          sourceRow: z.number().optional(),
        }),
      ),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Neispravan payload za commit." }, { status: 400 });
    }
    const result = await commitLeadImport(workspace.id, parsed.data.fileName, parsed.data.leads);
    return NextResponse.json(result);
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fajl nije prosleđen." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Fajl prelazi 25MB limit." }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const parseResult = await parseUploadBuffer(buffer, file.name);

  const existing = await db.lead.findMany({
    where: { workspaceId: workspace.id },
    select: { emailNormalized: true },
  });
  const existingSet = new Set(existing.map((l) => l.emailNormalized));
  const suppressions = await db.suppressionEntry.findMany({ where: { workspaceId: workspace.id } });
  const suppressedSet = new Set(suppressions.map((s) => s.email.toLowerCase()));

  let duplicates = 0;
  let suppressed = 0;
  const seen = new Set<string>();
  for (const lead of parseResult.leads) {
    const key = normalizeEmailForDedupe(lead.email);
    if (suppressedSet.has(lead.email.toLowerCase())) suppressed++;
    else if (existingSet.has(key) || seen.has(key)) duplicates++;
    seen.add(key);
  }

  return NextResponse.json({
    ...parseResult,
    dedupe: {
      duplicates,
      suppressed,
      newLeads: parseResult.leads.length - duplicates - suppressed,
    },
    fileName: file.name,
  });
}
