import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDefaultWorkspace } from "@/lib/workspace";

export async function GET(request: Request) {
  const workspace = await getDefaultWorkspace();
  const url = new URL(request.url);
  const search = url.searchParams.get("q")?.trim();
  const state = url.searchParams.get("state");
  const take = Math.min(parseInt(url.searchParams.get("take") ?? "100", 10), 500);
  const skip = parseInt(url.searchParams.get("skip") ?? "0", 10);

  const where = {
    workspaceId: workspace.id,
    ...(state && state !== "ALL" ? { state } : {}),
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { company: { contains: search, mode: "insensitive" as const } },
            { ownerName: { contains: search, mode: "insensitive" as const } },
            { dotNumber: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    db.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    db.lead.count({ where }),
  ]);

  return NextResponse.json({ items, total });
}
