import { NextResponse } from "next/server";
import { launchCampaign } from "@/lib/campaigns/launch";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  try {
    const result = await launchCampaign(id);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Launch failed" },
      { status: 400 },
    );
  }
}
