import { NextResponse } from "next/server";
import { requireRole } from "@/lib/guard";

// TEMPORARY: delete this file once the Blob token issue is confirmed fixed.
// Never returns the actual secret — only whether it exists and its length,
// which is enough to tell whether the env var reached this deployment.
export async function GET() {
  const session = await requireRole(["ADMIN"]);
  if (!session) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const token = process.env.BLOB_READ_WRITE_TOKEN;

  return NextResponse.json({
    hasToken: !!token,
    tokenLength: token ? token.length : 0,
    tokenPrefix: token ? token.slice(0, 14) : null,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV || null,
  });
}
