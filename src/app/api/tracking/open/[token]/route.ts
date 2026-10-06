import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const event = await db.trackingEvent.findUnique({ where: { token } });
  if (event && event.type === "open") {
    await db.trackingEvent.update({
      where: { token },
      data: {
        userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? undefined,
        occurredAt: new Date(),
      },
    });
  }

  return new NextResponse(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    },
  });
}
