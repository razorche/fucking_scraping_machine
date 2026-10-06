import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const checks = {
    supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabasePublishable: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    supabaseSecret: Boolean(process.env.SUPABASE_SECRET_KEY),
    databaseUrl: Boolean(
      process.env.DATABASE_URL &&
        !process.env.DATABASE_URL.includes("YOUR_DB_PASSWORD"),
    ),
    googleApiKey: Boolean(process.env.GOOGLE_API_KEY),
    googleOAuth: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    encryptionKey: Boolean(process.env.FOM_TOKEN_ENCRYPTION_KEY),
  };

  let dbOk = false;
  let dbError: string | undefined;
  if (checks.databaseUrl) {
    try {
      await db.workspace.count();
      dbOk = true;
    } catch (e) {
      dbError = e instanceof Error ? e.message : "DB connection failed";
    }
  }

  return NextResponse.json({
    ok: dbOk,
    checks,
    dbOk,
    dbError,
    hint: !checks.databaseUrl
      ? "U .env zameni YOUR_DB_PASSWORD lozinkom baze iz Supabase Dashboard."
      : !checks.googleOAuth
        ? "Za Gmail povezivanje kreiraj OAuth 2.0 Client ID u Google Cloud (nije dovoljan samo API key)."
        : undefined,
  });
}
